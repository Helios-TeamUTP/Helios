import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../hooks/useEspecialidades', () => ({
  useEspecialidades: () => ({
    data: [
      { id: 'esp-1', nombre: 'Cardiología', descripcion: 'Corazón', created_at: '' },
      { id: 'esp-2', nombre: 'Pediatría', descripcion: 'Niños', created_at: '' },
    ],
    loading: false,
    error: null,
  }),
}))

import { SelectorEspecialidad } from './SelectorEspecialidad'

describe('<SelectorEspecialidad />', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza la lista de especialidades', () => {
    render(<SelectorEspecialidad value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Cardiología')).toBeInTheDocument()
    expect(screen.getByText('Pediatría')).toBeInTheDocument()
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
})
