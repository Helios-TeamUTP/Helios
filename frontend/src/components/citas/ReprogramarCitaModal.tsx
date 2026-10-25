import { useState } from 'react'
import { useReprogramarCita } from '../../hooks/useReprogramarCita'
import { CalendarioCitas } from '../agendamiento/CalendarioCitas'
import { ErrorMessage } from '../shared/ErrorMessage'
import type { CitaConRelaciones, Horario } from '../../lib/types'

interface Props {
  cita: CitaConRelaciones
  onClose: () => void
  /** Se llama tras reprogramar con éxito (para refrescar la lista). */
  onReprogramada: () => void
}

/**
 * Sprint 2 (ST-38): modal para reprogramar una cita.
 *
 * Reutiliza CalendarioCitas (la vista de botones timezone-safe de B-21) para
 * elegir un nuevo horario del MISMO médico. Al confirmar, llama
 * useReprogramarCita -> RPC reprogramar_cita_atomica. El horario actual de la
 * cita NO aparece como disponible (su slot está reservado), así que no se puede
 * "reprogramar al mismo horario".
 */
export function ReprogramarCitaModal({ cita, onClose, onReprogramada }: Readonly<Props>) {
  const [seleccion, setSeleccion] = useState<Horario | null>(null)
  const { reprogramar, loading, error } = useReprogramarCita()

  const confirmar = async () => {
    if (!seleccion) return
    const ok = await reprogramar(cita.id, seleccion.id)
    if (ok) {
      onClose()
      onReprogramada()
    }
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-start justify-center overflow-y-auto bg-black/40 p-4 text-inherit"
      aria-modal="true"
      aria-label="Reprogramar cita"
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-helios-ink">Reprogramar cita</h2>
            <p className="mt-1 text-sm text-helios-ink/70">
              Dr(a). {cita.medico?.nombre ?? 'tu médico'} · elige un nuevo horario disponible.
            </p>
            {cita.horario && (
              <p className="mt-1 text-xs text-helios-ink/50">
                Horario actual: {cita.horario.fecha} a las {cita.horario.hora_inicio.slice(0, 5)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-2 py-1 text-helios-ink/50 transition hover:bg-helios-mist disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          {cita.medico_id ? (
            <CalendarioCitas
              medicoId={cita.medico_id}
              value={seleccion}
              onChange={setSeleccion}
              excluirCitaId={cita.id}
            />
          ) : (
            <ErrorMessage message="Esta cita no tiene un médico asignado; no se puede reprogramar." />
          )}
        </div>

        {error && (
          <div className="mt-3">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-helios-ink/15 px-4 py-2 text-sm font-semibold text-helios-ink/70 transition hover:bg-helios-mist disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={loading || !seleccion}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Reprogramando…' : 'Confirmar nuevo horario'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
