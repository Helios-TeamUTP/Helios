import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'
import { traducirErrorAuth } from '../lib/erroresAuth'
import { CuentaIncompleta } from '../components/auth/CuentaIncompleta'

export function Login() {
  const location = useLocation()
  const { user, role, loading } = useAuth()

  // State que viene del Register cuando el registro no dejo sesion activa.
  const fromRegistro = (location.state as { registroExitoso?: boolean } | null)
    ?.registroExitoso === true
  const emailPrellenado =
    (location.state as { email?: string } | null)?.email ?? ''
  // Viene de /restablecer-password tras cambiar la contraseña con éxito.
  const passwordRestablecida =
    (location.state as { passwordRestablecida?: boolean } | null)?.passwordRestablecida === true

  const [email, setEmail] = useState(emailPrellenado)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Bug B-16: si loading=true (perfil cargando), mostrar spinner ANTES de
  // evaluar el rol: role es null de forma transitoria mientras loadPerfil esta
  // en vuelo y no debe interpretarse como "cuenta sin perfil".
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  // Bug B-13: redirect segun rol. Medico → /medico, paciente → /agendar.
  // Sesion sin perfil (caso excepcional): pantalla con salida, sin formulario.
  if (user) {
    if (role === 'medico') return <Navigate to="/medico" replace />
    if (role === 'paciente') return <Navigate to="/agendar" replace />
    return <CuentaIncompleta />
  }

  /**
   * Bug B-10 fix: try/catch/finally + withTimeout garantiza que
   * setSubmitting(false) siempre se ejecute, incluso si Supabase nunca
   * responde.
   */
  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
      )
      if (signInError) {
        // CU-02 (CA-02-01): "Correo o contraseña incorrectos." sin decir cuál falló.
        // Antes se mostraba el texto crudo de Supabase, en inglés.
        setError(traducirErrorAuth(signInError, 'No se pudo iniciar sesión. Intenta nuevamente.'))
        return
      }
      // useAuth.onAuthStateChange (SIGNED_IN) carga el perfil y el redirect
      // por rol de arriba (if (user)) hace el resto.
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

        {/* Banner verde cuando el registro termino sin sesion activa */}
        {fromRegistro && (
          <output
            className="mt-4 block rounded-lg border border-helios-primary/30 bg-helios-primary/10 px-4 py-3 text-sm text-helios-deep"
          >
            <strong>Cuenta creada con éxito.</strong> Inicia sesión con tu correo y
            contraseña para entrar al sistema.
          </output>
        )}

        {passwordRestablecida && (
          <output
            className="mt-4 block rounded-lg border border-helios-primary/30 bg-helios-primary/10 px-4 py-3 text-sm text-helios-deep"
          >
            <strong>Contraseña actualizada.</strong> Inicia sesión con tu contraseña nueva.
          </output>
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
              <Link
                to="/recuperar-password"
                className="font-semibold text-helios-primary hover:underline"
              >
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
