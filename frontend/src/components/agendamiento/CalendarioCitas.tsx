import { useHorarios } from '../../hooks/useHorarios'
import { CalendarioCitasLista } from './CalendarioCitasLista'
import type { Horario } from '../../lib/types'

interface Props {
  medicoId: string
  value: Horario | null
  onChange: (horario: Horario) => void
}

/**
 * Selector de horarios disponibles de un médico.
 *
 * Bug B-21 (timezone): ANTES esta vista usaba FullCalendar (timeGridWeek) en
 * desktop. FullCalendar posiciona los eventos construyendo objetos `Date` a
 * partir de cadenas ISO sin zona (`${fecha}T${hora}`), lo que aplicaba el
 * offset de zona horaria del navegador (Panamá UTC-5) y hacía que un slot
 * cuyo título decía "12:30" apareciera/se interpretara en otra hora. El bloque
 * visual no coincidía con la hora real del slot → el usuario creía agendar a
 * una hora distinta.
 *
 * FIX DEFINITIVO: usar SIEMPRE la vista de lista de botones
 * (`CalendarioCitasLista`), tanto en móvil como en desktop. Esa vista muestra
 * la hora con `slice` directo del string (`hora_inicio.slice(0,5)`) sin pasar
 * por `Date`, por lo que es 100% timezone-safe y nunca puede desfasar la hora.
 * Además elimina la dependencia pesada de FullCalendar (reduce el bundle) y la
 * clase entera de bugs de zona horaria en el calendario.
 *
 * El contrato del componente (medicoId, value, onChange) se mantiene igual
 * para que AgendarCita.tsx no requiera cambios.
 */
export function CalendarioCitas({ medicoId, value, onChange }: Props) {
  const { data, loading, error } = useHorarios(medicoId)

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
