import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { fromMock, signUpMock, refreshPerfilMock, navigateMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  signUpMock: vi.fn(),
  refreshPerfilMock: vi.fn().mockResolvedValue(undefined),
  // Bug B-20: verificamos que Register navega a /login con el state correcto.
  navigateMock: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: { signUp: signUpMock },
  },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    paciente: null,
    role: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
    refreshPerfil: refreshPerfilMock,
  }),
}))

// Bug B-20: mockeamos useNavigate para verificar redirect a /login con state
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import { Register } from './Register'

describe('<Register />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Limpiar sessionStorage entre tests (B-20)
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

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

  it('muestra error cuando la contraseña es muy corta', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    // El input de password tiene minLength=6, lo cual previene submit por validación HTML.
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

  /**
   * Bug B-20: el flujo nuevo es signUp → guardar en sessionStorage → navigate a /login.
   * NO se insertan paciente ni link aquí — eso lo hace Login.tsx tras signInWithPassword.
   *
   * Este es el happy path actualizado: verifica que tras signUp exitoso,
   * Register guarda los datos del paciente y redirige a /login.
   */
  it('B-20: registro nuevo guarda datos en sessionStorage y redirige a /login', async () => {
    // Cédula libre (chequeo previo a signUp)
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })

    signUpMock.mockResolvedValue({
      data: { user: { id: 'auth-uid-xyz' }, session: null },
      error: null,
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
    await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
    await user.type(screen.getByLabelText('Teléfono'), '6000-0000')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    // signUp se llamó con las credenciales
    await vi.waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'ana@test.com',
        password: 'segura123',
      })
    })

    // sessionStorage tiene los datos del paciente para que Login.tsx los use
    const pendienteJson = sessionStorage.getItem('helios_pending_paciente')
    expect(pendienteJson).not.toBeNull()
    expect(JSON.parse(pendienteJson!)).toEqual({
      nombre: 'Ana López',
      cedula: '8-123-4567',
      telefono: '6000-0000',
      correo: 'ana@test.com',
    })

    // Navega a /login con state correcto
    expect(navigateMock).toHaveBeenCalledWith('/login', {
      replace: true,
      state: {
        registroExitoso: true,
        email: 'ana@test.com',
      },
    })

    // NO se inserta paciente ni link aquí (eso es responsabilidad de Login)
    expect(refreshPerfilMock).not.toHaveBeenCalled()
  })

  it('muestra error si la cédula ya está registrada para otro paciente', async () => {
    const maybeSingleExisting = vi.fn().mockResolvedValue({
      data: { id: 'pac-existente' },
      error: null,
    })
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleExisting }),
      }),
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
    await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Ya existe un paciente con esa cédula/,
    )
    expect(signUpMock).not.toHaveBeenCalled()
    // Regresión B-10: el `finally` debe rehabilitar el botón en el path
    // de error temprano (cédula duplicada).
    expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
    // No se guarda nada en sessionStorage si la cédula ya existe
    expect(sessionStorage.getItem('helios_pending_paciente')).toBeNull()
  })

  /**
   * Regresión B-10: cuando alguno de los awaits a Supabase rechaza con
   * TimeoutError (lo que produce withTimeout cuando vence), el handleSubmit
   * debe mostrar el mensaje específico y rehabilitar el botón.
   */
  describe('B-10: manejo de TimeoutError en signUp', () => {
    beforeEach(() => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
    })

    it('muestra mensaje específico y rehabilita el botón cuando signUp rechaza con TimeoutError', async () => {
      signUpMock.mockRejectedValue(new TimeoutError(15_000))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
      await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /El servidor tardó demasiado en responder/,
      )
      expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
    })

    it('muestra mensaje genérico si signUp lanza error inesperado (no timeout)', async () => {
      signUpMock.mockRejectedValue(new Error('Algo random'))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Nombre completo'), 'Ana López')
      await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Ocurrió un error inesperado/)
    })
  })
})
