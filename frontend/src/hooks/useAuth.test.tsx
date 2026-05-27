import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Tests de regresión para Bug B-11 ("Verificando sesión..." eterno tras F5
 * o al navegar). Causa raíz: onAuthStateChange ignoraba el tipo de evento
 * y disparaba loading=true + loadPaciente en TOKEN_REFRESHED (que ocurre
 * cada 5-60 min automáticamente). Si loadPaciente colgaba, loading quedaba
 * eterno.
 *
 * Estos tests verifican que TOKEN_REFRESHED y USER_UPDATED NO recargan
 * paciente, y que SIGNED_IN SÍ lo hace (no rompimos el flujo bueno).
 *
 * NOTA: useAuth está excluido de coverage en vite.config.ts, así que estos
 * tests no afectan el threshold global — son tests "extra" de regresión.
 */

type AuthListener = (event: string, session: unknown) => void | Promise<void>

const { getSessionMock, onAuthStateChangeMock, signOutMock, fromMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signOutMock: vi.fn(),
  fromMock: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
    from: fromMock,
  },
}))

// eslint-disable-next-line react-refresh/only-export-components
import { AuthProvider, useAuth } from './useAuth'

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth — Bug B-11 regresión', () => {
  let capturedListener: AuthListener | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    capturedListener = null

    // Capturar el callback registrado en onAuthStateChange para simularlo después.
    onAuthStateChangeMock.mockImplementation((cb: AuthListener) => {
      capturedListener = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    // Por default, init() arranca sin sesión.
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('TOKEN_REFRESHED NO dispara recarga de paciente (no llama supabase.from)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Reset para medir solo lo que pasa tras TOKEN_REFRESHED.
    fromMock.mockClear()

    const fakeSession = { user: { id: 'user-token-refresh' } }
    await act(async () => {
      await capturedListener!('TOKEN_REFRESHED', fakeSession)
    })

    // El fix B-11: supabase.from NO debe haberse llamado.
    expect(fromMock).not.toHaveBeenCalled()
    // Pero la sesión SÍ se actualiza para que el JWT nuevo quede en contexto.
    expect(result.current.session).toEqual(fakeSession)
  })

  it('USER_UPDATED tampoco recarga paciente', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    const fakeSession = { user: { id: 'user-updated' } }
    await act(async () => {
      await capturedListener!('USER_UPDATED', fakeSession)
    })

    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.session).toEqual(fakeSession)
  })

  it('SIGNED_IN SÍ recarga paciente (preserva el flujo normal)', async () => {
    // Mock para que las 2 queries de loadPaciente devuelvan respuesta válida.
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: { paciente_id: 'pac-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'pac-1', nombre: 'Test Paciente' }, error: null })

    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: maybeSingleMock,
        }),
      }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    const fakeSession = { user: { id: 'user-signed-in' } }
    await act(async () => {
      await capturedListener!('SIGNED_IN', fakeSession)
    })

    // En SIGNED_IN sí debe haber llamado a supabase.from (recargar paciente).
    expect(fromMock).toHaveBeenCalled()
    // M-2 del review: además del .from, validar que el paciente quedó cargado
    // y que loading cerró (sin esto, si loadPaciente fallara silente, el test
    // pasaría igual y la regresión se nos colaría).
    await waitFor(() => {
      expect(result.current.paciente).toEqual({ id: 'pac-1', nombre: 'Test Paciente' })
      expect(result.current.loading).toBe(false)
    })
  })
})
