import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Bug B-20.3: completarRegistroPendiente fue MOVIDA a useAuth.tsx para
 * eliminar el race condition que mantenía a la UI en "Completa tu perfil"
 * aunque el paciente y el link sí se creaban en BD.
 *
 * Historial:
 *   B-20:   Login llamaba la función tras signInWithPassword + refreshPerfil
 *   B-20.1: signOut tras signUp para evitar auto-login
 *   B-20.2: polling JWT + errores visibles en pantalla
 *   B-20.3: mover a onAuthStateChange de useAuth para que corra ANTES de
 *           loadPerfil (sin race). El error sale por context.registroPendienteError
 */

export function Login() {
  const location = useLocation()
  const { user, paciente, role, loading, registroPendienteError, clearRegistroPendienteError } =
    useAuth()

  // Bug B-20: state que viene del Register tras crear cuenta nueva.
  const fromRegistro = (location.state as { registroExitoso?: boolean } | null)
    ?.registroExitoso === true
  const emailPrellenado =
    (location.state as { email?: string } | null)?.email ?? ''
  // RF-04: viene de /restablecer tras fijar la contrasena nueva.
  const passwordRestablecida =
    (location.state as { passwordRestablecida?: boolean } | null)?.passwordRestablecida === true

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
   * responde.
   *
   * Bug B-20.3: completarRegistroPendiente ya NO se llama aquí. useAuth lo
   * ejecuta automáticamente dentro de onAuthStateChange (al evento SIGNED_IN)
   * ANTES de loadPerfil. Esto elimina el race condition que mantenía la UI
   * en "Completa tu perfil" aunque el INSERT y UPSERT sí se ejecutaran en BD.
   * Cualquier error sale por context.registroPendienteError (banner abajo).
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    clearRegistroPendienteError() // limpiar banner viejo si lo hay
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
      // useAuth.onAuthStateChange (SIGNED_IN) se dispara aqui:
      // 1. Si hay sessionStorage pendiente: INSERT paciente + UPSERT link
      // 2. Luego loadPerfil -> paciente cargado -> redirect via if (user)
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

        {passwordRestablecida && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-helios-primary/30 bg-helios-primary/10 px-4 py-3 text-sm text-helios-deep"
          >
            <strong>Contraseña actualizada.</strong> Inicia sesión con tu contraseña nueva.
          </div>
        )}

        {/*
          Bug B-20.3: banner rojo si completarRegistroPendiente fallo en
          useAuth.onAuthStateChange. Muestra el error real (RLS rejected,
          cedula duplicada, timeout, etc) para diagnostico en pantalla.
        */}
        {registroPendienteError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <strong>No pudimos completar tu registro automaticamente.</strong>
            <br />
            Detalle: <code className="text-xs">{registroPendienteError}</code>
            <br />
            Intenta iniciar sesión nuevamente o avisa al soporte.
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
            <p className="mt-1 text-right text-sm">
              <Link to="/recuperar" className="font-semibold text-helios-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
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
