import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, paciente, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Aún cargando contexto
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  // Ya hay sesión completa → ir a agendar
  if (user && paciente) {
    return <Navigate to="/agendar" replace />
  }

  // Hay sesión auth pero falta perfil paciente → ir a /registro a completar
  if (user && !paciente) {
    return <Navigate to="/registro" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    navigate(from || '/agendar', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Accede a tu cuenta para agendar y consultar tus citas.
        </p>
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
