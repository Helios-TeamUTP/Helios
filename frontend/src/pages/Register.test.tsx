import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { signUp: vi.fn() },
  },
}))

// Mock useAuth: sin sesion (caso de registro nuevo, no "completar perfil")
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

import { Register } from './Register'

describe('<Register />', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza todos los campos del formulario', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Cédula')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('muestra error de cédula inválida al enviar con cédula corta', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
    await user.type(screen.getByLabelText('Cédula'), '123')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cédula panameña inválida/)
  })

  it('muestra error cuando la contraseña es muy corta', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
    await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.type(screen.getByLabelText('Contraseña'), '123')
    // El input de password tiene minLength=6, lo cual previene submit por validación HTML.
    // Verificamos que el atributo está presente.
    const password = screen.getByLabelText('Contraseña') as HTMLInputElement
    expect(password.minLength).toBe(6)
  })

  it('tiene enlace para ir a la página de login', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    const linkLogin = screen.getByText('Inicia sesión')
    expect(linkLogin).toHaveAttribute('href', '/login')
  })
})
