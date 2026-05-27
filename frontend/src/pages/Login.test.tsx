import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: signInMock },
  },
}))

// Mock useAuth para que los tests del formulario no requieran AuthProvider.
// Sin sesión = mostrar el form de login normalmente.
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    paciente: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
    refreshPaciente: vi.fn(),
  }),
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

  it('muestra el error devuelto por Supabase Auth y rehabilita el botón', async () => {
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
    // Regresión B-10: el `finally` debe rehabilitar el botón en el path
    // de error de credenciales. Sin esto, romper el finally pasaría silente.
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).not.toBeDisabled()
  })

  it('incluye un link a la página de registro', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByText('Regístrate')).toHaveAttribute('href', '/registro')
  })

  /**
   * Regresión B-10: cuando Supabase no responde, withTimeout rechaza con
   * TimeoutError tras AUTH_TIMEOUT_MS. El handleSubmit de Login debe
   * detectarlo, mostrar mensaje específico y rehabilitar el botón.
   *
   * Simulamos el outcome del timeout haciendo que signIn rechace
   * directamente con TimeoutError (es lo que withTimeout produce cuando
   * el setTimeout interno gana la Promise.race). La lógica del setTimeout
   * en sí está cubierta por src/lib/withTimeout.test.ts — aquí testeamos
   * el catch/finally del componente, que es el fix concreto del B-10.
   */
  describe('B-10: manejo de TimeoutError en signIn', () => {
    it('muestra mensaje específico cuando signIn rechaza con TimeoutError', async () => {
      signInMock.mockRejectedValue(new TimeoutError(15_000))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /El servidor tardó demasiado en responder/,
      )
    })

    it('rehabilita el botón Iniciar sesión tras un timeout', async () => {
      signInMock.mockRejectedValue(new TimeoutError(15_000))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      await screen.findByRole('alert')
      expect(screen.getByRole('button', { name: /Iniciar sesión/ })).not.toBeDisabled()
    })

    it('muestra mensaje genérico si signIn lanza un error inesperado (no timeout)', async () => {
      signInMock.mockRejectedValue(new Error('Network failure'))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Ocurrió un error inesperado/)
    })
  })
})
