import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCitas } from '../hooks/useCitas'
import { useHistorialPaciente, type HistorialConMedico } from '../hooks/useHistorialPaciente'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { SuccessMessage } from '../components/shared/SuccessMessage'
import { BotonCancelarCita } from '../components/citas/BotonCancelarCita'
import { ReprogramarCitaModal } from '../components/citas/ReprogramarCitaModal'
import type { CitaConRelaciones, EstadoCita } from '../lib/types'
import { textoNota } from '../lib/notas'

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

/** Formato "4 de julio de 2026" para la fecha de la última receta. */
function formatFechaLarga(fechaIso: string): string {
  try {
    return new Date(fechaIso).toLocaleDateString('es-PA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return fechaIso
  }
}

/**
 * Bloque compacto de dolencia + receta de UNA visita puntual.
 * Se usa tanto en la card resumen de arriba como dentro de cada
 * cita individual que ya tenga historial_clinico registrado.
 */
function BloqueHistorial({ hist }: { hist: HistorialConMedico }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm">
        <span className="font-semibold text-helios-ink/70">Motivo de consulta: </span>
        <span className="text-helios-ink">{hist.dolencia_principal}</span>
      </p>

      {hist.receta ? (
        <div className="rounded-lg bg-helios-mist px-3 py-2">
          <p className="text-sm">
            <span className="font-semibold text-helios-ink/70">Receta: </span>
            <span className="text-helios-ink">{hist.receta}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm italic text-helios-ink/40">
          No se te recetó ningún medicamento en esta visita.
        </p>
      )}
    </div>
  )
}

export function MisCitas() {
  const { paciente } = useAuth()
  const { data, loading, error, refetch } = useCitas(paciente?.id ?? null)
  const { data: historial, loading: cargandoHistorial, error: errorHistorial } =
    useHistorialPaciente(paciente?.id ?? null)
  // CU-03: confirmación tras cancelar/reprogramar ("Cita cancelada exitosamente.").
  const [aviso, setAviso] = useState<string | null>(null)
  // Sprint 2 (ST-38): cita que se está reprogramando (abre el modal con calendario).
  const [citaAReprogramar, setCitaAReprogramar] = useState<CitaConRelaciones | null>(null)

  // Un lookup rapido cita_id -> historial, para pintar la dolencia/receta
  // de ESA cita puntual dentro de su propia card (no solo la mas reciente).
  const historialPorCita = useMemo(
    () => new Map(historial.map((h) => [h.cita_id, h])),
    [historial],
  )
  const ultimoHistorial = historial[0] // ya viene ordenado desc por created_at

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

      {/* Tu última receta — resumen de la visita completada mas reciente */}
      {ultimoHistorial && (
        <div className="card border-l-4 border-l-helios-primary">
          <div className="flex items-center gap-2">
            <img src="/reloj.png" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-helios-primary">
              Tu última receta
            </h2>
          </div>
          <p className="mt-2 text-sm text-helios-ink/60">
            Dr(a). {ultimoHistorial.medico?.nombre ?? 'Médico'} ·{' '}
            {formatFechaLarga(ultimoHistorial.created_at)}
          </p>
          <BloqueHistorial hist={ultimoHistorial} />
        </div>
      )}

      {loading && <LoadingSpinner label="Cargando tus citas…" />}
      {error && <ErrorMessage message={error} />}
      {aviso && <SuccessMessage message={aviso} />}
      {/* CU-04 flujo 2.3.2: fallo al consultar el historial clínico. */}
      {errorHistorial && (
        <ErrorMessage message="No se pudo cargar la información. Intenta nuevamente." />
      )}

      {!loading && !error && data.length === 0 && (
        <div className="card text-center text-sm text-helios-ink/60">
          Aún no tienes citas agendadas.
        </div>
      )}

      <ul className="space-y-3">
        {data.map((cita) => {
          const estado = cita.estado as EstadoCita
          const esConfirmada = estado === 'confirmada'
          const histDeEstaCita = historialPorCita.get(cita.id)
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
                  <span className="inline-flex items-center gap-1.5">
                    <img src="/calendario.png" alt="" width={16} height={16} className="h-4 w-4" />
                    <strong>{cita.horario.fecha}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <img src="/reloj.png" alt="" width={16} height={16} className="h-4 w-4" />
                    {cita.horario.hora_inicio.slice(0, 5)} — {cita.horario.hora_fin.slice(0, 5)}
                  </span>
                </div>
              )}

              {/* Dolencia + receta de ESTA cita puntual, si el medico ya la registro */}
              {histDeEstaCita && (
                <div className="mt-3 border-t border-helios-ink/5 pt-3">
                  <BloqueHistorial hist={histDeEstaCita} />
                </div>
              )}

              {/* CU-04 flujo 2.3.1: cita atendida sin información clínica registrada. */}
              {estado === 'completada' && !histDeEstaCita && !cargandoHistorial && !errorHistorial && (
                <p className="mt-3 border-t border-helios-ink/5 pt-3 text-sm italic text-helios-ink/50">
                  El médico aún no ha registrado información clínica para esta cita.
                </p>
              )}

              {textoNota(cita.nota_paciente) && (
                <div className="mt-3 rounded-lg bg-helios-mist px-3 py-2 text-sm text-helios-ink/70">
                  <strong>Tu nota:</strong> {textoNota(cita.nota_paciente)}
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
                  <BotonCancelarCita
                    citaId={cita.id}
                    resumen={resumen}
                    onCancelada={() => {
                      setAviso('Cita cancelada exitosamente.')
                      refetch()
                    }}
                  />
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
          onReprogramada={() => {
            setAviso('Cita reprogramada exitosamente.')
            refetch()
          }}
        />
      )}
    </div>
  )
}
