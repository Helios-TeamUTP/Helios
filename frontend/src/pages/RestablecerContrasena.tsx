import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { limpiarMarcaRecuperacion, llegoPorRecuperacion } from '../lib/recuperacion'
import { validarPassword } from '../lib/validaciones'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

function traducirError(err: { code?: string; message?: string }): string {
  if (err.code === 'same_password') return 'La nueva contraseña debe ser distinta de la anterior.'
  if (err.code === 'weak_password') {
    return 'La contraseña es demasiado débil. Usa al menos 8 caracteres, una mayúscula y un número.'
  }
  console.error('[RestablecerContrasena] updateUser:', err.code, err.message)
  return 'No pudimos actualizar la contraseña. Pide un enlace nuevo e inténtalo de nuevo.'
}

/**
 * RF-04 — Recuperacion de contrasena (paso 2: fijar la contrasena nueva).
 *
 * Solo se habilita si el usuario llego por el enlace del correo
 * (`llegoPorRecuperacion`) Y supabase-js creo la sesion de recuperacion.
 * Al terminar cierra TODAS las sesiones y manda al login.
 */
export function RestablecerContrasena() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando enlace…" />
      </div>
    )
  }

  if (!user || !llegoPorRecuperacion()) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-helios-ink">Enlace no válido</h1>
          <p className="mt-2 text-sm text-helios-ink/70">
            Este enlace no es válido o ya venció. Por seguridad, los enlaces de recuperación
            funcionan una sola vez y duran poco tiempo.
          </p>
          <Link to="/recuperar" className="btn-primary mt-6 block w-full text-center">
            Pedir un enlace nuevo
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const reglaIncumplida = validarPassword(password)
    if (reglaIncumplida) {
      setError(reglaIncumplida)
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden. Verifica que las escribiste igual.')
      return
    }
    setSubmitting(true)
    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        AUTH_TIMEOUT_MS,
      )
      if (updateError) {
        setError(traducirError(updateError as { code?: string; message?: string }))
        return
      }
      limpiarMarcaRecuperacion()
      try {
        // Cierra TODAS las sesiones (incluida la de recuperacion) por seguridad.
        await supabase.auth.signOut({ scope: 'global' })
      } catch (signOutError) {
        console.error('[RestablecerContrasena] signOut:', signOutError)
      }
      navigate('/login', { replace: true, state: { passwordRestablecida: true } })
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.')
      } else {
        console.error('[RestablecerContrasena] unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Crea tu contraseña nueva</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Mínimo 8 caracteres, con al menos una mayúscula y un número.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="label">
              Contraseña nueva
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="confirmar" className="label">
              Confirmar contraseña
            </label>
            <input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="input"
              placeholder="Escribe la contraseña de nuevo"
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
