import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ResumenCita } from './ResumenCita'

describe('<ResumenCita />', () => {
  const baseProps = {
    codigoConfirmacion: 'ABC12345',
    medicoNombre: 'Ana López',
    especialidadNombre: 'Cardiología',
    sedeNombre: 'Policlínica Central',
    fecha: '2026-06-01',
    horaInicio: '09:00:00',
    onAgendarOtra: vi.fn(),
  }

  it('muestra el codigo de confirmacion prominente', () => {
    render(
      <MemoryRouter>
        <ResumenCita {...baseProps} />
      </MemoryRouter>,
    )
    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    expect(screen.getByText(/¡Cita confirmada!/)).toBeInTheDocument()
  })

  it('formatea la hora a HH:MM eliminando los segundos', () => {
    render(
      <MemoryRouter>
        <ResumenCita {...baseProps} horaInicio="14:30:00" />
      </MemoryRouter>,
    )
    expect(screen.getByText('14:30')).toBeInTheDocument()
  })

  it('llama onAgendarOtra cuando el usuario hace click en "Agendar otra cita"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ResumenCita {...baseProps} />
      </MemoryRouter>,
    )
    await user.click(screen.getByText('Agendar otra cita'))
    expect(baseProps.onAgendarOtra).toHaveBeenCalled()
  })
})
