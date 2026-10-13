import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useRestablecerPassword } from '../hooks/useRestablecerPassword'
import { leerEstadoRecuperacion, limpiarEstadoRecuperacion } from '../lib/recuperacionPassword'

/** Mismo mínimo que el cambio de contraseña desde Perfil (TarjetaPassword). */
const PASSWORD_MIN_LENGTH = 8

/**
 * Recuperar contraseña, paso 2 (ruta pública /restablecer-password).
 *
 * Solo muestra el formulario si:
 *  1. la URL de entrada era un enlace de recuperación real (lib/recuperacionPassword
 *     lo capturó al arrancar la app), Y
 *  2. Supabase ya creó la sesión temporal a partir de ese enlace.
 * En cualquier otro caso (enlace vencido, ya usado, o alguien que escribió la
 * ruta a mano) se ofrece pedir un enlace nuevo.
 *
 * Al terminar cierra TODAS las sesiones y manda a /login, para que el usuario
 * entre con la contraseña nueva.
 */
export function RestablecerPassword() {
  const navigate = useNavigate()
  const { session, loading, signOut } = useAuth()
  const { restablecer, cerrarSesiones, loading: guardando, error, setError } =
    useRestablecerPassword()

  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [completado, setCompletado] = useState(false)

  // Verificando sesión, o terminando el flujo (evita parpadeo de "enlace inválido"
  // cuando la sesión desaparece tras cerrar sesiones).
  if (loading || completado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label={completado ? 'Contraseña actualizada…' : 'Verificando enlace…'} />
      </div>
    )
  }

  if (leerEstadoRecuperacion() !== 'valido' || !session) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-helios-ink">Enlace inválido o expirado</h1>
          <p className="mt-2 text-sm text-helios-ink/70">
            Este enlace ya no sirve: puede haber vencido o haberse usado antes. Pide uno nuevo
            para crear tu contraseña.
          </p>
          <Link to="/recuperar-password" className="btn-primary mt-4 inline-block">
            Pedir un enlace nuevo
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (nueva.length < PASSWORD_MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden. Verifica que las escribiste igual.')
      return
    }

    const ok = await restablecer(nueva)
    if (!ok) return

    setCompletado(true)
    limpiarEstadoRecuperacion()
    await cerrarSesiones()
    await signOut() // limpia el estado local de useAuth
    navigate('/login', { replace: true, state: { passwordRestablecida: true } })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Crear contraseña nueva</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Elige una contraseña de al menos {PASSWORD_MIN_LENGTH} caracteres. Al guardarla,
          cerraremos tu sesión en todos los dispositivos.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="restablecer-nueva" className="label">
              Contraseña nueva
            </label>
            <input
              id="restablecer-nueva"
              type="password"
              autoComplete="new-password"
              required
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="input"
              disabled={guardando}
            />
          </div>
          <div>
            <label htmlFor="restablecer-confirmar" className="label">
              Confirmar contraseña nueva
            </label>
            <input
              id="restablecer-confirmar"
              type="password"
              autoComplete="new-password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="input"
              disabled={guardando}
            />
            {confirmar.length > 0 && nueva !== confirmar && (
              <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
            )}
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? 'Guardando…' : 'Guardar contraseña nueva'}
          </button>
        </form>
      </div>
    </div>
  )
}
