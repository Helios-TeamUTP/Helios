import { useState } from 'react'
import type { CitaConPaciente, EstadoCita } from '../../lib/types'

interface CitaCardMedicoProps {
  cita: CitaConPaciente
  /** Callback para marcar el estado. Recibe el nuevo estado. Si throwea, se muestra error. */
  onMarcarEstado: (nuevoEstado: EstadoCita) => Promise<void>
  /** Click en "Ver ficha" → abre modal de FichaPaciente. */
  onVerFicha: () => void
  /** Si la cita es de historial (fecha pasada), los botones se ocultan. */
  modoHistorial?: boolean
}

const ESTADO_LABELS: Record<EstadoCita, { label: string; color: string }> = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  completada: { label: 'Completada', color: 'bg-helios-primary/15 text-helios-primary' },
  no_asistio: { label: 'No asistió', color: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700' },
}

/**
 * Tarjeta de una cita en la agenda del medico. Muestra hora, paciente,
 * estado, y permite marcar completada / no_asistio + ver ficha.
 *
 * Bug B-13: componente nuevo del dashboard de medicos.
 */
export function CitaCardMedico({
  cita,
  onMarcarEstado,
  onVerFicha,
  modoHistorial = false,
}: CitaCardMedicoProps) {
  const [working, setWorking] = useState<EstadoCita | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMarcar = async (estado: EstadoCita) => {
    setWorking(estado)
    setError(null)
    try {
      await onMarcarEstado(estado)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
    } finally {
      setWorking(null)
    }
  }

  const estadoMeta = ESTADO_LABELS[cita.estado]
  const hora = cita.horario?.hora_inicio?.slice(0, 5) ?? '—:—'
  const paciente = cita.paciente

  return (
    <article
      className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label={`Cita a las ${hora} con ${paciente?.nombre ?? 'paciente desconocido'}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-helios-deep tabular-nums">{hora}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoMeta.color}`}
          >
            {estadoMeta.label}
          </span>
        </div>
        <p className="mt-2 text-base font-semibold text-helios-ink">
          {paciente?.nombre ?? 'Paciente sin datos'}
        </p>
        <p className="text-sm text-helios-ink/60">
          Cédula {paciente?.cedula ?? '—'}
          {paciente?.telefono && (
            <>
              {' · '}
              <a
                href={`tel:${paciente.telefono}`}
                className="text-helios-primary hover:underline"
              >
                📞 {paciente.telefono}
              </a>
            </>
          )}
        </p>
        {cita.notas && (
          <p className="mt-1 text-xs italic text-helios-ink/50">Notas: {cita.notas}</p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onVerFicha} className="btn-ghost">
          👁 Ver ficha
        </button>
        {!modoHistorial && cita.estado === 'confirmada' && (
          <>
            <button
              type="button"
              onClick={() => handleMarcar('completada')}
              disabled={working !== null}
              className="btn-primary"
            >
              {working === 'completada' ? 'Guardando…' : '✓ Completada'}
            </button>
            <button
              type="button"
              onClick={() => handleMarcar('no_asistio')}
              disabled={working !== null}
              className="btn-secondary"
            >
              {working === 'no_asistio' ? 'Guardando…' : '✗ No asistió'}
            </button>
          </>
        )}
      </div>
    </article>
  )
}
