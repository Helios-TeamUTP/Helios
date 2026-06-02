import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarioCitasLista } from './CalendarioCitasLista'
import type { Horario } from '../../lib/types'

/**
 * Bug B-21: la vista de botones es timezone-safe — muestra y selecciona la
 * hora con `slice` directo del string, sin pasar por Date. Estos tests
 * blindan que un slot "12:30:00" se muestre como "12:30" (no se desfase) y
 * que al elegirlo se pase EXACTAMENTE ese horario.
 */
function horario(over: Partial<Horario>): Horario {
  return {
    id: 'h1',
    medico_id: 'm1',
    fecha: '2026-06-15',
    hora_inicio: '12:30:00',
    hora_fin: '12:50:00',
    disponible: true,
    created_at: '2026-06-01T00:00:00Z',
    ...over,
  } as Horario
}

describe('<CalendarioCitasLista /> (B-21 timezone-safe)', () => {
  it('muestra la hora exacta del slot sin desfase (12:30)', () => {
    render(
      <CalendarioCitasLista
        horarios={[horario({})]}
        loading={false}
        error={null}
        value={null}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '12:30' })).toBeInTheDocument()
  })

  it('al elegir un slot pasa el horario correcto a onChange', async () => {
    const onChange = vi.fn()
    const h = horario({ id: 'slot-1230', hora_inicio: '12:30:00' })
    const user = userEvent.setup()
    render(
      <CalendarioCitasLista
        horarios={[h]}
        loading={false}
        error={null}
        value={null}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: '12:30' }))
    expect(onChange).toHaveBeenCalledWith(h)
    // El horario seleccionado conserva la hora original (no 07:00 ni otra).
    expect(onChange.mock.calls[0][0].hora_inicio).toBe('12:30:00')
  })

  it('muestra mensaje cuando no hay horarios', () => {
    render(
      <CalendarioCitasLista
        horarios={[]}
        loading={false}
        error={null}
        value={null}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText(/no tiene horarios disponibles/i)).toBeInTheDocument()
  })
})
