import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Bug B-20: tras signIn, completar el perfil del paciente si Register.tsx
 * dejó datos en sessionStorage (caso "nuevo usuario tras registro").
 *
 * Esta función se llama DESPUÉS de signInWithPassword OK porque solo
 * en ese momento el cliente tiene JWT válido y las RLS de auth_paciente_link
 * (que requieren auth.uid() = auth_uid) pasan correctamente.
 *
 * Fix C-1 (code review B-20): recibimos `refreshPerfil` y lo llamamos tras
 * el upsert link exitoso. Cierra la carrera con `onAuthStateChange` listener.
 *
 * Fix B-20.2 (reporte PO mariana@gmail.com): DOS cambios criticos:
 *   1. POLLING DE SESSION: signInWithPassword resuelve "OK" pero el JWT puede
 *      tardar 100-500ms en propagarse al cliente. Si hacemos el UPSERT link
 *      en ese intervalo, `auth.uid()` de la RLS retorna NULL y el insert
 *      falla silente (Supabase devuelve { error: ... } sin lanzar). Polling
 *      hasta 3s con getSession() garantiza que el JWT este activo antes de
 *      cualquier query que dependa de RLS.
 *   2. ERRORES VISIBLES: aceptar `setError` callback y mostrar el mensaje
 *      real al usuario en pantalla en lugar de tragarlo en console.error.
 *      Asi si algo falla, vemos EXACTAMENTE que paso (RLS rejected, cedula
 *      duplicada, timeout, etc) sin necesidad de DevTools.
 */
async function completarRegistroPendiente(
  refreshPerfil: () => Promise<void>,
  setError: (msg: string | null) => void,
): Promise<void> {
  const pendienteJson = sessionStorage.getItem('helios_pending_paciente')
  if (!pendienteJson) return // No hay registro pendiente, no hay nada que hacer

  let pendiente: {
    nombre: string
    cedula: string
    telefono: string | null
    correo: string
  }
  try {
    pendiente = JSON.parse(pendienteJson)
  } catch {
    sessionStorage.removeItem('helios_pending_paciente')
    return
  }

  try {
    /**
     * Fix B-20.2 paso 1: esperar a que el JWT propague tras signInWithPassword.
     * Polling cada 200ms hasta 3s. Sin esto, el siguiente UPSERT puede
     * encontrar auth.uid() NULL en RLS y fallar silente.
     */
    let sessionReady = false
    for (let i = 0; i < 15; i++) {
      const { data } = await supabase.auth.getSession()
      if (data.session?.access_token && data.session.user) {
        sessionReady = true
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    if (!sessionReady) {
      setError('Sesión no disponible tras login. Recarga la página e intenta de nuevo.')
      return
    }

    const { data: userData } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS)
    if (!userData?.user) {
      setError('No se pudo verificar tu usuario tras login. Recarga la página.')
      return
    }
    const authUid = userData.user.id

    // Verificar cédula no esté en uso (caso edge: usuario reintenta con
    // misma cédula tras un fallo previo).
    const { data: existing, error: checkError } = await withTimeout(
      supabase.from('pacientes').select('id').eq('cedula', pendiente.cedula).maybeSingle(),
      AUTH_TIMEOUT_MS,
    )
    if (checkError) {
      setError(`Error verificando cédula: ${checkError.message}`)
      return
    }

    let pacienteId: string
    if (existing) {
      // Paciente con esa cédula ya existe — quizá del intento anterior.
      pacienteId = (existing as { id: string }).id
    } else {
      // Insertar paciente nuevo, con manejo explícito de error
      const { data: pac, error: insertError } = await withTimeout(
        supabase
          .from('pacientes')
          .insert({
            nombre: pendiente.nombre,
            cedula: pendiente.cedula,
            telefono: pendiente.telefono,
            correo: pendiente.correo,
          })
          .select()
          .single(),
        AUTH_TIMEOUT_MS,
      )
      if (insertError) {
        setError(`Error creando paciente: ${insertError.message}`)
        return
      }
      if (!pac) {
        setError('No se pudo crear el paciente (sin datos).')
        return
      }
      pacienteId = (pac as { id: string }).id
    }

    // UPSERT link con manejo explícito de error (el bug original era tragarlo)
    const { error: linkError } = await withTimeout(
      supabase
        .from('auth_paciente_link')
        .upsert(
          { auth_uid: authUid, paciente_id: pacienteId },
          { onConflict: 'auth_uid' },
        ),
      AUTH_TIMEOUT_MS,
    )
    if (linkError) {
      setError(`Error vinculando cuenta con paciente: ${linkError.message}`)
      return
    }

    // Fix C-1: refrescar perfil para ganar la carrera contra el listener.
    await withTimeout(refreshPerfil(), AUTH_TIMEOUT_MS)
  } catch (err) {
    console.error('[Login] completarRegistroPendiente:', err)
    if (err instanceof TimeoutError) {
      setError('Timeout completando registro. Recarga la página e intenta de nuevo.')
    } else {
      const msg = err instanceof Error ? err.message : 'error inesperado'
      setError(`Error completando registro: ${msg}`)
    }
  } finally {
    sessionStorage.removeItem('helios_pending_paciente')
  }
}

export function Login() {
  const location = useLocation()
  const { user, paciente, role, loading, refreshPerfil } = useAuth()

  // Bug B-20: state que viene del Register tras crear cuenta nueva.
  const fromRegistro = (location.state as { registroExitoso?: boolean } | null)
    ?.registroExitoso === true
  const emailPrellenado =
    (location.state as { email?: string } | null)?.email ?? ''

  const [email, setEmail] = useState(emailPrellenado)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Bug B-16: si loading=true (perfil cargando), mostrar spinner ANTES
  // de evaluar Navigate. Sin esto, el bloque "if (user)" podia redirigir
  // a /registro cuando role era null transitorio (mientras loadPerfil
  // estaba en vuelo), causando flash de "Completa tu perfil" para medicos.
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  // Bug B-13: redirect segun rol. Medico → /medico, paciente → /agendar,
  // sin perfil (cuenta auth sin link) → /registro (completar perfil).
  if (user) {
    if (role === 'medico') return <Navigate to="/medico" replace />
    if (role === 'paciente') return <Navigate to="/agendar" replace />
    return <Navigate to="/registro" replace />
  }
  // Variable paciente queda referenciada para mantener el contrato del hook
  void paciente

  /**
   * Bug B-10 fix: try/catch/finally + withTimeout garantiza que
   * setSubmitting(false) siempre se ejecute, incluso si Supabase nunca
   * responde. Antes, un signInWithPassword colgado dejaba el spinner
   * eterno y el botón disabled sin forma de reintentar.
   *
   * Bug B-20: tras signIn exitoso, intentar completar registro pendiente
   * (si Register.tsx dejo datos en sessionStorage). Esto inserta el
   * paciente + link con JWT garantizado, evitando el race de session=null.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
      )
      if (signInError) {
        setError(signInError.message)
        return
      }
      // Bug B-20: aquí ya tenemos JWT activo. Completar perfil si hay
      // registro pendiente. La función NO lanza errores que bloqueen el login.
      // Fix C-1: pasamos refreshPerfil para que la función fuerce a useAuth
      // a recargar paciente tras el INSERT, evitando que el listener vea null.
      // Fix B-20.2: pasamos setError para que cualquier fallo se muestre EN
      // PANTALLA con detalle (en lugar de solo console.error). Asi el PO
      // puede diagnosticar sin abrir DevTools.
      await completarRegistroPendiente(refreshPerfil, setError)
      // Bug B-16: el redirect lo hace el bloque "if (user)" de arriba en
      // el re-render que dispara setSubmitting(false) + el cambio de auth
      // de Supabase. NO hacemos navigate manual aqui para evitar quedar
      // momentaneamente en '/' o /agendar antes de que role este resuelto.
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.')
      } else {
        console.error('[Login] handleSubmit unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Accede a tu cuenta para agendar y consultar tus citas.
        </p>

        {/* Bug B-20: banner verde cuando viene del registro exitoso */}
        {fromRegistro && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-helios-primary/30 bg-helios-primary/10 px-4 py-3 text-sm text-helios-deep"
          >
            <strong>Cuenta creada con éxito.</strong> Inicia sesión con tu correo y
            contraseña para entrar al sistema.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-helios-ink/60">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-helios-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
