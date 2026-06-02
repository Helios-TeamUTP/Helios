import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { fromMock, signUpMock, signOutMock, refreshPerfilMock, navigateMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  signUpMock: vi.fn(),
  // Bug B-20.1: signOut tras signUp para forzar re-login manual.
  signOutMock: vi.fn().mockResolvedValue({ error: null }),
  refreshPerfilMock: vi.fn().mockResolvedValue(undefined),
  // Bug B-20: verificamos que Register navega a /login con el state correcto.
  navigateMock: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: { signUp: signUpMock, signOut: signOutMock },
  },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    paciente: null,
    role: null,
    session: null,
    loading: false,
    loadPerfilFailed: false,
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

/**
 * Helper B-23/B-24: llena el formulario completo con valores válidos por
 * defecto (incluye confirmar cédula y confirmar contraseña), permitiendo
 * sobreescribir campos puntuales para probar validaciones.
 */
type Campos = Partial<{
  nombre: string
  cedula: string
  cedulaConfirm: string
  telefono: string
  correo: string
  password: string
  passwordConfirm: string
}>

async function llenarRegistro(user: ReturnType<typeof userEvent.setup>, o: Campos = {}) {
  const v = {
    nombre: 'Ana López',
    cedula: '8-123-4567',
    cedulaConfirm: '8-123-4567',
    telefono: '6000-0000',
    correo: 'ana@test.com',
    password: 'segura123',
    passwordConfirm: 'segura123',
    ...o,
  }
  await user.type(screen.getByLabelText('Nombre completo'), v.nombre)
  await user.type(screen.getByLabelText('Cédula'), v.cedula)
  await user.type(screen.getByLabelText('Confirmar cédula'), v.cedulaConfirm)
  if (v.telefono) await user.type(screen.getByLabelText(/Teléfono/), v.telefono)
  await user.type(screen.getByLabelText('Correo electrónico'), v.correo)
  await user.type(screen.getByLabelText('Contraseña'), v.password)
  await user.type(screen.getByLabelText('Confirmar contraseña'), v.passwordConfirm)
}

function mockCedulaLibre() {
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  })
}

describe('<Register />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('renderiza todos los campos del formulario (incluye confirmaciones)', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Cédula')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar cédula')).toBeInTheDocument()
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
  })

  it('B-22: muestra ejemplos de cédula en pantalla', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    // Al menos un ejemplo característico debe aparecer como ayuda.
    expect(screen.getByText(/PE-5-687/)).toBeInTheDocument()
  })

  it('muestra error de cédula inválida al enviar con cédula corta', async () => {
    mockCedulaLibre()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { cedula: '123', cedulaConfirm: '123' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cédula panameña inválida/)
  })

  it('tiene enlace para ir a la página de login', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    expect(screen.getByText('Inicia sesión')).toHaveAttribute('href', '/login')
  })

  /**
   * Bug B-20 happy path (actualizado B-23/B-24): tras signUp exitoso,
   * Register guarda los datos en sessionStorage y redirige a /login.
   */
  it('B-20: registro nuevo guarda datos en sessionStorage y redirige a /login', async () => {
    mockCedulaLibre()
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
    await llenarRegistro(user)
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    await vi.waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'ana@test.com',
        password: 'segura123',
      })
    })
    await vi.waitFor(() => {
      expect(signOutMock).toHaveBeenCalled()
    })

    const pendienteJson = sessionStorage.getItem('helios_pending_paciente')
    expect(pendienteJson).not.toBeNull()
    expect(JSON.parse(pendienteJson!)).toEqual({
      nombre: 'Ana López',
      cedula: '8-123-4567',
      telefono: '6000-0000',
      correo: 'ana@test.com',
    })

    expect(navigateMock).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { registroExitoso: true, email: 'ana@test.com' },
    })
    expect(refreshPerfilMock).not.toHaveBeenCalled()
  })

  /**
   * Bug B-22: una cédula válida corta con prefijo (PE-5-687) ya NO debe
   * rechazarse. El flujo debe llegar a signUp.
   */
  it('B-22: acepta cédula PE-5-687 (válida corta) y llega a signUp', async () => {
    mockCedulaLibre()
    signUpMock.mockResolvedValue({
      data: { user: { id: 'auth-pe' }, session: null },
      error: null,
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { cedula: 'PE-5-687', cedulaConfirm: 'PE-5-687' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled())
  })

  /**
   * Bug B-23: si la cédula no coincide con su confirmación, error claro y
   * NO se llama a signUp.
   */
  it('B-23: error si la cédula y su confirmación no coinciden', async () => {
    mockCedulaLibre()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { cedula: '8-123-4567', cedulaConfirm: '8-123-9999' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Las cédulas no coinciden/)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  /**
   * Bug B-23: si la contraseña no coincide con su confirmación, error claro.
   */
  it('B-23: error si las contraseñas no coinciden', async () => {
    mockCedulaLibre()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { password: 'segura123', passwordConfirm: 'otra12345' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Las contraseñas no coinciden/)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  /**
   * Bug B-24: teléfono con letras se rechaza con mensaje claro.
   */
  it('B-24: error si el teléfono tiene letras', async () => {
    mockCedulaLibre()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { telefono: '6000-ABCD' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Teléfono inválido/)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  /**
   * Bug B-24: nombre con números se rechaza.
   */
  it('B-24: error si el nombre tiene números', async () => {
    mockCedulaLibre()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { nombre: 'Ana123' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Nombre inválido/)
    expect(signUpMock).not.toHaveBeenCalled()
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
    await llenarRegistro(user)
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Ya existe un paciente con esa cédula/,
    )
    expect(signUpMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
    expect(sessionStorage.getItem('helios_pending_paciente')).toBeNull()
  })

  /**
   * Regresión B-10: cuando signUp rechaza con TimeoutError, el handleSubmit
   * muestra el mensaje específico y rehabilita el botón.
   */
  describe('B-10: manejo de TimeoutError en signUp', () => {
    beforeEach(() => {
      mockCedulaLibre()
    })

    it('muestra mensaje específico y rehabilita el botón cuando signUp rechaza con TimeoutError', async () => {
      signUpMock.mockRejectedValue(new TimeoutError(15_000))
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await llenarRegistro(user)
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
      await llenarRegistro(user)
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Ocurrió un error inesperado/)
    })
  })
})
