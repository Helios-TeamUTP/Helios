import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CitaConRelaciones } from '../../lib/types'

const { reprogramarMock, hookState } = vi.hoisted(() => ({
  reprogramarMock: vi.fn(),
  hookState: { loading: false, error: null as string | null },
}))

vi.mock('../../hooks/useReprogramarCita', () => ({
  useReprogramarCita: () => ({
    reprogramar: reprogramarMock,
    loading: hookState.loading,
    error: hookState.error,
  }),
}))

// El calendario real tiene sus propios tests: aqui solo interesa que el modal
// le pase las props correctas y reaccione a la seleccion.
vi.mock('../agendamiento/CalendarioCitas', () => ({
  CalendarioCitas: ({
    medicoId,
    excluirCitaId,
    onChange,
  }: {
    medicoId: string
    excluirCitaId?: string
    onChange: (h: { id: string }) => void
  }) => (
    <div data-testid="calendario" data-medico={medicoId} data-excluir={excluirCitaId}>
      <button type="button" onClick={() => onChange({ id: 'h2' })}>
        Elegir horario
      </button>
    </div>
  ),
}))

import { ReprogramarCitaModal } from './ReprogramarCitaModal'

function citaMock(over: Partial<Record<string, unknown>> = {}): CitaConRelaciones {
  return {
    id: 'c1',
    medico_id: 'm1',
    medico: { nombre: 'Ana Pérez' },
    horario: { fecha: '2026-06-15', hora_inicio: '09:30:00' },
    ...over,
  } as unknown as CitaConRelaciones
}

describe('<ReprogramarCitaModal /> (ST-38)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hookState.loading = false
    hookState.error = null
  })

  it('muestra el médico, el horario actual y pasa medicoId y excluirCitaId al calendario', () => {
    render(<ReprogramarCitaModal cita={citaMock()} onClose={vi.fn()} onReprogramada={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Reprogramar cita' })).toBeInTheDocument()
    expect(screen.getByText(/Dr\(a\)\. Ana Pérez/)).toBeInTheDocument()
    expect(screen.getByText(/Horario actual: 2026-06-15 a las 09:30/)).toBeInTheDocument()
    const calendario = screen.getByTestId('calendario')
    expect(calendario).toHaveAttribute('data-medico', 'm1')
    expect(calendario).toHaveAttribute('data-excluir', 'c1')
  })

  it('usa "tu médico" y omite el horario actual si la cita no los trae', () => {
    render(
      <ReprogramarCitaModal
        cita={citaMock({ medico: null, horario: null })}
        onClose={vi.fn()}
        onReprogramada={vi.fn()}
      />,
    )

    expect(screen.getByText(/Dr\(a\)\. tu médico/)).toBeInTheDocument()
    expect(screen.queryByText(/Horario actual/)).not.toBeInTheDocument()
  })

  it('si la cita no tiene médico, muestra el error y no el calendario', () => {
    render(
      <ReprogramarCitaModal
        cita={citaMock({ medico_id: null })}
        onClose={vi.fn()}
        onReprogramada={vi.fn()}
      />,
    )

    expect(screen.getByText(/no tiene un médico asignado/)).toBeInTheDocument()
    expect(screen.queryByTestId('calendario')).not.toBeInTheDocument()
  })

  it('"Confirmar nuevo horario" está deshabilitado hasta elegir un horario', async () => {
    const user = userEvent.setup()
    render(<ReprogramarCitaModal cita={citaMock()} onClose={vi.fn()} onReprogramada={vi.fn()} />)

    const confirmar = screen.getByRole('button', { name: 'Confirmar nuevo horario' })
    expect(confirmar).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Elegir horario' }))
    expect(confirmar).toBeEnabled()
  })

  it('al confirmar con éxito llama a reprogramar, onClose y onReprogramada', async () => {
    reprogramarMock.mockResolvedValue(true)
    const onClose = vi.fn()
    const onReprogramada = vi.fn()
    const user = userEvent.setup()
    render(
      <ReprogramarCitaModal cita={citaMock()} onClose={onClose} onReprogramada={onReprogramada} />,
    )

    await user.click(screen.getByRole('button', { name: 'Elegir horario' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar nuevo horario' }))

    expect(reprogramarMock).toHaveBeenCalledWith('c1', 'h2')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onReprogramada).toHaveBeenCalledTimes(1)
  })

  it('si reprogramar falla (false), NO cierra ni refresca la lista', async () => {
    reprogramarMock.mockResolvedValue(false)
    const onClose = vi.fn()
    const onReprogramada = vi.fn()
    const user = userEvent.setup()
    render(
      <ReprogramarCitaModal cita={citaMock()} onClose={onClose} onReprogramada={onReprogramada} />,
    )

    await user.click(screen.getByRole('button', { name: 'Elegir horario' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar nuevo horario' }))

    expect(reprogramarMock).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(onReprogramada).not.toHaveBeenCalled()
  })

  it('muestra el error que devuelve el hook', () => {
    hookState.error = 'El horario ya no está disponible'
    render(<ReprogramarCitaModal cita={citaMock()} onClose={vi.fn()} onReprogramada={vi.fn()} />)

    expect(screen.getByText('El horario ya no está disponible')).toBeInTheDocument()
  })

  it('mientras reprograma muestra "Reprogramando…" y deshabilita los botones', () => {
    hookState.loading = true
    render(<ReprogramarCitaModal cita={citaMock()} onClose={vi.fn()} onReprogramada={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Reprogramando…' })).toBeDisabled()
    for (const cerrar of screen.getAllByRole('button', { name: 'Cerrar' })) {
      expect(cerrar).toBeDisabled()
    }
  })

  it('los dos botones "Cerrar" (X y texto) llaman a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ReprogramarCitaModal cita={citaMock()} onClose={onClose} onReprogramada={vi.fn()} />)

    const cerrar = screen.getAllByRole('button', { name: 'Cerrar' })
    expect(cerrar).toHaveLength(2)
    await user.click(cerrar[0])
    await user.click(cerrar[1])
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
