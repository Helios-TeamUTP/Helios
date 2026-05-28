import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { signInMock, getUserMock, getSessionMock, fromMock, refreshPerfilMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  // Bug B-20: getUser + from son necesarios para completarRegistroPendiente
  getUserMock: vi.fn(),
  // Bug B-20.2: getSession se llama para polling JWT propagado antes de
  // hacer queries que dependen de auth.uid() en RLS.
  getSessionMock: vi.fn(),
  fromMock: vi.fn(),
  // Fix C-1 (code review B-20): hoisteado para verificar que Login lo llama
  // tras el INSERT exitoso (cierra la carrera contra onAuthStateChange).
  refreshPerfilMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInMock,
      getUser: getUserMock,
      getSession: getSessionMock,
    },
    from: fromMock,
  },
}))

// Mock useAuth para que los tests del formulario no requieran AuthProvider.
// Sin sesión = mostrar el form de login normalmente.
// Bug B-20.3: incluimos registroPendienteError y clearRegistroPendienteError
// porque Login los consume del context (para el banner rojo de diagnostico).
const { useAuthMock, clearRegistroPendienteErrorMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  clearRegistroPendienteErrorMock: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

import { Login } from './Login'

describe('<Login />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    signInMock.mockResolvedValue({ data: { user: null, session: null }, error: null })
    // Default: getUser y from no se usan a menos que un test los configure
    getUserMock.mockResolvedValue({ data: { user: null } })
    // B-20.2: getSession default devuelve session activa (polling pasa inmediato)
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 't', user: { id: 'auth-default' } } },
    })
    // B-20.3: useAuth default - sin sesion, sin error de registro pendiente
    useAuthMock.mockReturnValue({
      user: null,
      paciente: null,
      session: null,
      loading: false,
      registroPendienteError: null,
      signOut: vi.fn(),
      refreshPerfil: refreshPerfilMock,
      clearRegistroPendienteError: clearRegistroPendienteErrorMock,
    })
  })

  afterEach(() => {
    sessionStorage.clear()
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

  /**
   * Bug B-20.3: completarRegistroPendiente fue movida a useAuth.tsx
   * (onAuthStateChange handler) para eliminar el race condition que dejaba
   * paciente=null tras crear el link. Login.tsx ya NO ejecuta esa logica.
   * Aqui solo verificamos:
   *   - Login muestra el banner rojo si registroPendienteError viene del context
   *   - Login llama clearRegistroPendienteError al re-enviar el form
   *   - El happy path sigue funcionando (signIn delega a useAuth)
   */
  describe('B-20.3: errores de registro pendiente vienen de useAuth', () => {
    it('muestra el banner rojo si registroPendienteError viene del context', () => {
      useAuthMock.mockReturnValue({
        user: null,
        paciente: null,
        session: null,
        loading: false,
        registroPendienteError: 'crear paciente: duplicate key value violates unique constraint',
        signOut: vi.fn(),
        refreshPerfil: refreshPerfilMock,
        clearRegistroPendienteError: clearRegistroPendienteErrorMock,
      })

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(/No pudimos completar tu registro/)
      expect(alert).toHaveTextContent(/duplicate key value/)
    })

    it('llama clearRegistroPendienteError al re-enviar el form de login', async () => {
      useAuthMock.mockReturnValue({
        user: null,
        paciente: null,
        session: null,
        loading: false,
        registroPendienteError: 'algun error previo',
        signOut: vi.fn(),
        refreshPerfil: refreshPerfilMock,
        clearRegistroPendienteError: clearRegistroPendienteErrorMock,
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'a@b.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      expect(clearRegistroPendienteErrorMock).toHaveBeenCalled()
    })

    it('happy path: signIn se llama y NO se hace insert paciente desde Login (vive en useAuth)', async () => {
      signInMock.mockResolvedValue({
        data: { user: { id: 'auth-1' }, session: { access_token: 't' } },
        error: null,
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'paciente@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      await vi.waitFor(() => expect(signInMock).toHaveBeenCalled())
      // Login NO llama supabase.from ni getUser — eso es responsabilidad
      // de useAuth.onAuthStateChange ahora (B-20.3).
      expect(fromMock).not.toHaveBeenCalled()
      expect(getUserMock).not.toHaveBeenCalled()
    })
  })

  /**
   * Bug B-20: el banner verde "Cuenta creada" debe aparecer si el usuario
   * viene desde Register.tsx con state {registroExitoso: true}.
   */
  describe('B-20: banner "Cuenta creada" tras venir de registro', () => {
    it('muestra el banner verde cuando viene con state.registroExitoso=true', () => {
      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/login', state: { registroExitoso: true, email: 'ana@test.com' } },
          ]}
        >
          <Login />
        </MemoryRouter>,
      )
      // El banner está visible con texto característico
      expect(screen.getByText(/Cuenta creada con éxito/i)).toBeInTheDocument()
      // El email viene pre-rellenado
      const emailInput = screen.getByLabelText('Correo electrónico') as HTMLInputElement
      expect(emailInput.value).toBe('ana@test.com')
    })

    it('NO muestra el banner sin state.registroExitoso (login normal)', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      expect(screen.queryByText(/Cuenta creada con éxito/i)).not.toBeInTheDocument()
    })
  })
})
