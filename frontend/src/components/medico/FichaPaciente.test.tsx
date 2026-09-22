import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockSupabase } from '../../test/supabase-mock'
import type { Paciente } from '../../lib/types'

const { supabaseMock } = vi.hoisted(() => ({ supabaseMock: { from: vi.fn() } }))
vi.mock('../../lib/supabase', () => ({ supabase: supabaseMock }))

import { FichaPaciente } from './FichaPaciente'

function pacienteMock(over: Partial<Paciente> = {}): Paciente {
  return {
    id: 'pac-1',
    nombre: 'María González',
    cedula: '8-712-4531',
    telefono: null,
    correo: null,
    fecha_nacimiento: null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function citaRow(over: Record<string, unknown> = {}) {
  return {
    id: 'cita-1',
    estado: 'completada',
    horario: { fecha: '2026-08-20', hora_inicio: '09:00:00' },
    medico: { nombre: 'Dr. Alberto Guevara', especialidad: { nombre: 'Cardiología' } },
    ...over,
  }
}

/** Aplica el mock de supabase.from para citas + historial_clinico de una vez. */
function mockearRespuesta(citas: unknown[], historial: unknown[] = []) {
  const mock = createMockSupabase({
    citas: { data: citas },
    historial_clinico: { data: historial },
  })
  supabaseMock.from.mockImplementation(mock.from)
}

describe('<FichaPaciente />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el spinner de carga mientras llegan los datos', () => {
    mockearRespuesta([])
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(screen.getByText(/Cargando historial/)).toBeInTheDocument()
  })

  it('renderiza el nombre y la cédula del paciente', async () => {
    mockearRespuesta([])
    render(<FichaPaciente paciente={pacienteMock({ nombre: 'María González' })} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'María González' })).toBeInTheDocument()
    expect(screen.getByText('8-712-4531')).toBeInTheDocument()
  })

  it('muestra el teléfono como link "tel:" cuando existe', async () => {
    mockearRespuesta([])
    render(
      <FichaPaciente
        paciente={pacienteMock({ telefono: '6612-3456' })}
        onClose={vi.fn()}
      />,
    )
    await waitFor(() => {
      const link = screen.getByRole('link', { name: '6612-3456' })
      expect(link).toHaveAttribute('href', 'tel:6612-3456')
    })
  })

  it('muestra "No registrado" cuando faltan teléfono y correo', async () => {
    mockearRespuesta([])
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getAllByText('No registrado')).toHaveLength(2)
    })
  })

  it('muestra el mensaje de "sin citas" cuando el paciente no tiene historial', async () => {
    mockearRespuesta([])
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(
      await screen.findByText('Este paciente no tiene citas registradas previas.'),
    ).toBeInTheDocument()
  })

  it('renderiza las citas con médico, especialidad y estado', async () => {
    mockearRespuesta([citaRow()])
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(await screen.findByText(/Dr. Alberto Guevara/)).toBeInTheDocument()
    expect(screen.getByText(/Cardiología/)).toBeInTheDocument()
    expect(screen.getByText('completada')).toBeInTheDocument()
  })

  it('muestra dolencia, receta y notas cuando hay historial_clinico para esa cita', async () => {
    mockearRespuesta(
      [citaRow({ id: 'cita-1' })],
      [
        {
          cita_id: 'cita-1',
          dolencia_principal: 'Dolor torácico atípico',
          receta: 'Continuar tratamiento habitual',
          notas_clinicas: 'Control en 1 mes',
        },
      ],
    )
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(await screen.findByText('Dolor torácico atípico')).toBeInTheDocument()
    expect(screen.getByText('Continuar tratamiento habitual')).toBeInTheDocument()
    expect(screen.getByText('Control en 1 mes')).toBeInTheDocument()
  })

  it('NO muestra bloque de historial si la cita no tiene registro clínico', async () => {
    mockearRespuesta([citaRow({ id: 'cita-sin-historial' })], [])
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    await screen.findByText(/Dr. Alberto Guevara/)
    expect(screen.queryByText(/Dolencia:/)).not.toBeInTheDocument()
  })

  it('muestra "Error desconocido" si la consulta de citas falla (error no es instancia de Error, igual que Supabase real)', async () => {
    supabaseMock.from.mockImplementation(
      createMockSupabase({ citas: { data: null, error: { message: 'Fallo de red' } } }).from,
    )
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(await screen.findByText(/No se pudo cargar el historial: Error desconocido/)).toBeInTheDocument()
  })

  it('llama a onClose al hacer clic en el botón de cerrar', async () => {
    mockearRespuesta([])
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar ficha' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al hacer clic en el fondo (backdrop)', async () => {
    mockearRespuesta([])
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al presionar la tecla Escape', async () => {
    mockearRespuesta([])
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
