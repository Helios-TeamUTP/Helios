import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { CitaConPaciente, MedicoConRelaciones } from '../lib/types'

const useAuthMock = vi.fn()
const useMedicoCitasMock = vi.fn()
const useHistorialClinicoMock = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../hooks/useMedicoCitas', () => ({
  useMedicoCitas: (medicoId: string | null, modo: string) =>
    useMedicoCitasMock(medicoId, modo),
}))
vi.mock('../hooks/useHistorialClinico', () => ({
  useHistorialClinico: () => useHistorialClinicoMock(),
}))

// Componentes hijos ya testeados aparte — se mockean para aislar la
// lógica propia de MedicoDashboardV2 (tabs, stats, agrupado por día,
// orquestación de completar cita).
vi.mock('../components/medico/FichaPaciente', () => ({
  FichaPaciente: ({ paciente, onClose }: { paciente: { nombre: string }; onClose: () => void }) => (
    <div role="dialog" aria-label="ficha">
      Ficha de {paciente.nombre}
      <button type="button" onClick={onClose}>
        Cerrar ficha
      </button>
    </div>
  ),
}))
vi.mock('../components/medico/ModalCompletarCita', () => ({
  ModalCompletarCita: ({
    cita,
    onClose,
    onGuardar,
  }: {
    cita: { id: string }
    onClose: () => void
    onGuardar: (input: {
      dolenciaPrincipal: string
      receta: string | null
      notasClinicas: string | null
    }) => Promise<void>
  }) => (
    <div role="dialog" aria-label="completar">
      Completar cita {cita.id}
      <button
        type="button"
        onClick={() =>
          onGuardar({ dolenciaPrincipal: 'Gripe', receta: 'Paracetamol', notasClinicas: null }).catch(
            () => {},
          )
        }
      >
        Guardar
      </button>
      <button type="button" onClick={onClose}>
        Cerrar completar
      </button>
    </div>
  ),
}))

import { MedicoDashboardV2 } from './MedicoDashboardV2'

function renderPage() {
  return render(
    <MemoryRouter>
      <MedicoDashboardV2 />
    </MemoryRouter>,
  )
}

function medicoMock(over: Partial<MedicoConRelaciones> = {}): MedicoConRelaciones {
  return {
    id: 'med-1',
    nombre: 'Carlos Ruiz',
    especialidad_id: 'esp-1',
    sede_id: 'sede-1',
    correo: null,
    telefono: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    especialidad: { id: 'esp-1', nombre: 'Pediatría', descripcion: null, created_at: '' },
    sede: { id: 'sede-1', nombre: 'Policlínica Central', ciudad: 'Panamá', direccion: null, capacidad_diaria: 0, activo: true, created_at: '' },
    ...over,
  }
}

function citaMock(over: Partial<CitaConPaciente> = {}): CitaConPaciente {
  return {
    id: 'cita-1',
    paciente_id: 'pac-1',
    medico_id: 'med-1',
    horario_id: 'hor-1',
    sede_id: 'sede-1',
    estado: 'confirmada',
    codigo_confirmacion: 'ABC123',
    created_at: '2026-08-24T00:00:00Z',
    horario: {
      id: 'hor-1',
      medico_id: 'med-1',
      fecha: '2026-07-04',
      hora_inicio: '09:00:00',
      hora_fin: '09:30:00',
      disponible: false,
      created_at: '',
    },
    paciente: {
      id: 'pac-1',
      nombre: 'Juan Pérez',
      cedula: '8-123-4567',
      telefono: '6000-1234',
      correo: null,
      fecha_nacimiento: null,
      created_at: '',
    },
    ...over,
  }
}

function baseMedicoCitas(over: Partial<ReturnType<typeof useMedicoCitasMock>> = {}) {
  return {
    data: [],
    loading: false,
    error: null,
    marcarNoAsistio: vi.fn().mockResolvedValue(undefined),
    reflejarEstado: vi.fn(),
    refetch: vi.fn().mockResolvedValue(undefined),
    ...over,
  }
}

function baseHistorial(over: Record<string, unknown> = {}) {
  return {
    completarCita: vi.fn().mockResolvedValue(undefined),
    guardando: false,
    error: null,
    setError: vi.fn(),
    ...over,
  }
}

describe('<MedicoDashboardV2 />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra error de perfil si no hay médico logueado', () => {
    useAuthMock.mockReturnValue({ medico: null })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas())
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText(/No se pudo cargar el perfil del médico/)).toBeInTheDocument()
  })

  it('saluda con el primer nombre del médico y muestra especialidad/sede', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas())
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByRole('heading', { name: 'Dr. Carlos' })).toBeInTheDocument()
    expect(screen.getByText(/Pediatría/)).toBeInTheDocument()
    expect(screen.getByText(/Policlínica Central/)).toBeInTheDocument()
  })

  it('usa "Sin especialidad" cuando el médico no tiene especialidad asociada', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock({ especialidad: null, sede: null }) })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas())
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText('Sin especialidad')).toBeInTheDocument()
  })

  it('muestra el spinner mientras carga', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ loading: true }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText(/Cargando agenda/)).toBeInTheDocument()
  })

  it('muestra el error si el hook devuelve error', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ error: 'timeout' }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText(/No se pudo cargar la agenda: timeout/)).toBeInTheDocument()
  })

  it('pestaña "hoy" muestra el mensaje vacío correcto', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText('No tienes citas asignadas para hoy.')).toBeInTheDocument()
  })

  it('calcula correctamente las stat cards (total/completadas/en espera/no asistió)', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({
        data: [
          citaMock({ id: 'c1', estado: 'confirmada' }),
          citaMock({ id: 'c2', estado: 'completada' }),
          citaMock({ id: 'c3', estado: 'no_asistio' }),
          citaMock({ id: 'c4', estado: 'confirmada' }),
        ],
      }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()

    expect(screen.getByText('Citas de hoy')).toBeInTheDocument()
    // 4 total, 1 completada, 2 en espera, 1 no asistió
    const values = screen.getAllByText(/^[0-9]+$/).map((el) => el.textContent)
    expect(values).toEqual(expect.arrayContaining(['4', '1', '2', '1']))
  })

  it('en la pestaña "historial" las stats muestran "—" (no aplican)', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock()] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Historial' }))
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
  })

  it('cambiar de pestaña llama a useMedicoCitas con el modo correcto', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas())
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    expect(useMedicoCitasMock).toHaveBeenCalledWith('med-1', 'hoy')

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))
    expect(useMedicoCitasMock).toHaveBeenCalledWith('med-1', 'semana')

    await user.click(screen.getByRole('button', { name: 'Historial' }))
    expect(useMedicoCitasMock).toHaveBeenCalledWith('med-1', 'historial')
  })

  it('en la pestaña "semana" agrupa las citas por día con un encabezado de fecha', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({
        data: [
          citaMock({ id: 'c1', horario: { ...citaMock().horario!, fecha: '2026-07-06' } }),
          citaMock({ id: 'c2', horario: { ...citaMock().horario!, fecha: '2026-07-06' } }),
          citaMock({ id: 'c3', horario: { ...citaMock().horario!, fecha: '2026-07-07' } }),
        ],
      }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))

    // 2026-07-06 es lunes, 2026-07-07 es martes.
    expect(screen.getByText(/Lunes 6 de julio/)).toBeInTheDocument()
    expect(screen.getByText(/Martes 7 de julio/)).toBeInTheDocument()
  })

  it('muestra "Paciente sin datos" cuando la cita no trae paciente', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock({ paciente: null })] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByText('Paciente sin datos')).toBeInTheDocument()
  })

  it('en pestaña "historial" no muestra los botones de completar/no asistió (soloLectura)', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock()] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Historial' }))
    expect(screen.queryByRole('button', { name: /Completada/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /No asistió/ })).not.toBeInTheDocument()
  })

  it('en "hoy"/"semana" con cita confirmada, muestra los botones de acción', () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    renderPage()
    expect(screen.getByRole('button', { name: /Completada/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /No asistió/ })).toBeInTheDocument()
  })

  it('abre y cierra la ficha del paciente correcto', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock()] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Ver ficha' }))
    expect(screen.getByRole('dialog', { name: 'ficha' })).toHaveTextContent('Ficha de Juan Pérez')

    await user.click(screen.getByRole('button', { name: 'Cerrar ficha' }))
    expect(screen.queryByRole('dialog', { name: 'ficha' })).not.toBeInTheDocument()
  })

  it('marca "no asistió" al hacer click en el botón correspondiente', async () => {
    const marcarNoAsistio = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })], marcarNoAsistio }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /No asistió/ }))
    expect(marcarNoAsistio).toHaveBeenCalledWith('cita-1')
  })

  it('muestra un error inline si marcarNoAsistio falla', async () => {
    const marcarNoAsistio = vi.fn().mockRejectedValue(new Error('conexión perdida'))
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })], marcarNoAsistio }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /No asistió/ }))
    await waitFor(() => expect(screen.getByText('conexión perdida')).toBeInTheDocument())
  })

  it('completa la cita en UNA operación atómica y refleja el estado sin recargar', async () => {
    const completarCita = vi.fn().mockResolvedValue(undefined)
    const reflejarEstado = vi.fn()
    const refetch = vi.fn().mockResolvedValue(undefined)
    const marcarNoAsistio = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })], refetch, reflejarEstado, marcarNoAsistio }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial({ completarCita }))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Completada/ }))
    expect(screen.getByRole('dialog', { name: 'completar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(completarCita).toHaveBeenCalledWith({
        citaId: 'cita-1',
        dolenciaPrincipal: 'Gripe',
        receta: 'Paracetamol',
        notasClinicas: null,
      }),
    )
    // Una sola llamada atómica: ya no se hace un "marcar completada" aparte.
    expect(completarCita).toHaveBeenCalledTimes(1)
    expect(marcarNoAsistio).not.toHaveBeenCalled()
    await waitFor(() => expect(reflejarEstado).toHaveBeenCalledWith('cita-1', 'completada'))
    // sin refetch: evitaría el spinner que reemplaza la tabla
    expect(refetch).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'completar' })).not.toBeInTheDocument(),
    )
  })

  it('si completarCita falla no cambia el estado en la agenda y el modal sigue abierto', async () => {
    const completarCita = vi
      .fn()
      .mockRejectedValue(new Error('La dolencia principal es obligatoria para completar la cita'))
    const reflejarEstado = vi.fn()
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(
      baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })], reflejarEstado }),
    )
    useHistorialClinicoMock.mockReturnValue(baseHistorial({ completarCita }))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Completada/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(completarCita).toHaveBeenCalled())
    expect(reflejarEstado).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'completar' })).toBeInTheDocument()
  })

  it('cierra el modal de completar cita sin guardar', async () => {
    useAuthMock.mockReturnValue({ medico: medicoMock() })
    useMedicoCitasMock.mockReturnValue(baseMedicoCitas({ data: [citaMock({ estado: 'confirmada' })] }))
    useHistorialClinicoMock.mockReturnValue(baseHistorial())
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Completada/ }))
    await user.click(screen.getByRole('button', { name: 'Cerrar completar' }))
    expect(screen.queryByRole('dialog', { name: 'completar' })).not.toBeInTheDocument()
  })
})
