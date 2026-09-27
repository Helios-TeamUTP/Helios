import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useActualizarNombreMedico } from '../../hooks/useActualizarNombreMedico'
import { validarNombre } from '../../lib/validaciones'
import { ErrorMessage } from '../shared/ErrorMessage'
import { SuccessMessage } from '../shared/SuccessMessage'

/**
 * Extensión del Módulo 05 — Perfil, para médico.
 *
 * A propósito NO tiene tarjetas de correo ni contraseña — el alcance para
 * médico es únicamente el nombre. Nada más se toca desde aquí.
 */
export function TarjetaNombreMedico() {
  const { medico, refreshPerfil } = useAuth()
  const { actualizarNombreMedico, loading, error, setError } = useActualizarNombreMedico()

  const [nombre, setNombre] = useState(medico?.nombre ?? '')
  const [exito, setExito] = useState(false)

  const cambio = nombre.trim() !== (medico?.nombre ?? '').trim()
  const nombreValido = validarNombre(nombre)

  const guardar = async () => {
    setExito(false)
    if (!nombreValido) {
      setError('Ingresa un nombre válido (solo letras, 2 a 80 caracteres).')
      return
    }
    if (!medico) {
      setError('No se pudo identificar tu perfil. Recarga la página.')
      return
    }
    const ok = await actualizarNombreMedico(medico.id, nombre.trim())
    if (ok) {
      setExito(true)
      await refreshPerfil()
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold text-helios-ink">Datos personales</h2>
      <p className="mt-1 text-sm text-helios-ink/60">
        Tu nombre tal como aparece para tus pacientes.
      </p>

      <div className="mt-4">
        <label htmlFor="perfil-medico-nombre" className="label">
          Nombre completo
        </label>
        <input
          id="perfil-medico-nombre"
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
