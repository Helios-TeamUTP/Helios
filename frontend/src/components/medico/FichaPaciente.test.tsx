import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CitaConRelaciones, HistorialClinico, Paciente } from '../../lib/types'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('../../lib/supabase', () => ({
  supabase: { from: fromMock },
}))

import { FichaPaciente } from './FichaPaciente'

/** Builder thenable: .select().eq().order().limit() resuelve a { data, error }. */
function mockQuery(data: unknown, error: { message: string } | null = null) {
  const builder: Record<string, unknown> = {}
  const chainable = ['select', 'eq', 'order', 'limit'] as const
  for (const method of chainable) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
    resolve({ data, error })
  return builder
}

function pacienteMock(over: Partial<Paciente> = {}): Paciente {
  return {
    id: 'pac-1',
    nombre: 'Juan Pérez',
    cedula: '8-123-4567',
    telefono: '6000-1234',
    correo: 'juan@example.com',
    fecha_nacimiento: '1990-05-10',
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function citaMock(over: Partial<CitaConRelaciones> = {}): CitaConRelaciones {
  return {
    id: 'cita-1',
    paciente_id: 'pac-1',
    medico_id: 'med-1',
    horario_id: 'hor-1',
    sede_id: 'sede-1',
    estado: 'completada',
    notas: null,
    codigo_confirmacion: 'ABC123',
    created_at: '2026-08-24T00:00:00Z',
    horario: {
      id: 'hor-1',
      medico_id: 'med-1',
      fecha: '2026-08-24',
      hora_inicio: '09:00:00',
      hora_fin: '09:30:00',
      disponible: false,
      created_at: '2026-01-01T00:00:00Z',
    },
    medico: {
      id: 'med-1',
      nombre: 'Dra. García',
      especialidad_id: 'esp-1',
      sede_id: 'sede-1',
      correo: null,
      telefono: null,
      activo: true,
      created_at: '2026-01-01T00:00:00Z',
      especialidad: { id: 'esp-1', nombre: 'Cardiología', descripcion: null, created_at: '2026-01-01T00:00:00Z' },
    },
    sede: null,
    ...over,
  }
}

function historialMock(over: Partial<HistorialClinico> = {}): HistorialClinico {
  return {
    id: 'hist-1',
    cita_id: 'cita-1',
    paciente_id: 'pac-1',
    medico_id: 'med-1',
    dolencia_principal: 'Dolor de cabeza',
    receta: 'Ibuprofeno 400mg',
    notas_clinicas: null,
    created_at: '2026-08-24T00:00:00Z',
    ...over,
  }
}

/** Configura el mock de `supabase.from` para las dos tablas que consulta el componente. */
function setupFrom({
  citas = [],
  citasError = null,
  historial = [],
  historialError = null,
}: {
  citas?: unknown[]
  citasError?: { message: string } | null
  historial?: unknown[]
  historialError?: { message: string } | null
} = {}) {
  fromMock.mockImplementation((table: string) => {
    if (table === 'citas') return mockQuery(citas, citasError)
    if (table === 'historial_clinico') return mockQuery(historial, historialError)
    throw new Error(`Tabla inesperada en el mock: ${table}`)
  })
}

describe('<FichaPaciente />', () => {
  it('muestra el spinner mientras carga', () => {
    setupFrom()
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    expect(screen.getByText(/Cargando historial/)).toBeInTheDocument()
  })

  it('renderiza los datos básicos del paciente', async () => {
    setupFrom()
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Juan Pérez' })).toBeInTheDocument()
    expect(screen.getByText('8-123-4567')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '6000-1234' })).toHaveAttribute(
      'href',
      'tel:6000-1234',
    )
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
    expect(screen.getByText('1990-05-10')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText(/Cargando historial/)).not.toBeInTheDocument())
  })

  it('muestra "No registrado" cuando falta teléfono o correo', async () => {
    setupFrom()
    render(
      <FichaPaciente
        paciente={pacienteMock({ telefono: null, correo: null })}
        onClose={vi.fn()}
      />,
    )
    await waitFor(() => expect(screen.queryByText(/Cargando historial/)).not.toBeInTheDocument())
    expect(screen.getAllByText('No registrado')).toHaveLength(2)
  })

  it('muestra mensaje vacío cuando el paciente no tiene citas previas', async () => {
    setupFrom({ citas: [] })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByText(/no tiene citas registradas previas/)).toBeInTheDocument(),
    )
  })

  it('renderiza cada cita del historial con fecha, hora, médico y especialidad', async () => {
    setupFrom({ citas: [citaMock()] })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByText(/2026-08-24/)).toBeInTheDocument())
    expect(screen.getByText(/09:00/)).toBeInTheDocument()
    // "uppercase" es solo CSS (text-transform); el texto real en el DOM es en minúsculas.
    expect(screen.getByText('completada')).toBeInTheDocument()
    expect(screen.getByText(/Dra\. García/)).toBeInTheDocument()
    expect(screen.getByText(/Cardiología/)).toBeInTheDocument()
  })

  it('usa "Médico desconocido" cuando la cita no trae médico', async () => {
    setupFrom({ citas: [citaMock({ medico: null })] })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Médico desconocido')).toBeInTheDocument())
  })

  it('muestra dolencia, receta y notas clínicas cuando existe historial_clinico para la cita', async () => {
    setupFrom({
      citas: [citaMock()],
      historial: [historialMock({ notas_clinicas: 'Paciente responde bien al tratamiento' })],
    })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Dolor de cabeza')).toBeInTheDocument())
    expect(screen.getByText('Ibuprofeno 400mg')).toBeInTheDocument()
    expect(screen.getByText('Paciente responde bien al tratamiento')).toBeInTheDocument()
  })

  it('no muestra sección de dolencia/receta si no hay historial_clinico para esa cita (RLS de otro médico)', async () => {
    setupFrom({ citas: [citaMock()], historial: [] })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByText(/Dra\. García/)).toBeInTheDocument())
    expect(screen.queryByText(/Dolencia:/)).not.toBeInTheDocument()
  })

  it('no muestra receta si el historial no la trae', async () => {
    setupFrom({
      citas: [citaMock()],
      historial: [historialMock({ receta: null })],
    })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Dolor de cabeza')).toBeInTheDocument())
    expect(screen.queryByText(/Receta:/)).not.toBeInTheDocument()
  })

  it('muestra el error si falla la consulta de citas', async () => {
    // El componente hace `throw citasError` con el objeto {message} que
    // devuelve Supabase (no una instancia de Error real), y el catch usa
    // `err instanceof Error ? err.message : 'Error desconocido'`. Por eso
    // el mensaje mostrado siempre es genérico, nunca el de Supabase.
    setupFrom({ citasError: { message: 'network down' } })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error desconocido'),
    )
  })

  it('muestra el error si falla la consulta de historial_clinico', async () => {
    setupFrom({ citas: [citaMock()], historialError: { message: 'permiso denegado' } })
    render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error desconocido'),
    )
  })

  it('llama a onClose al hacer click en el botón X', async () => {
    setupFrom()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /Cerrar ficha/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al hacer click en el backdrop', async () => {
    setupFrom()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)

    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('NO llama a onClose al hacer click dentro de la tarjeta (stopPropagation)', async () => {
    setupFrom()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)

    await user.click(screen.getByRole('heading', { name: 'Juan Pérez' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('llama a onClose al presionar Escape', async () => {
    setupFrom()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPaciente paciente={pacienteMock()} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('no actualiza el estado tras desmontar (evita warning de act / memory leak)', async () => {
    let resolveCitas: (v: { data: unknown; error: unknown }) => void = () => {}
    const pendingBuilder: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order', 'limit']) {
      pendingBuilder[m] = vi.fn(() => pendingBuilder)
    }
    pendingBuilder.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) => {
      resolveCitas = resolve
    }
    fromMock.mockImplementation((table: string) => {
      if (table === 'citas') return pendingBuilder
      return mockQuery([])
    })

    const { unmount } = render(<FichaPaciente paciente={pacienteMock()} onClose={vi.fn()} />)
    unmount()

    // Resolver la promesa despues del unmount no debe lanzar ni actualizar estado.
    expect(() => resolveCitas({ data: [], error: null })).not.toThrow()
  })
})
