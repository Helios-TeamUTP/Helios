import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useActualizarNombre } from '../../hooks/useActualizarNombre'
import { validarNombre } from '../../lib/validaciones'
import { ErrorMessage } from '../shared/ErrorMessage'
import { SuccessMessage } from '../shared/SuccessMessage'

/**
 * Módulo 05 — Perfil, Acción 1: cambiar nombre.
 *
 * Tarjeta independiente: un campo, un botón. Un error acá no bloquea
 * guardar en las otras tarjetas (correo/contraseña).
 */
export function TarjetaNombre() {
  const { paciente, refreshPerfil } = useAuth()
  const { actualizarNombre, loading, error, setError } = useActualizarNombre()

  const [nombre, setNombre] = useState(paciente?.nombre ?? '')
  const [exito, setExito] = useState(false)

  const cambio = nombre.trim() !== (paciente?.nombre ?? '').trim()
  const nombreValido = validarNombre(nombre)

  const guardar = async () => {
    setExito(false)
    if (!nombreValido) {
      setError('Ingresa un nombre válido (solo letras, 2 a 80 caracteres).')
      return
    }
    if (!paciente) {
      setError('No se pudo identificar tu perfil. Recarga la página.')
      return
    }
    const ok = await actualizarNombre(paciente.id, nombre.trim())
    if (ok) {
      setExito(true)
      // Refresca el nombre en useAuth() para que se vea en el header (AppLayout)
      // sin recargar la página — refreshPerfil ya existe en useAuth, no hace
      // falta agregar nada ahí.
      await refreshPerfil()
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold text-helios-ink">Datos personales</h2>
      <p className="mt-1 text-sm text-helios-ink/60">
        Tu nombre tal como aparecerá para el equipo médico.
      </p>

      <div className="mt-4">
        <label htmlFor="perfil-nombre" className="label">
          Nombre completo
        </label>
        <input
          id="perfil-nombre"
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
