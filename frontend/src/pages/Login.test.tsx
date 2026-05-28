import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { signInMock, getUserMock, fromMock, refreshPerfilMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  // Bug B-20: getUser + from son necesarios para completarRegistroPendiente
  getUserMock: vi.fn(),
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
    },
    from: fromMock,
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
    refreshPerfil: refreshPerfilMock,
  }),
}))

import { Login } from './Login'

describe('<Login />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    signInMock.mockResolvedValue({ data: { user: null, session: null }, error: null })
    // Default: getUser y from no se usan a menos que un test los configure
    getUserMock.mockResolvedValue({ data: { user: null } })
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
   * Bug B-20: tras signIn exitoso, Login.tsx completa el registro pendiente
   * (insert paciente + upsert link) usando datos guardados por Register.tsx
   * en sessionStorage. Esto resuelve el race de session=null al hacer signUp.
   */
  describe('B-20: completarRegistroPendiente tras signIn', () => {
    it('sin sessionStorage pendiente, NO llama a supabase.from (no regresión)', async () => {
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

      // signIn se llamó, pero como NO hay registro pendiente,
      // getUser ni supabase.from se llaman.
      await vi.waitFor(() => expect(signInMock).toHaveBeenCalled())
      expect(getUserMock).not.toHaveBeenCalled()
      expect(fromMock).not.toHaveBeenCalled()
      // Fix C-1: tampoco refreshPerfil (no hay nada que refrescar — el
      // listener de onAuthStateChange se encarga del happy path normal).
      expect(refreshPerfilMock).not.toHaveBeenCalled()
    })

    it('con sessionStorage pendiente, inserta paciente y crea link tras signIn', async () => {
      // Setup: Register.tsx dejó datos en sessionStorage
      sessionStorage.setItem(
        'helios_pending_paciente',
        JSON.stringify({
          nombre: 'Ana López',
          cedula: '8-123-4567',
          telefono: '6000-0000',
          correo: 'ana@test.com',
        }),
      )

      signInMock.mockResolvedValue({
        data: { user: { id: 'auth-xyz' }, session: { access_token: 't' } },
        error: null,
      })
      getUserMock.mockResolvedValue({
        data: { user: { id: 'auth-xyz' } },
      })

      // Mocks de las queries: cédula libre, insert OK, upsert OK
      const maybeSingleCedula = vi.fn().mockResolvedValue({ data: null, error: null })
      const insertSingle = vi.fn().mockResolvedValue({
        data: { id: 'pac-new' },
        error: null,
      })
      const upsertLink = vi.fn().mockResolvedValue({ error: null })

      fromMock.mockImplementation((table: string) => {
        if (table === 'pacientes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleCedula }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: insertSingle }),
            }),
          }
        }
        if (table === 'auth_paciente_link') {
          return { upsert: upsertLink }
        }
        throw new Error(`tabla no esperada: ${table}`)
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      await vi.waitFor(() => {
        // signIn primero
        expect(signInMock).toHaveBeenCalledWith({
          email: 'ana@test.com',
          password: 'segura123',
        })
        // getUser para obtener auth_uid
        expect(getUserMock).toHaveBeenCalled()
        // INSERT paciente con datos del sessionStorage
        expect(insertSingle).toHaveBeenCalled()
        // UPSERT link con auth_uid y paciente_id correctos
        expect(upsertLink).toHaveBeenCalledWith(
          { auth_uid: 'auth-xyz', paciente_id: 'pac-new' },
          { onConflict: 'auth_uid' },
        )
        // Fix C-1: refreshPerfil se llama tras el upsert link para ganar
        // la carrera contra onAuthStateChange y evitar que useAuth quede
        // con paciente=null transitorio (que dispararía redirect a /registro).
        expect(refreshPerfilMock).toHaveBeenCalled()
      })

      // sessionStorage limpiado tras éxito
      expect(sessionStorage.getItem('helios_pending_paciente')).toBeNull()
    })

    it('si insert paciente falla, NO bloquea el login (sessionStorage se limpia)', async () => {
      sessionStorage.setItem(
        'helios_pending_paciente',
        JSON.stringify({
          nombre: 'Ana',
          cedula: '8-123-4567',
          telefono: null,
          correo: 'ana@test.com',
        }),
      )

      signInMock.mockResolvedValue({
        data: { user: { id: 'auth-xyz' }, session: { access_token: 't' } },
        error: null,
      })
      getUserMock.mockResolvedValue({ data: { user: { id: 'auth-xyz' } } })

      // El chequeo de cédula falla por excepción de red
      fromMock.mockImplementation(() => {
        throw new Error('Network down')
      })

      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

      // El login NO falla aunque el insert tuvo error.
      // No debe mostrar mensaje de error al usuario (el catch interno lo absorbe).
      // sessionStorage se limpia para no acumular basura.
      await vi.waitFor(() => {
        expect(signInMock).toHaveBeenCalled()
      })
      expect(sessionStorage.getItem('helios_pending_paciente')).toBeNull()
      // El botón vuelve a estar habilitado (finally del handleSubmit)
      expect(screen.getByRole('button', { name: /Iniciar sesión/ })).not.toBeDisabled()
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
