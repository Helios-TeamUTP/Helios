import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const {
  fromMock,
  rpcMock,
  signUpMock,
  refreshPerfilMock,
  navigateMock,
  signOutAuthMock,
  authOverride,
} = vi.hoisted(
  () => ({
    // Contexto de auth mutable: permite simular sesion con/sin paciente.
    authOverride: { value: {} as Record<string, unknown> },
    signOutAuthMock: vi.fn().mockResolvedValue(undefined),
    fromMock: vi.fn(),
    // CU-01: los pre-chequeos de cédula/correo son RPC anónimos (boolean).
    rpcMock: vi.fn(),
    signUpMock: vi.fn(),
    refreshPerfilMock: vi.fn().mockResolvedValue(undefined),
    // Verificamos que Register navega a /login (sin sesion) con el state correcto.
    navigateMock: vi.fn(),
  }),
)

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
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
    loadPerfilFailed: false,
    signOut: signOutAuthMock,
    refreshPerfil: refreshPerfilMock,
    ...authOverride.value,
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
  if (v.passwordConfirm) {
    await user.type(screen.getByLabelText('Confirmar contraseña'), v.passwordConfirm)
  }
}

function mockCedulaLibre() {
  // Cédula y correo libres: ambos RPC de pre-chequeo responden false.
  rpcMock.mockResolvedValue({ data: false, error: null })
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
    expect(await screen.findByRole('alert')).toHaveTextContent(/El formato de la cédula no es válido/)
  })

  it('tiene enlace para ir a la página de login', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    expect(screen.getByText('Ya tengo cuenta')).toHaveAttribute('href', '/login')
  })

  /**
   * Registro automatico: los datos del paciente viajan en options.data del
   * signUp (un trigger de la base crea paciente + vinculo). Register ya NO
   * inserta nada en tablas ni usa sessionStorage.
   */
  it('signUp envia nombre/cedula/telefono como metadata y NO inserta paciente desde el cliente', async () => {
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
    await llenarRegistro(user, { correo: 'Ana@Test.com' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    await vi.waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'ana@test.com',
        password: 'segura123',
        options: {
          data: { nombre: 'Ana López', cedula: '8-123-4567', telefono: '6000-0000' },
        },
      })
    })
    // Nada de escrituras desde el cliente ni de estado en sessionStorage.
    expect(fromMock).not.toHaveBeenCalled()
    expect(sessionStorage.length).toBe(0)
  })

  it('sin sesion tras el signUp (confirmacion de correo): redirige a /login con banner', async () => {
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
      expect(navigateMock).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { registroExitoso: true, email: 'ana@test.com' },
      })
    })
  })

  it('con sesion tras el signUp: NO navega a /login y deja el boton ocupado hasta que useAuth cargue el perfil', async () => {
    mockCedulaLibre()
    signUpMock.mockResolvedValue({
      data: { user: { id: 'auth-uid-xyz' }, session: { access_token: 't' } },
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

    await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled())
    expect(navigateMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Creando cuenta/ })).toBeDisabled()
  })

  it('si el trigger rechaza (cedula/correo repetidos) muestra mensaje claro y rehabilita el boton', async () => {
    mockCedulaLibre()
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Database error saving new user', status: 500 },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user)
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo crear la cuenta/)
    expect(alerta).not.toHaveTextContent(/Database error/)
    expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
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
    expect(await screen.findByRole('alert')).toHaveTextContent(/La cédula no coincide con la confirmación/)
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
    expect(await screen.findByRole('alert')).toHaveTextContent(/La contraseña no coincide con la confirmación/)
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
    expect(await screen.findByRole('alert')).toHaveTextContent(/Ingresa un número de teléfono válido/)
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
    rpcMock.mockImplementation((nombre: string) =>
      Promise.resolve({ data: nombre === 'cedula_ya_registrada', error: null }),
    )

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
    expect(rpcMock).toHaveBeenCalledWith('cedula_ya_registrada', { p_cedula: '8-123-4567' })
    expect(signUpMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
    expect(sessionStorage.length).toBe(0)
  })

  /** CA-01-01 / CU-01 2.3.1: campos obligatorios vacíos → mensaje del documento. */
  it('CA-01-01: rechaza el envío con un campo obligatorio vacío y nombra el campo', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    // Todo vacío: el primero que falta es el nombre.
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Debe completar nombre completo para continuar.',
    )
    expect(signUpMock).not.toHaveBeenCalled()
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('CA-01-01: con todo lleno salvo la confirmación de contraseña, pide completarla', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { passwordConfirm: '' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Debe completar confirmar contraseña para continuar.',
    )
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('el teléfono es opcional: dejarlo vacío NO dispara "Debe completar"', async () => {
    mockCedulaLibre()
    signUpMock.mockResolvedValue({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { telefono: '' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled())
  })

  /** CA-01-04 (red de seguridad): si el pre-chequeo no lo detecta, signUp lo rechaza en inglés. */
  it('CA-01-04: traduce "User already registered" de signUp al mensaje del documento', async () => {
    mockCedulaLibre()
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered', code: 'user_already_exists' },
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user)
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Ya existe una cuenta con este correo. Inicia sesión.')
    expect(alerta).not.toHaveTextContent(/User already registered/)
  })

  /** CA-01-04: no se puede registrar un correo que ya tiene cuenta. */
  it('CA-01-04: rechaza un correo ya registrado antes de crear la cuenta', async () => {
    rpcMock.mockImplementation((nombre: string) =>
      Promise.resolve({ data: nombre === 'correo_ya_registrado', error: null }),
    )

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )
    await llenarRegistro(user, { correo: 'Ana@Test.com' })
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una cuenta con este correo. Inicia sesión.',
    )
    // El correo se normaliza (trim + minúsculas) antes de consultar.
    expect(rpcMock).toHaveBeenCalledWith('correo_ya_registrado', { p_correo: 'ana@test.com' })
    expect(signUpMock).not.toHaveBeenCalled()
    expect(sessionStorage.length).toBe(0)
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

      expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo completar el registro\. Intenta nuevamente\./)
    })
  })
})

describe('<Register /> — con sesión iniciada (ya no hay "Completa tu perfil")', () => {
  const sesion = { id: 'auth-1', email: 'azul@test.com' }

  function renderConRutas() {
    return render(
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<Register />} />
          <Route path="/agendar" element={<div>PANTALLA AGENDAR</div>} />
          <Route path="/medico" element={<div>PANTALLA MEDICO</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    authOverride.value = {}
  })

  it('usuario con paciente va directo a /agendar (sin formulario)', () => {
    authOverride.value = { user: sesion, paciente: { id: 'p1' }, role: 'paciente' }
    renderConRutas()
    expect(screen.getByText('PANTALLA AGENDAR')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()
  })

  it('medico va a /medico', () => {
    authOverride.value = { user: sesion, role: 'medico' }
    renderConRutas()
    expect(screen.getByText('PANTALLA MEDICO')).toBeInTheDocument()
  })

  it('sesion SIN perfil muestra "No encontramos tu perfil" y NUNCA un formulario para completarlo', () => {
    authOverride.value = { user: sesion }
    renderConRutas()
    expect(screen.getByText('No encontramos tu perfil')).toBeInTheDocument()
    expect(screen.queryByText('Completa tu perfil de paciente')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()
  })

  it('"Cerrar sesión" cierra la sesion y vuelve a /login', async () => {
    authOverride.value = { user: sesion }
    const user = userEvent.setup()
    renderConRutas()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(signOutAuthMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('si loadPerfil fallo muestra "Reintentar" en vez de asumir que no hay perfil', async () => {
    authOverride.value = { user: sesion, loadPerfilFailed: true }
    const user = userEvent.setup()
    renderConRutas()

    expect(screen.queryByText('No encontramos tu perfil')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refreshPerfilMock).toHaveBeenCalledTimes(1)
  })
})
