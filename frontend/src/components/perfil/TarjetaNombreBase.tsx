import { useState } from 'react'
import { validarNombre } from '../../lib/validaciones'
import { ErrorMessage } from '../shared/ErrorMessage'
import { SuccessMessage } from '../shared/SuccessMessage'

interface Props {
  readonly inputId: string
  readonly subtitulo: string
  readonly valorActual: string
  readonly entidadId: string | undefined
  readonly actualizarNombre: (id: string, nombre: string) => Promise<boolean>
  readonly loading: boolean
  readonly error: string | null
  readonly setError: (mensaje: string | null) => void
  readonly onGuardado?: () => void | Promise<void>
}

/**
 * Base compartida de las tarjetas "cambiar nombre" de Perfil — antes
 * duplicada casi al 100% entre TarjetaNombre (paciente) y
 * TarjetaNombreMedico (médico). SonarCloud lo marcó como 6.5% de
 * duplicación en código nuevo (máximo permitido: 3%).
 */
export function TarjetaNombreBase({
  inputId,
  subtitulo,
  valorActual,
  entidadId,
  actualizarNombre,
  loading,
  error,
  setError,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState(valorActual)
  const [exito, setExito] = useState(false)

  const cambio = nombre.trim() !== valorActual.trim()
  const nombreValido = validarNombre(nombre)

  const guardar = async () => {
    setExito(false)
    if (!nombreValido) {
      setError('Ingresa un nombre válido (solo letras, 2 a 80 caracteres).')
      return
    }
    if (!entidadId) {
      setError('No se pudo identificar tu perfil. Recarga la página.')
      return
    }
    const ok = await actualizarNombre(entidadId, nombre.trim())
    if (ok) {
      setExito(true)
      await onGuardado?.()
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold text-helios-ink">Datos personales</h2>
      <p className="mt-1 text-sm text-helios-ink/60">{subtitulo}</p>

      <div className="mt-4">
        <label htmlFor={inputId} className="label">
          Nombre completo
        </label>
        <input
          id={inputId}
          type="text"
          className="input"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setExito(false)
            setError(null)
          }}
          disabled={loading}
        />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorMessage message={error} />
        </div>
      )}
      {exito && !error && (
        <div className="mt-3">
          <SuccessMessage message="Nombre actualizado ✓" />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={guardar}
          disabled={loading || !cambio || nombre.trim().length === 0}
          className="btn-primary"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
