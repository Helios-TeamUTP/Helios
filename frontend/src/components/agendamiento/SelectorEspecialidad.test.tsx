import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { useEspecialidadesMock } = vi.hoisted(() => ({ useEspecialidadesMock: vi.fn() }))
vi.mock('../../hooks/useEspecialidades', () => ({ useEspecialidades: useEspecialidadesMock }))

import { SelectorEspecialidad } from './SelectorEspecialidad'

const ESPECIALIDADES = [
  { id: 'esp-1', nombre: 'Cardiología', descripcion: 'Corazón', created_at: '' },
  { id: 'esp-2', nombre: 'Pediatría', descripcion: 'Niños', created_at: '' },
]

function setHook(over: { data?: unknown[]; loading?: boolean; error?: string | null } = {}) {
  useEspecialidadesMock.mockReturnValue({
    data: ESPECIALIDADES,
    loading: false,
    error: null,
    ...over,
  })
}

describe('<SelectorEspecialidad />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setHook()
  })

  it('renderiza la lista de especialidades', () => {
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Cardiología')).toBeInTheDocument()
    expect(screen.getByText('Pediatría')).toBeInTheDocument()
    expect(screen.getByText('Corazón')).toBeInTheDocument()
  })

  it('llama a onChange con el id y nombre al seleccionar opción', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectorEspecialidad value={null} onChange={onChange} />)
    await user.click(screen.getByText('Cardiología'))
    expect(onChange).toHaveBeenCalledWith('esp-1', 'Cardiología')
  })

  it('marca la opción activa cuando coincide con value', () => {
    render(<SelectorEspecialidad value="esp-2" onChange={vi.fn()} />)
    const boton = screen.getByText('Pediatría').closest('button')
    expect(boton?.className).toContain('ring-helios-primary')
  })

  it('no marca como activas las opciones que no coinciden con value', () => {
    render(<SelectorEspecialidad value="esp-2" onChange={vi.fn()} />)
    expect(screen.getByText('Cardiología').closest('button')?.className).not.toContain('ring-2')
  })

  it('no muestra descripción si la especialidad no la tiene', () => {
    setHook({ data: [{ id: 'esp-3', nombre: 'Dermatología', descripcion: null, created_at: '' }] })
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Dermatología')).toBeInTheDocument()
    expect(screen.queryByText('Corazón')).not.toBeInTheDocument()
  })

  it('muestra el spinner mientras carga', () => {
    setHook({ data: [], loading: true })
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Cargando especialidades…')).toBeInTheDocument()
  })

  it('muestra el error si falla la carga', () => {
    setHook({ data: [], error: 'Fallo de red' })
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red')
  })

  it('avisa cuando no hay especialidades registradas', () => {
    setHook({ data: [] })
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No hay especialidades registradas')
  })
})
