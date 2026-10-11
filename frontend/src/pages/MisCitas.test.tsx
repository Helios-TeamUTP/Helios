import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const useAuthMock = vi.fn()
const useCitasMock = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../hooks/useCitas', () => ({ useCitas: () => useCitasMock() }))

// Mockeamos los componentes hijos (ya testeados aparte) para aislar la
// lógica de MisCitas: qué botones aparecen según el estado y la apertura
// del modal de reprogramar.
vi.mock('../components/citas/BotonCancelarCita', () => ({
  BotonCancelarCita: ({ citaId }: { citaId: string }) => (
    <button type="button">Cancelar-{citaId}</button>
  ),
}))
vi.mock('../components/citas/ReprogramarCitaModal', () => ({
  ReprogramarCitaModal: () => <div role="dialog">Reprogramar modal</div>,
}))

import { MisCitas } from './MisCitas'

/** Construye una cita con relaciones para los tests. */
function buildCita(over: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    paciente_id: 'p1',
    medico_id: 'm1',
    horario_id: 'h1',
    sede_id: 's1',
    estado: 'confirmada',
    notas: null,
    codigo_confirmacion: 'ABC12345',
    created_at: '',
    horario: {
      id: 'h1', medico_id: 'm1', fecha: '2026-06-05',
      hora_inicio: '09:00:00', hora_fin: '09:20:00', disponible: false, created_at: '',
    },
    medico: {
      id: 'm1', nombre: 'Carlos Ruiz',
      especialidad: { id: 'e1', nombre: 'Cardiología', descripcion: null, created_at: '' },
      especialidad_id: 'e1', sede_id: 's1', correo: null, telefono: null, activo: true, created_at: '',
    },
    sede: { id: 's1', nombre: 'Policlínica Central', ciudad: 'Panamá', direccion: null, capacidad_diaria: 0, activo: true, created_at: '' },
    ...over,
  }
}

describe('<MisCitas />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invita a registrarse cuando no hay paciente', () => {
    useAuthMock.mockReturnValue({ paciente: null })
    useCitasMock.mockReturnValue({ data: [], loading: false, error: null })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Necesitas registrarte/)).toBeInTheDocument()
    expect(screen.getByText('Crear cuenta')).toHaveAttribute('href', '/registro')
  })

  it('saluda al paciente con su nombre y cédula', () => {
    useAuthMock.mockReturnValue({
      paciente: { id: 'p1', nombre: 'Ana López', cedula: '8-123-4567' },
    })
    useCitasMock.mockReturnValue({ data: [], loading: false, error: null })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Ana López/)).toBeInTheDocument()
    expect(screen.getByText(/8-123-4567/)).toBeInTheDocument()
  })

  it('muestra mensaje vacío cuando no hay citas', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({ data: [], loading: false, error: null })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Aún no tienes citas agendadas/)).toBeInTheDocument()
  })

  it('lista las citas existentes con código, médico, sede y horario', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({
      data: [
        {
          id: 'c1',
          paciente_id: 'p1',
          medico_id: 'm1',
          horario_id: 'h1',
          sede_id: 's1',
          estado: 'confirmada',
          notas: null,
          nota_paciente: { nota: 'Primera consulta' },
          codigo_confirmacion: 'ABC12345',
          created_at: '',
          horario: { id: 'h1', medico_id: 'm1', fecha: '2026-06-05', hora_inicio: '09:00:00', hora_fin: '09:20:00', disponible: false, created_at: '' },
          medico: { id: 'm1', nombre: 'Carlos Ruiz', especialidad: { id: 'e1', nombre: 'Cardiología', descripcion: null, created_at: '' }, especialidad_id: 'e1', sede_id: 's1', correo: null, telefono: null, activo: true, created_at: '' },
          sede: { id: 's1', nombre: 'Policlínica Central', ciudad: 'Panamá', direccion: null, capacidad_diaria: 0, activo: true, created_at: '' },
        },
      ],
      loading: false,
      error: null,
    })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    expect(screen.getByText(/Carlos Ruiz/)).toBeInTheDocument()
    expect(screen.getByText(/Policlínica Central/)).toBeInTheDocument()
    expect(screen.getByText(/2026-06-05/)).toBeInTheDocument()
    expect(screen.getByText(/Primera consulta/)).toBeInTheDocument()
  })

  it('B-34: muestra la nota privada del paciente desde nota_paciente', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({
      data: [buildCita({ nota_paciente: { nota: 'Traer exámenes de sangre' } })],
      loading: false,
      error: null,
    })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Tu nota:/)).toBeInTheDocument()
    expect(screen.getByText(/Traer exámenes de sangre/)).toBeInTheDocument()
  })

  it('B-34: no renderiza la columna legacy citas.notas ni un bloque vacío', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({
      data: [buildCita({ notas: 'texto legacy', nota_paciente: null })],
      loading: false,
      error: null,
    })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/texto legacy/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu nota:/)).not.toBeInTheDocument()
  })

  it('muestra el indicador de carga cuando loading=true', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({ data: [], loading: true, error: null })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Cargando tus citas/)).toBeInTheDocument()
  })

  it('muestra el error cuando viene del hook', () => {
    useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    useCitasMock.mockReturnValue({ data: [], loading: false, error: 'Falla de red' })
    render(
      <MemoryRouter>
        <MisCitas />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Falla de red')
  })

  /**
   * Sprint 2 (ST-7): cancelar/reprogramar solo se ofrecen en citas confirmadas.
   */
  describe('Sprint 2: botones cancelar/reprogramar', () => {
    beforeEach(() => {
      useAuthMock.mockReturnValue({ paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-4567' } })
    })

    it('cita confirmada: muestra Reprogramar y Cancelar', () => {
      useCitasMock.mockReturnValue({
        data: [buildCita({ estado: 'confirmada' })],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(
        <MemoryRouter>
          <MisCitas />
        </MemoryRouter>,
      )
      expect(screen.getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancelar-c1/ })).toBeInTheDocument()
    })

    it('cita cancelada: NO muestra botones y muestra badge Cancelada', () => {
      useCitasMock.mockReturnValue({
        data: [buildCita({ estado: 'cancelada' })],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(
        <MemoryRouter>
          <MisCitas />
        </MemoryRouter>,
      )
      expect(screen.queryByRole('button', { name: 'Reprogramar' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Cancelar-c1/ })).not.toBeInTheDocument()
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })

    it('al hacer clic en Reprogramar abre el modal', async () => {
      useCitasMock.mockReturnValue({
        data: [buildCita({ estado: 'confirmada' })],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <MisCitas />
        </MemoryRouter>,
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Reprogramar' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
