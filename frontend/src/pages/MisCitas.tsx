import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCitas } from '../hooks/useCitas'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { BotonCancelarCita } from '../components/citas/BotonCancelarCita'
import { ReprogramarCitaModal } from '../components/citas/ReprogramarCitaModal'
import type { CitaConRelaciones, EstadoCita } from '../lib/types'

/** Estilos del badge de estado de la cita. */
const ESTADO_STYLE: Record<EstadoCita, string> = {
  confirmada: 'bg-helios-primary/10 text-helios-primary',
  cancelada: 'bg-gray-200 text-gray-600',
  completada: 'bg-green-100 text-green-700',
  no_asistio: 'bg-amber-100 text-amber-700',
}
const ESTADO_LABEL: Record<EstadoCita, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
}

export function MisCitas() {
  const { paciente } = useAuth()
  const { data, loading, error, refetch } = useCitas(paciente?.id ?? null)
  // Sprint 2 (ST-38): cita que se está reprogramando (abre el modal con calendario).
  const [citaAReprogramar, setCitaAReprogramar] = useState<CitaConRelaciones | null>(null)

  if (!paciente) {
    return (
      <div className="card text-center">
        <p className="text-helios-ink/70">
          Necesitas registrarte como paciente antes de ver tus citas.
        </p>
        <Link to="/registro" className="btn-primary mt-4 inline-block">
          Crear cuenta
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-helios-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-helios-primary">
            US-05 · Mis citas
          </span>
          <h1 className="mt-2 text-3xl font-bold text-helios-ink">Hola, {paciente.nombre}</h1>
          <p className="text-sm text-helios-ink/60">Cédula registrada: {paciente.cedula}</p>
        </div>
        <Link to="/agendar" className="btn-primary">
          Agendar nueva cita
        </Link>
      </header>

      {loading && <LoadingSpinner label="Cargando tus citas…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && data.length === 0 && (
        <div className="card text-center text-sm text-helios-ink/60">
          Aún no tienes citas agendadas.
        </div>
      )}

      <ul className="space-y-3">
        {data.map((cita) => {
          const estado = cita.estado as EstadoCita
          const esConfirmada = estado === 'confirmada'
          const resumen = `Dr(a). ${cita.medico?.nombre ?? ''} · ${
            cita.horario ? `${cita.horario.fecha} ${cita.horario.hora_inicio.slice(0, 5)}` : ''
          }`
          return (
            <li key={cita.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ESTADO_STYLE[estado] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ESTADO_LABEL[estado] ?? estado}
                  </span>
                  <div className="mt-1 text-xl font-bold text-helios-ink">
                    Dr(a). {cita.medico?.nombre ?? 'Sin asignar'}
                  </div>
                  <div className="text-sm text-helios-ink/70">
                    {cita.medico?.especialidad?.nombre ?? '—'} · {cita.sede?.nombre ?? '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-helios-mist px-4 py-2 text-right">
                  <div className="text-xs uppercase tracking-wider text-helios-ink/40">Código</div>
                  <div className="font-mono text-base font-bold text-helios-ink">
                    {cita.codigo_confirmacion}
                  </div>
                </div>
              </div>

              {cita.horario && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-helios-ink/80">
                  <span>
                    📅 <strong>{cita.horario.fecha}</strong>
                  </span>
                  <span>
                    🕒 {cita.horario.hora_inicio.slice(0, 5)} — {cita.horario.hora_fin.slice(0, 5)}
                  </span>
                </div>
              )}

              {cita.notas && (
                <div className="mt-3 rounded-lg bg-helios-mist px-3 py-2 text-sm text-helios-ink/70">
                  <strong>Notas:</strong> {cita.notas}
                </div>
              )}

              {/* Sprint 2: cancelar / reprogramar solo para citas confirmadas. */}
              {esConfirmada && (
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-helios-ink/5 pt-3">
                  <button
                    type="button"
                    onClick={() => setCitaAReprogramar(cita)}
                    className="rounded-lg border border-helios-primary/40 px-3 py-1.5 text-sm font-semibold text-helios-primary transition hover:bg-helios-primary/10"
                  >
                    Reprogramar
                  </button>
                  <BotonCancelarCita citaId={cita.id} resumen={resumen} onCancelada={refetch} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {citaAReprogramar && (
        <ReprogramarCitaModal
          cita={citaAReprogramar}
          onClose={() => setCitaAReprogramar(null)}
          onReprogramada={refetch}
        />
      )}
    </div>
  )
}
