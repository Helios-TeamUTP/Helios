import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const useAuthMock = vi.fn()
const useCitasMock = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../hooks/useCitas', () => ({ useCitas: () => useCitasMock() }))

import { MisCitas } from './MisCitas'

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
          notas: 'Primera consulta',
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
})
