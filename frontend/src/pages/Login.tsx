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
 * Si falla cualquier paso, NO bloqueamos el login. El usuario cae al caso
 * B-04 (form "Completa tu perfil") como backup.
 *
 * Fix C-1 (code review B-20): recibimos `refreshPerfil` y lo llamamos tras
 * el upsert link exitoso. Sin esto, hay un race condition con el listener
 * `onAuthStateChange` de useAuth: el listener corre `loadPerfil` en paralelo
 * (puede terminar ANTES del INSERT) y deja `paciente=null`, lo que hace que
 * `if (user)` en el render redirija a /registro y el bug original regrese
 * intermitentemente (estimado 20-40% según latencia de red).
 */
async function completarRegistroPendiente(
  refreshPerfil: () => Promise<void>,
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
    const { data: userData } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS)
    if (!userData?.user) return

    // Verificar cédula no esté en uso (caso edge: usuario reintenta con
    // misma cédula tras un fallo previo).
    const { data: existing } = await withTimeout(
      supabase.from('pacientes').select('id').eq('cedula', pendiente.cedula).maybeSingle(),
      AUTH_TIMEOUT_MS,
    )
    if (existing) {
      // Paciente con esa cédula ya existe — quizá del intento anterior.
      // Linkear directamente sin insertar de nuevo.
      const linkData = existing as { id: string }
      await withTimeout(
        supabase
          .from('auth_paciente_link')
          .upsert(
            { auth_uid: userData.user.id, paciente_id: linkData.id },
            { onConflict: 'auth_uid' },
          ),
        AUTH_TIMEOUT_MS,
      )
      // Fix C-1: refrescar perfil para ganar la carrera contra el listener.
      await withTimeout(refreshPerfil(), AUTH_TIMEOUT_MS)
      return
    }

    // Insertar paciente nuevo
    const { data: pac } = await withTimeout(
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
    if (!pac) return

    const pacData = pac as { id: string }
    await withTimeout(
      supabase
        .from('auth_paciente_link')
        .upsert(
          { auth_uid: userData.user.id, paciente_id: pacData.id },
          { onConflict: 'auth_uid' },
        ),
      AUTH_TIMEOUT_MS,
    )
    // Fix C-1: refrescar perfil para ganar la carrera contra el listener.
    // Sin esto, onAuthStateChange podría leer paciente=null antes del INSERT
    // y `if (user)` del render redirigiría a /registro mostrando el bug.
    await withTimeout(refreshPerfil(), AUTH_TIMEOUT_MS)
  } catch (err) {
    // No bloqueamos el login si falla esto. El usuario cae al caso B-04.
    console.error('[Login] completarRegistroPendiente:', err)
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
      await completarRegistroPendiente(refreshPerfil)
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
