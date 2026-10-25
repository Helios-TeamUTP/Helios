import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { useSedesMock } = vi.hoisted(() => ({ useSedesMock: vi.fn() }))
vi.mock('../../hooks/useSedes', () => ({ useSedes: useSedesMock }))

import { SelectorSede } from './SelectorSede'

const sede = (over: Record<string, unknown> = {}) => ({
  id: 'sede-1',
  nombre: 'Policlínica Central',
  ciudad: 'Panamá',
  direccion: 'Av. Justo Arosemena',
  capacidad_diaria: 200,
  activo: true,
  created_at: '',
  ...over,
})

function setHook(over: { data?: unknown[]; loading?: boolean; error?: string | null } = {}) {
  useSedesMock.mockReturnValue({ data: [sede()], loading: false, error: null, ...over })
}

describe('<SelectorSede />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setHook()
  })

  it('lista las sedes activas', () => {
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Policlínica Central')).toBeInTheDocument()
    expect(screen.getByText('Panamá')).toBeInTheDocument()
    expect(screen.getByText('Av. Justo Arosemena')).toBeInTheDocument()
  })

  it('dispara onChange al hacer click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectorSede value={null} onChange={onChange} />)
    await user.click(screen.getByText('Policlínica Central'))
    expect(onChange).toHaveBeenCalledWith('sede-1', 'Policlínica Central')
  })

  it('marca la sede activa y no marca las demás', () => {
    setHook({ data: [sede(), sede({ id: 'sede-2', nombre: 'Clínica Norte' })] })
    render(<SelectorSede value="sede-2" onChange={vi.fn()} />)
    expect(screen.getByText('Clínica Norte').closest('button')?.className).toContain('ring-2')
    expect(screen.getByText('Policlínica Central').closest('button')?.className).not.toContain(
      'ring-2',
    )
  })

  it('no muestra dirección si la sede no la tiene', () => {
    setHook({ data: [sede({ direccion: null })] })
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.queryByText('Av. Justo Arosemena')).not.toBeInTheDocument()
    expect(screen.getByText('Policlínica Central')).toBeInTheDocument()
  })

  it('muestra el spinner mientras carga', () => {
    setHook({ data: [], loading: true })
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Cargando sedes…')).toBeInTheDocument()
  })

  it('muestra el error si falla la carga', () => {
    setHook({ data: [], error: 'Fallo de red' })
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red')
  })

  it('avisa cuando no hay sedes activas', () => {
    setHook({ data: [] })
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No hay sedes activas registradas.')
  })

  it('expone el grupo "Sede" (fieldset + legend) a los lectores de pantalla', () => {
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Sede' })).toBeInTheDocument()
  })

  it('al re-renderizar con las mismas props mantiene lo mostrado', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SelectorSede value="sede-1" onChange={onChange} />)
    rerender(<SelectorSede value="sede-1" onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Sede' })).toBeInTheDocument()
    expect(screen.getByText('Policlínica Central').closest('button')?.className).toContain('ring-2')
  })

  it('actualiza la sede activa cuando cambia value', () => {
    setHook({ data: [sede(), sede({ id: 'sede-2', nombre: 'Clínica Norte' })] })
    const onChange = vi.fn()
    const { rerender } = render(<SelectorSede value="sede-1" onChange={onChange} />)
    rerender(<SelectorSede value="sede-2" onChange={onChange} />)
    expect(screen.getByText('Clínica Norte').closest('button')?.className).toContain('ring-2')
    expect(screen.getByText('Policlínica Central').closest('button')?.className).not.toContain(
      'ring-2',
    )
  })
})
