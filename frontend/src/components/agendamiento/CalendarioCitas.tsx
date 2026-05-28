import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useHorarios } from '../../hooks/useHorarios'
import { useIsMobile } from '../../hooks/useIsMobile'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'
import { CalendarioCitasLista } from './CalendarioCitasLista'
import type { Horario } from '../../lib/types'

interface Props {
  medicoId: string
  value: Horario | null
  onChange: (horario: Horario) => void
}

export function CalendarioCitas({ medicoId, value, onChange }: Props) {
  // Bug B-18: todos los hooks SIEMPRE corren primero (rules-of-hooks).
  // El branching mobile/desktop se hace en el render, no en el orden de hooks.
  const isMobile = useIsMobile()
  const { data, loading, error } = useHorarios(medicoId)

  const events = useMemo(
    () =>
      data.map((h) => ({
        id: h.id,
        title: `${h.hora_inicio.slice(0, 5)} - ${h.hora_fin.slice(0, 5)}`,
        start: `${h.fecha}T${h.hora_inicio}`,
        end: `${h.fecha}T${h.hora_fin}`,
        extendedProps: { horario: h },
        backgroundColor: value?.id === h.id ? '#0A4F6B' : '#0A8478',
        borderColor: value?.id === h.id ? '#0A4F6B' : '#0A8478',
      })),
    [data, value],
  )

  /**
   * Bug B-18: en pantallas <=768px, FullCalendar timeGridWeek se desordena
   * (7 columnas en 360px de ancho = ~50px por dia, imposible leer slots
   * de 20 min). En movil delegamos a una vista de lista mas amigable.
   * Desktop sigue con FullCalendar (mejor experiencia visual).
   */
  if (isMobile) {
    return (
      <CalendarioCitasLista
        horarios={data}
        loading={loading}
        error={error}
        value={value}
        onChange={onChange}
      />
    )
  }

  // Desktop: FullCalendar (codigo original).
  if (loading) return <LoadingSpinner label="Cargando horarios disponibles…" />
  if (error) return <ErrorMessage message={error} />
  if (data.length === 0)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Este médico no tiene horarios disponibles en este momento.
      </div>
    )

  const firstDate = data[0]?.fecha

  return (
    <div className="space-y-3">
      <p className="text-sm text-helios-ink/60">
        Selecciona un horario disponible. Solo se muestran los slots libres.
      </p>
      <div className="rounded-xl border border-helios-ink/10 bg-white p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={firstDate}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth',
          }}
          locale="es"
          firstDay={1}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="18:00:00"
          height="auto"
          events={events}
          eventClick={(info) => {
            const horario = (info.event.extendedProps as { horario: Horario }).horario
            onChange(horario)
          }}
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana' }}
        />
      </div>
      {value && (
        <div className="rounded-lg border border-helios-primary/30 bg-helios-primary/5 px-4 py-3 text-sm text-helios-ink">
          Horario seleccionado: <strong>{value.fecha}</strong> de{' '}
          <strong>{value.hora_inicio.slice(0, 5)}</strong> a{' '}
          <strong>{value.hora_fin.slice(0, 5)}</strong>
        </div>
      )}
    </div>
  )
}
