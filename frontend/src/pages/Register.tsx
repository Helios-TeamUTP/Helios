import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  isValidCedulaPanama,
  normalizeCedula,
  detectarTipoCedula,
  EJEMPLOS_CEDULA,
} from '../lib/cedula'
import { validarTelefonoPanama, validarNombre, validarEmail } from '../lib/validaciones'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/** Texto de ejemplos de cédula para la ayuda visual (B-22). */
const EJEMPLOS_TEXTO = EJEMPLOS_CEDULA.map((e) => e.ejemplo).join('  ·  ')

export function Register() {
  const navigate = useNavigate()
  const { user, paciente, role, loading, loadPerfilFailed, refreshPerfil } = useAuth()
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    cedulaConfirm: '', // B-23: doble confirmación de cédula
    telefono: '',
    correo: '',
    password: '',
    passwordConfirm: '', // B-23: doble confirmación de contraseña
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Caso 1: aun cargando sesion -> mostrar spinner
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  // Caso 2: usuario completamente registrado (auth + paciente) -> ir a agendar
  if (user && paciente) {
    return <Navigate to="/agendar" replace />
  }

  // Bug B-16: si el user es medico (no paciente), redirigir a /medico.
  // Sin esto, un medico que caia en /registro por accidente (race condition
  // post-login antes de que role estuviera calculado) veia el form de
  // "Completa tu perfil" confuso.
  if (user && role === 'medico') {
    return <Navigate to="/medico" replace />
  }

  /**
   * Bug B-17: si loadPerfil fallo (timeout, error de red, RLS rota), NO
   * asumir que es un paciente nuevo que debe completar perfil. Mostrar
   * mensaje de error claro con boton reintentar. Sin esto, un medico cuyo
   * loadPerfil fallaba caia aqui y veia "Completa tu perfil de paciente",
   * lo cual era falso (el ya tiene perfil de medico).
   */
  if (user && loadPerfilFailed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <h2 className="text-lg font-bold text-helios-ink">
            No pudimos cargar tu perfil
          </h2>
          <p className="mt-2 text-sm text-helios-ink/70">
            Hubo un problema al verificar tu cuenta. Esto puede ser por una
            conexión lenta. Intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshPerfil()
            }}
            className="btn-primary mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Caso 3: tiene auth pero NO tiene paciente -> completar perfil
  const isCompletingProfile = !!user && !paciente

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // B-22: tipo de cédula detectado en vivo (ayuda visual mientras escribe).
  const tipoCedula = form.cedula.trim() ? detectarTipoCedula(form.cedula) : null

  /**
   * Bug B-10 fix: try/catch/finally + withTimeout en TODAS las llamadas a
   * Supabase garantiza que setSubmitting(false) siempre corra y que el
   * spinner nunca quede eterno si Supabase tarda. Sin esto, cualquiera
   * de los 5 awaits podía colgarse y dejar el botón disabled para siempre.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    // B-24: validación de nombre (solo letras, espacios y signos de nombre).
    if (!validarNombre(form.nombre)) {
      setError('Nombre inválido. Usa solo letras, espacios, apóstrofo o guion (2-80 caracteres).')
      return
    }

    // B-22: validación de cédula (acepta los 5 tipos panameños).
    const cedulaNorm = normalizeCedula(form.cedula)
    if (!isValidCedulaPanama(cedulaNorm)) {
      setError(`Cédula panameña inválida. Ejemplos válidos: ${EJEMPLOS_TEXTO}.`)
      return
    }

    // B-23: la cédula y su confirmación deben coincidir (evita errores de tipeo).
    if (normalizeCedula(form.cedulaConfirm) !== cedulaNorm) {
      setError('Las cédulas no coinciden. Verifica que las escribiste igual en ambos campos.')
      return
    }

    // B-24: teléfono es opcional, pero si se ingresa debe ser válido.
    if (form.telefono.trim() && !validarTelefonoPanama(form.telefono)) {
      setError('Teléfono inválido. Usa solo números (ej: 6000-0000 o +507 6000 0000).')
      return
    }

    if (!isCompletingProfile) {
      // B-24: correo con formato válido (refuerza el type=email).
      if (!validarEmail(form.correo)) {
        setError('Correo electrónico inválido. Revisa el formato (ej: nombre@correo.com).')
        return
      }
      // Contraseña: mínimo 6 caracteres y debe coincidir con su confirmación.
      if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      // B-23: doble confirmación de contraseña.
      if (form.password !== form.passwordConfirm) {
        setError('Las contraseñas no coinciden. Verifica que las escribiste igual.')
        return
      }
    }

    setSubmitting(true)
    try {
      // Verificar si la cédula ya está en uso por otro paciente
      const { data: existing } = await withTimeout(
        supabase.from('pacientes').select('id').eq('cedula', cedulaNorm).maybeSingle(),
        AUTH_TIMEOUT_MS,
      )
      if (existing) {
        setError('Ya existe un paciente con esa cédula. Inicia sesión.')
        return
      }

      /**
       * Bug B-20: separar registro de login para evitar el bug del session=null.
       *
       * Caso A — NUEVO USUARIO (NO isCompletingProfile):
       *   1. signUp en auth.users (sin importar si session viene null o no)
       *   2. Guardar nombre/cedula/telefono/correo en sessionStorage
       *   3. Redirect a /login con state {registroExitoso, email}
       *   4. Login.tsx hace el insert paciente + link tras signInWithPassword
       *      (cuando ya hay JWT garantizado, sin race con la sesion)
       *
       * Caso B — COMPLETAR PERFIL (isCompletingProfile, caso B-04):
       *   1. Usuario ya tiene auth.users + JWT activo
       *   2. Insert paciente + upsert link directamente (RLS pasa por auth.uid)
       *   3. refreshPerfil + navigate a /agendar
       */

      if (!isCompletingProfile) {
        // Caso A: nuevo usuario
        const { data: authData, error: authError } = await withTimeout(
          supabase.auth.signUp({
            email: form.correo,
            password: form.password,
          }),
          AUTH_TIMEOUT_MS,
        )
        if (authError || !authData.user) {
          setError(authError?.message ?? 'No se pudo crear la cuenta.')
          return
        }

        // Guardar datos para que Login.tsx complete el perfil tras signIn.
        // Usamos sessionStorage (no localStorage) porque solo necesita
        // sobrevivir el redirect /registro -> /login, no entre sesiones.
        const pendiente = {
          nombre: form.nombre.trim(),
          cedula: cedulaNorm,
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim().toLowerCase(),
        }
        sessionStorage.setItem('helios_pending_paciente', JSON.stringify(pendiente))

        /**
         * Bug B-20.1: cuando Supabase tiene email confirmation DESACTIVADA
         * (caso HELIOS demo), signUp devuelve sesion activa inmediatamente
         * (auto-login). Eso hace que useAuth detecte `user` y Login.tsx
         * redirija a /registro mostrando "Completa tu perfil" SIN ejecutar
         * completarRegistroPendiente() (que solo corre tras signInWithPassword
         * manual en el handleSubmit). Resultado: el usuario queda autenticado
         * sin paciente, viendo el form de completar — bug regresivo.
         *
         * Fix: signOut explicito para limpiar la sesion auto-creada por
         * signUp. Asi Login.tsx renderiza el form normal con banner verde,
         * el usuario ingresa password, signInWithPassword OK, y entonces
         * SI corre completarRegistroPendiente() que crea paciente + link.
         */
        try {
          await withTimeout(supabase.auth.signOut(), AUTH_TIMEOUT_MS)
        } catch {
          // No bloqueante. Si signOut falla, completarRegistroPendiente
          // tiene su propio fallback en Login.tsx (caso edge raro).
        }

        navigate('/login', {
          replace: true,
          state: {
            registroExitoso: true,
            email: form.correo.trim().toLowerCase(),
          },
        })
        return // El flujo continua en Login.tsx tras signInWithPassword
      }

      // Caso B: isCompletingProfile (B-04). Usuario ya tiene JWT activo.
      if (!user) {
        setError('Sesión no disponible. Cierra sesión e intenta de nuevo.')
        return
      }
      const authUid = user.id
      const correoFinal = user.email ?? form.correo.trim().toLowerCase()

      // Crear paciente
      const { data: pac, error: pacError } = await withTimeout(
        supabase
          .from('pacientes')
          .insert({
            nombre: form.nombre.trim(),
            cedula: cedulaNorm,
            telefono: form.telefono.trim() || null,
            correo: correoFinal,
          })
          .select()
          .single(),
        AUTH_TIMEOUT_MS,
      )
      if (pacError || !pac) {
        setError(pacError?.message ?? 'No se pudo crear el paciente.')
        return
      }

      // Vincular auth con paciente (upsert por si ya existe)
      const { error: linkError } = await withTimeout(
        supabase
          .from('auth_paciente_link')
          .upsert({ auth_uid: authUid, paciente_id: pac.id }, { onConflict: 'auth_uid' }),
        AUTH_TIMEOUT_MS,
      )
      if (linkError) {
        setError(linkError.message)
        return
      }

      // Bug B-20: limpiar sessionStorage si quedo data residual de un
      // intento previo (caso edge: usuario completo perfil despues de
      // dias y la sessionStorage de aquel registro vieja sigue ahi).
      sessionStorage.removeItem('helios_pending_paciente')

      // Refrescar contexto de auth para que paciente quede disponible
      await withTimeout(refreshPerfil(), AUTH_TIMEOUT_MS)
      navigate('/agendar', { replace: true })
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.')
      } else {
        console.error('[Register] handleSubmit unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        {isCompletingProfile ? (
          <>
            <h1 className="text-2xl font-bold text-helios-ink">Completa tu perfil de paciente</h1>
            <p className="mt-1 text-sm text-helios-ink/60">
              Detectamos que tu cuenta <strong>{user?.email}</strong> no tiene perfil de paciente.
              Solo necesitamos tu nombre y cédula para terminar el registro.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-helios-ink">Crear cuenta</h1>
            <p className="mt-1 text-sm text-helios-ink/60">
              Solo necesitamos tus datos básicos para registrarte como paciente HELIOS.
            </p>
          </>
        )}
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="label">
              Nombre completo
            </label>
            <input
              id="nombre"
              required
              autoComplete="name"
              value={form.nombre}
              onChange={update('nombre')}
              className="input"
              placeholder="Ej: Ana López"
            />
          </div>

          {/* B-22: cédula con ejemplos de los tipos que el sistema conoce
              + tipo detectado en vivo para reducir errores. */}
          <div className="sm:col-span-2">
            <label htmlFor="cedula" className="label">
              Cédula
            </label>
            <input
              id="cedula"
              required
              inputMode="text"
              value={form.cedula}
              onChange={update('cedula')}
              className="input"
              placeholder="8-123-4567"
            />
            <p className="mt-1 text-xs text-helios-ink/50">
              Ejemplos válidos: {EJEMPLOS_TEXTO}
            </p>
            {tipoCedula && (
              <p
                className={`mt-1 text-xs ${
                  tipoCedula.tipo === 'desconocido' ? 'text-amber-600' : 'text-helios-primary'
                }`}
              >
                {tipoCedula.tipo === 'desconocido'
                  ? 'Formato no reconocido todavía.'
                  : `Tipo detectado: ${tipoCedula.etiqueta}`}
              </p>
            )}
          </div>

          {/* B-23: confirmación de cédula (debe coincidir). */}
          <div className="sm:col-span-2">
            <label htmlFor="cedulaConfirm" className="label">
              Confirmar cédula
            </label>
            <input
              id="cedulaConfirm"
              required
              inputMode="text"
              value={form.cedulaConfirm}
              onChange={update('cedulaConfirm')}
              className="input"
              placeholder="Escribe tu cédula de nuevo"
              onPaste={(e) => e.preventDefault()}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="telefono" className="label">
              Teléfono <span className="text-helios-ink/40">(opcional)</span>
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.telefono}
              onChange={update('telefono')}
              className="input"
              placeholder="6000-0000"
            />
          </div>
          {!isCompletingProfile && (
            <>
              <div className="sm:col-span-2">
                <label htmlFor="correo" className="label">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.correo}
                  onChange={update('correo')}
                  className="input"
                  placeholder="nombre@correo.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              {/* B-23: confirmación de contraseña (debe coincidir). */}
              <div className="sm:col-span-2">
                <label htmlFor="passwordConfirm" className="label">
                  Confirmar contraseña
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.passwordConfirm}
                  onChange={update('passwordConfirm')}
                  className="input"
                  placeholder="Escribe la contraseña de nuevo"
                />
              </div>
            </>
          )}
          {error && (
            <div className="sm:col-span-2">
              <ErrorMessage message={error} />
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting
                ? isCompletingProfile
                  ? 'Guardando…'
                  : 'Creando cuenta…'
                : isCompletingProfile
                  ? 'Completar perfil'
                  : 'Crear cuenta'}
            </button>
          </div>
        </form>
        {!isCompletingProfile && (
          <p className="mt-4 text-center text-sm text-helios-ink/60">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-helios-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
