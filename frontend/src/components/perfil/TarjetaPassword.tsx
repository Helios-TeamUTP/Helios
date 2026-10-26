import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCambiarPassword } from '../../hooks/useCambiarPassword'
import { ErrorMessage } from '../shared/ErrorMessage'
import { SuccessMessage } from '../shared/SuccessMessage'
import { PASSWORD_MIN_LENGTH } from '../../lib/passwordPolicy'

/**
 * Módulo 05 — Perfil, Acción 3: cambiar contraseña.
 *
 * Pide la contraseña actual (reautenticación real, no solo updateUser),
 * y la nueva dos veces para evitar typos — mismo patrón de doble
 * confirmación que B-23 en Register.tsx.
 */
export function TarjetaPassword() {
  const { user } = useAuth()
  const { cambiarPassword, loading, error, setError } = useCambiarPassword()

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [exito, setExito] = useState(false)

  const nuevaValida = nueva.length >= PASSWORD_MIN_LENGTH
  const coinciden = nueva === confirmar
  const puedeEnviar =
    actual.length > 0 && nuevaValida && coinciden && !loading

  const limpiarFeedback = () => {
    setExito(false)
    setError(null)
  }

  const guardar = async () => {
    limpiarFeedback()

    if (!nuevaValida) {
      setError(`La contraseña nueva debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
      return
    }
    if (!coinciden) {
      setError('La confirmación no coincide con la contraseña nueva.')
      return
    }
    if (!user?.email) {
      setError('No se pudo identificar tu correo de acceso. Recarga la página.')
      return
    }

    const ok = await cambiarPassword(user.email, actual, nueva)
    if (ok) {
      setExito(true)
      setActual('')
      setNueva('')
      setConfirmar('')
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold text-helios-ink">Contraseña</h2>
      <p className="mt-1 text-sm text-helios-ink/60">
        Al cambiarla, cerramos tu sesión en otros dispositivos por seguridad.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="perfil-pass-actual" className="label">
            Contraseña actual
          </label>
          <input
            id="perfil-pass-actual"
            type="password"
            autoComplete="current-password"
            className="input"
            value={actual}
            onChange={(e) => {
              setActual(e.target.value)
              limpiarFeedback()
            }}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="perfil-pass-nueva" className="label">
            Contraseña nueva
          </label>
          <input
            id="perfil-pass-nueva"
            type="password"
            autoComplete="new-password"
            className="input"
            value={nueva}
            onChange={(e) => {
              setNueva(e.target.value)
              limpiarFeedback()
            }}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="perfil-pass-confirmar" className="label">
            Confirmar contraseña nueva
          </label>
          <input
            id="perfil-pass-confirmar"
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirmar}
            onChange={(e) => {
              setConfirmar(e.target.value)
              limpiarFeedback()
            }}
            disabled={loading}
          />
          {confirmar.length > 0 && !coinciden && (
            <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <ErrorMessage message={error} />
        </div>
      )}
      {exito && !error && (
        <div className="mt-3">
          <SuccessMessage message="Contraseña actualizada ✓" />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={guardar}
          disabled={!puedeEnviar}
          className="btn-primary"
        >
          {loading ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}
