import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { PacienteConHistorial } from '../lib/types'

const useAuthMock = vi.fn()
const usePacientesMedicoMock = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../hooks/usePacientesMedico', () => ({
  usePacientesMedico: (medicoId: string | null) => usePacientesMedicoMock(medicoId),
}))

// FichaPaciente ya tiene su propia suite de tests dedicada (llama a
// supabase directamente); aquí solo verificamos que PacientesMedico la
// abra/cierre con el paciente correcto.
vi.mock('../components/medico/FichaPaciente', () => ({
  FichaPaciente: ({
    paciente,
    onClose,
  }: {
    paciente: { nombre: string }
    onClose: () => void
  }) => (
    <div role="dialog">
      Ficha de {paciente.nombre}
      <button type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  ),
}))

import { PacientesMedico } from './PacientesMedico'

function renderPage() {
  return render(
    <MemoryRouter>
      <PacientesMedico />
    </MemoryRouter>,
  )
}

function medicoMock() {
  return {
    id: 'med-1',
    nombre: 'Dra. García',
    especialidad_id: 'esp-1',
    sede_id: 'sede-1',
    correo: null,
    telefono: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
  }
}

function filaMock(over: Partial<PacienteConHistorial> = {}): PacienteConHistorial {
  return {
    paciente: {
      id: 'pac-1',
      nombre: 'Juan Pérez',
      cedula: '8-123-4567',
      telefono: null,
      correo: null,
      fecha_nacimiento: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    dolencia_principal: 'Dolor de cabeza',
    receta: 'Ibuprofeno 400mg',
    ultima_visita: '2026-07-04',
    ...over,
  }
}

describe('<PacientesMedico />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra error de perfil si no hay médico logueado', () => {
    useAuthMock.mockReturnValue({ medico: null })
    usePacientesMedicoMock.mockReturnValue({ data: [], loading: false, error: null })
    renderPage()
    expect(screen.getByText(/No se pudo cargar el perfil del médico/)).toBeInTheDocument()
  })

  it('muestra el spinner mientras carga', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({ data: [], loading: true, error: null })
    renderPage()
    expect(screen.getByText(/Cargando pacientes/)).toBeInTheDocument()
  })

  it('muestra el error si el hook devuelve error', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({ data: [], loading: false, error: 'RLS denegado' })
    renderPage()
    expect(
      screen.getByText(/No se pudo cargar la lista de pacientes: RLS denegado/),
    ).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay pacientes', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({ data: [], loading: false, error: null })
    renderPage()
    expect(screen.getByText(/Aún no tienes citas completadas registradas/)).toBeInTheDocument()
  })

  it('renderiza una fila por paciente con dolencia, fecha y receta', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock()],
      loading: false,
      error: null,
    })
    renderPage()

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Cédula 8-123-4567')).toBeInTheDocument()
    expect(screen.getByText('Dolor de cabeza')).toBeInTheDocument()
    expect(screen.getByText('04 JUL 2026')).toBeInTheDocument()
    expect(screen.getByText('Ibuprofeno 400mg')).toBeInTheDocument()
  })

  it('muestra "Sin receta registrada" cuando la receta es null', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock({ receta: null })],
      loading: false,
      error: null,
    })
    renderPage()
    expect(screen.getByText('Sin receta registrada')).toBeInTheDocument()
  })

  it('cuenta correctamente en singular cuando hay 1 paciente', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock()],
      loading: false,
      error: null,
    })
    renderPage()
    expect(screen.getByText(/1 paciente registrado bajo su cuidado/)).toBeInTheDocument()
  })

  it('cuenta correctamente en plural cuando hay varios pacientes', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock(), filaMock({ paciente: { ...filaMock().paciente, id: 'pac-2', nombre: 'Ana López' } })],
      loading: false,
      error: null,
    })
    renderPage()
    expect(screen.getByText(/2 pacientes registrados bajo su cuidado/)).toBeInTheDocument()
  })

  it('filtra por nombre al escribir en el buscador', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [
        filaMock(),
        filaMock({
          paciente: { ...filaMock().paciente, id: 'pac-2', nombre: 'Ana López', cedula: '4-999-8888' },
        }),
      ],
      loading: false,
      error: null,
    })
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Ana López')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/Buscar por nombre o cédula/), 'ana')

    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
  })

  it('filtra por cédula al escribir en el buscador', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock()],
      loading: false,
      error: null,
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText(/Buscar por nombre o cédula/), '8-123')
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText(/Buscar por nombre o cédula/))
    await user.type(screen.getByPlaceholderText(/Buscar por nombre o cédula/), 'no-existe')
    expect(screen.getByText(/Ningún paciente coincide con esa búsqueda/)).toBeInTheDocument()
  })

  it('abre la ficha del paciente correcto al hacer click en "Ver ficha" y la cierra', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({
      data: [filaMock()],
      loading: false,
      error: null,
    })
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver ficha' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Ficha de Juan Pérez')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('pasa el id del médico autenticado al hook usePacientesMedico', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    usePacientesMedicoMock.mockReturnValue({ data: [], loading: false, error: null })
    renderPage()
    expect(usePacientesMedicoMock).toHaveBeenCalledWith('med-1')
  })
})
