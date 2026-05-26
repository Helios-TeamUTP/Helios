import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../hooks/useSedes', () => ({
  useSedes: () => ({
    data: [
      {
        id: 'sede-1',
        nombre: 'Policlínica Central',
        ciudad: 'Panamá',
        direccion: 'Av. Justo Arosemena',
        capacidad_diaria: 200,
        activo: true,
        created_at: '',
      },
    ],
    loading: false,
    error: null,
  }),
}))

import { SelectorSede } from './SelectorSede'

describe('<SelectorSede />', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista las sedes activas', () => {
    render(<SelectorSede value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Policlínica Central')).toBeInTheDocument()
    expect(screen.getByText('Panamá')).toBeInTheDocument()
  })

  it('dispara onChange al hacer click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectorSede value={null} onChange={onChange} />)
    await user.click(screen.getByText('Policlínica Central'))
    expect(onChange).toHaveBeenCalledWith('sede-1', 'Policlínica Central')
  })
})
