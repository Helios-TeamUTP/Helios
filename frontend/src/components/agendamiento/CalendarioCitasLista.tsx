import { useMemo } from 'react'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'
import type { Horario, HorarioAgendable } from '../../lib/types'

/**
 * Props: recibe horarios ya cargados desde el padre (CalendarioCitas) para
 * evitar duplicar la llamada useHorarios.
 */
interface Props {
  horarios: HorarioAgendable[]
  loading: boolean
  error: string | null
  value: Horario | null
  onChange: (horario: Horario) => void
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const BASE_BOTON_HORARIO =
  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-helios-primary focus-visible:ring-offset-2'

/** Clases del boton de hora segun su estado (dia completo > seleccionado > normal). */
function claseBotonHorario(diaCompleto: boolean, seleccionado: boolean): string {
  if (diaCompleto) {
    return `${BASE_BOTON_HORARIO} cursor-not-allowed border-helios-ink/10 bg-helios-ink/5 text-helios-ink/30 line-through`
  }
  if (seleccionado) {
    return `${BASE_BOTON_HORARIO} border-helios-deep bg-helios-deep text-white shadow-card`
  }
  return `${BASE_BOTON_HORARIO} border-helios-primary/30 bg-helios-primary/5 text-helios-primary hover:bg-helios-primary/15 active:bg-helios-primary/25`
}

/**
 * Formatea 'YYYY-MM-DD' a 'jueves 28 de mayo'.
 * Local-safe: parseamos los componentes a mano para evitar timezone shifts
 * que harian que 'YYYY-MM-DD' aparezca como el dia anterior en zonas con
 * offset negativo (como Panama UTC-5).
 */
function formatFechaLarga(fechaIso: string): string {
  const [year, month, day] = fechaIso.split('-').map(Number)
  const fecha = new Date(year, month - 1, day)
  const diaSemana = DIAS[fecha.getDay()]
  const mes = MESES[fecha.getMonth()]
  return `${diaSemana} ${day} de ${mes}`
}

/**
 * Vista ÚNICA del selector de horarios: lista de slots agrupados por día,
 * con un grid de botones (1 por slot) en móvil y desktop.
 *
 * Bug B-18: nació como vista móvil (FullCalendar timeGridWeek se desordenaba
 * en pantallas <768px).
 * Bug B-21: se adoptó también en desktop porque FullCalendar desfasaba la
 * hora por zona horaria. Esta vista muestra la hora con `slice` directo del
 * string (sin `Date`), por lo que es 100% timezone-safe. Más legible, más
 * táctil, sin librería pesada.
 */
export function CalendarioCitasLista({ horarios, loading, error, value, onChange }: Readonly<Props>) {
  // Agrupar horarios por fecha (ordenados ascendente).
  const porDia = useMemo(() => {
    const grupos = new Map<string, HorarioAgendable[]>()
    for (const h of horarios) {
      const lista = grupos.get(h.fecha) ?? []
      lista.push(h)
      grupos.set(h.fecha, lista)
    }
    // Cada lista ordenada por hora_inicio (data ya viene ordenada del hook,
    // pero por defensa lo aseguramos aqui).
    for (const lista of grupos.values()) {
      lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }
    // Devolver array ordenado por fecha.
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [horarios])

  if (loading) return <LoadingSpinner label="Cargando horarios disponibles…" />
  if (error) return <ErrorMessage message={error} />
  if (porDia.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Este médico no tiene horarios disponibles en este momento.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-helios-ink/60">
        Selecciona un horario disponible. Elige cualquier hora de la lista.
      </p>

      <ul className="space-y-4">
        {porDia.map(([fecha, slotsDelDia]) => {
          // Sprint 5: un día está completo si el médico ya llegó al tope de
          // citas ese día (la RPC lo marca igual en todos los slots del día).
          const diaCompleto = slotsDelDia.some((h) => h.dia_completo)
          return (
            <li
              key={fecha}
              className={`rounded-xl border p-4 ${
                diaCompleto ? 'border-helios-ink/10 bg-helios-mist' : 'border-helios-ink/10 bg-white'
              }`}
            >
              <h3 className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold capitalize text-helios-deep">
                <span>{formatFechaLarga(fecha)}</span>
                {diaCompleto && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Día completo
                  </span>
                )}
              </h3>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
              >
                {slotsDelDia.map((h) => {
                  const seleccionado = value?.id === h.id
                  return (
                    <button
                      key={h.id}
                      type="button"
                      disabled={diaCompleto}
                      onClick={() => onChange(h)}
                      aria-pressed={seleccionado}
                      title={diaCompleto ? 'Este día ya está completo. Elige otro día.' : undefined}
                      className={claseBotonHorario(diaCompleto, seleccionado)}
                    >
                      {h.hora_inicio.slice(0, 5)}
                    </button>
                  )
                })}
              </div>
              {diaCompleto && (
                <p className="mt-2 text-xs text-amber-700">
                  Este médico ya tiene todas sus citas para este día. Elige otro día disponible.
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {value && (
        <div className="rounded-lg border border-helios-primary/30 bg-helios-primary/5 px-4 py-3 text-sm text-helios-ink">
          Horario seleccionado: <strong>{formatFechaLarga(value.fecha)}</strong> a las{' '}
          <strong>{value.hora_inicio.slice(0, 5)}</strong>
        </div>
      )}
    </div>
  )
}
