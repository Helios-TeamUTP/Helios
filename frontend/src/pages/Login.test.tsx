import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: signInMock },
  },
}))

import { Login } from './Login'

describe('<Login />', () => {
  beforeEach(() => {
    signInMock.mockReset()
    signInMock.mockResolvedValue({ data: { user: null, session: null }, error: null })
  })

  it('renderiza los campos de correo y contraseña', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('llama a supabase.auth.signInWithPassword al enviar el formulario', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))
    expect(signInMock).toHaveBeenCalledWith({
      email: 'paciente@test.com',
      password: 'segura123',
    })
  })

  it('muestra el error devuelto por Supabase Auth', async () => {
    signInMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('incluye un link a la página de registro', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByText('Regístrate')).toHaveAttribute('href', '/registro')
  })
})
