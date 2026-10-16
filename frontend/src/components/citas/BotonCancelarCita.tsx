import { useState } from 'react'
import { useCancelarCita } from '../../hooks/useCancelarCita'
import { ErrorMessage } from '../shared/ErrorMessage'

interface Props {
  citaId: string
  /** Texto corto para mostrar en el modal (ej: "Dr. X · 15 jun 12:30"). */
  resumen?: string
  /** Se llama tras cancelar con éxito (para refrescar la lista). */
  onCancelada: () => void
}

/**
 * Sprint 2 (ST-37): botón "Cancelar" con modal de confirmación.
 *
 * Pide confirmación explícita antes de cancelar (acción no reversible). Usa
 * useCancelarCita -> RPC cancelar_cita_atomica. Si falla, muestra el error
 * dentro del modal sin cerrarlo; si tiene éxito, refresca la lista y cierra.
 */
export function BotonCancelarCita({ citaId, resumen, onCancelada }: Readonly<Props>) {
  const [abierto, setAbierto] = useState(false)
  const { cancelar, loading, error, setError } = useCancelarCita()

  const abrir = () => {
    setError(null)
    setAbierto(true)
  }
  const cerrar = () => {
    if (!loading) setAbierto(false)
  }

  const confirmar = async () => {
    const ok = await cancelar(citaId)
    if (ok) {
      setAbierto(false)
      onCancelada()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Cancelar
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cancelación de cita"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-helios-ink">¿Cancelar esta cita?</h2>
            {resumen && <p className="mt-1 text-sm text-helios-ink/70">{resumen}</p>}
            <p className="mt-3 text-sm text-helios-ink/70">
              Esta acción no se puede deshacer. El horario quedará disponible para otros
              pacientes.
            </p>

            {error && (
              <div className="mt-3">
                <ErrorMessage message={error} />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrar}
                disabled={loading}
                className="rounded-lg border border-helios-ink/15 px-4 py-2 text-sm font-semibold text-helios-ink/70 transition hover:bg-helios-mist disabled:opacity-50"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cancelando…' : 'Sí, cancelar cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
