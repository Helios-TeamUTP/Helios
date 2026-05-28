import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { fromMock, signUpMock, signInWithPasswordMock, refreshPerfilMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  signUpMock: vi.fn(),
  // Bug B-19: signInWithPassword se llama tras signUp si la session
  // devuelta es null (email confirm activa o race en supabase-js).
  signInWithPasswordMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
  // refreshPerfil debe retornar Promise (es async en la implementación real).
  // Sin esto, withTimeout(refreshPerfil(), ...) rompe en runtime.
  refreshPerfilMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: {
      signUp: signUpMock,
      signInWithPassword: signInWithPasswordMock,
    },
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
    refreshPerfil: refreshPerfilMock,
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

  /**
   * Happy path: cubre las 5 llamadas a Supabase del flujo completo de
   * registro (chequeo cédula → signUp → insert paciente → upsert link →
   * refreshPerfil). Necesario para cobertura ≥60% tras el refactor B-10
   * que agregó código del try/catch/finally en handleSubmit.
   */
  it('flujo completo: crea paciente, vincula auth y navega a /agendar', async () => {
    const maybeSingleNoExisting = vi.fn().mockResolvedValue({ data: null, error: null })
    const selectIdEq = {
      eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleNoExisting }),
    }
    const insertPacienteSingle = vi.fn().mockResolvedValue({
      data: { id: 'pac-abc', nombre: 'Ana López' },
      error: null,
    })
    const upsertLink = vi.fn().mockResolvedValue({ error: null })

    fromMock.mockImplementation((table: string) => {
      if (table === 'pacientes') {
        return {
          select: vi.fn().mockReturnValue(selectIdEq),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: insertPacienteSingle }),
          }),
        }
      }
      if (table === 'auth_paciente_link') {
        return { upsert: upsertLink }
      }
      throw new Error(`tabla no esperada en mock: ${table}`)
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

    // Verifica que el flujo llegó hasta el final (refreshPerfil fue llamado)
    await vi.waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'ana@test.com',
        password: 'segura123',
      })
      // Bug B-19: como signUp devolvio session=null, Register debe haber
      // hecho signInWithPassword explicito para garantizar el JWT antes
      // del upsert del link (sin esto el upsert fallaba silente por RLS).
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'ana@test.com',
        password: 'segura123',
      })
      expect(insertPacienteSingle).toHaveBeenCalled()
      expect(upsertLink).toHaveBeenCalledWith(
        { auth_uid: 'auth-uid-xyz', paciente_id: 'pac-abc' },
        { onConflict: 'auth_uid' },
      )
      expect(refreshPerfilMock).toHaveBeenCalled()
    })
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
    // de error temprano (cédula duplicada). Sin esto, romper el finally
    // pasaría silente porque el path no entra al catch.
    expect(screen.getByRole('button', { name: /Crear cuenta/ })).not.toBeDisabled()
  })

  /**
   * Regresión B-10: cuando alguno de los awaits a Supabase rechaza con
   * TimeoutError (lo que produce withTimeout cuando vence), el handleSubmit
   * debe mostrar el mensaje específico y rehabilitar el botón. Antes del
   * fix, el spinner quedaba eterno y el botón disabled sin forma de
   * reintentar. Aquí testeamos vía signUp porque es la llamada más larga
   * del flujo de "crear cuenta nueva".
   */
  describe('B-10: manejo de TimeoutError en signUp', () => {
    beforeEach(() => {
      // Cédula libre: el chequeo previo a signUp resuelve sin paciente existente
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

  /**
   * Bug B-19: garantizar sesion activa tras signUp.
   *
   * Causa raiz: signUp puede devolver session=null (email confirmation
   * activa o race con setSession interno del cliente). Sin sesion, el
   * cliente sigue como anon, auth.uid() es NULL, y el upsert en
   * auth_paciente_link falla SILENTE por la policy RLS que requiere
   * auth_uid = auth.uid().
   *
   * Fix: si !authData.session, hacer signInWithPassword explicito.
   */
  describe('B-19: garantiza sesión tras signUp', () => {
    beforeEach(() => {
      // Cedula libre + mocks de pacientes/link OK para llegar al final del flujo
      const maybeSingleNoExisting = vi
        .fn()
        .mockResolvedValue({ data: null, error: null })
      const insertPacienteSingle = vi.fn().mockResolvedValue({
        data: { id: 'pac-1', nombre: 'Test' },
        error: null,
      })
      const upsertLink = vi.fn().mockResolvedValue({ error: null })
      fromMock.mockImplementation((table: string) => {
        if (table === 'pacientes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleNoExisting }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: insertPacienteSingle }),
            }),
          }
        }
        if (table === 'auth_paciente_link') return { upsert: upsertLink }
        throw new Error(`tabla no esperada: ${table}`)
      })
    })

    it('signUp con session OK no llama signInWithPassword (sin redundancia)', async () => {
      signUpMock.mockResolvedValue({
        // Esta vez SI hay session - Supabase ya logueo al usuario
        data: { user: { id: 'auth-1' }, session: { access_token: 'tok' } },
        error: null,
      })
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Nombre completo'), 'Ana')
      await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      // Debe completarse el flujo sin llamar signInWithPassword
      await vi.waitFor(() => {
        expect(refreshPerfilMock).toHaveBeenCalled()
      })
      expect(signInWithPasswordMock).not.toHaveBeenCalled()
    })

    it('muestra mensaje específico de "verifica tu correo" si signIn falla con "Email not confirmed"', async () => {
      signUpMock.mockResolvedValue({
        data: { user: { id: 'auth-1' }, session: null },
        error: null,
      })
      signInWithPasswordMock.mockResolvedValue({
        data: {},
        error: { message: 'Email not confirmed' },
      })
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Nombre completo'), 'Ana')
      await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      // OBS-1 del review: mensaje específico cuando el error es "Email not confirmed"
      expect(await screen.findByRole('alert')).toHaveTextContent(
        /revisa tu correo.*para confirmar/i,
      )
      // El paciente NO se inserta porque el flujo retorno antes
      expect(refreshPerfilMock).not.toHaveBeenCalled()
    })

    it('muestra mensaje genérico si signIn falla con otro error (no email confirmation)', async () => {
      signUpMock.mockResolvedValue({
        data: { user: { id: 'auth-1' }, session: null },
        error: null,
      })
      signInWithPasswordMock.mockResolvedValue({
        data: {},
        error: { message: 'Network timeout' },
      })
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      )
      await user.type(screen.getByLabelText('Nombre completo'), 'Ana')
      await user.type(screen.getByLabelText('Cédula'), '8-123-4567')
      await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
      await user.type(screen.getByLabelText('Contraseña'), 'segura123')
      await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /no pudimos iniciar sesión automáticamente/i,
      )
      expect(refreshPerfilMock).not.toHaveBeenCalled()
    })
  })
})
