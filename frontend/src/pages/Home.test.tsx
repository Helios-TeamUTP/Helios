import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const useAuthMock = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

import { Home } from './Home'

describe('<Home />', () => {
  it('muestra CTAs de registro y login cuando no hay usuario', () => {
    useAuthMock.mockReturnValue({ user: null, paciente: null })
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText('Crear cuenta gratuita')).toBeInTheDocument()
    expect(screen.getByText('Ya tengo cuenta')).toBeInTheDocument()
  })

  it('muestra CTAs de agendar y mis citas cuando hay usuario', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', email: 'a@a.com' },
      paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-456' },
    })
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText('Agendar una cita')).toBeInTheDocument()
    expect(screen.getByText('Ver mis citas')).toBeInTheDocument()
  })

  it('saluda al paciente registrado con su nombre', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', email: 'a@a.com' },
      paciente: { id: 'p1', nombre: 'Ana', cedula: '8-123-456' },
    })
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Ana/)).toBeInTheDocument()
    expect(screen.getByText(/8-123-456/)).toBeInTheDocument()
  })
})
