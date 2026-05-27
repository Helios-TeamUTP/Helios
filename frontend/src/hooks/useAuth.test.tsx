import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Tests de regresión para los bugs B-11, B-12 y B-13 de useAuth.
 *
 * B-11: TOKEN_REFRESHED no debe recargar perfil (causaba spinner eterno)
 * B-12: loadPerfil hace 1 query por tabla (no 2 serializadas)
 * B-13: useAuth resuelve rol (paciente XOR medico) en paralelo
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

/**
 * Helper para mockear las 2 queries de loadPerfil (auth_paciente_link y
 * auth_medico_link). Cada llamada a fromMock dispara la rama correcta.
 */
function setupFromMock(pacienteData: unknown, medicoData: unknown) {
  fromMock.mockImplementation((tabla: string) => {
    const data = tabla === 'auth_paciente_link' ? pacienteData : medicoData
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }
  })
}

describe('useAuth — Bugs B-11/B-12/B-13 regresión', () => {
  let capturedListener: AuthListener | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    capturedListener = null

    onAuthStateChangeMock.mockImplementation((cb: AuthListener) => {
      capturedListener = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    // Por default, init() arranca sin sesión.
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
  })

  // ─────────────────────────────────────────────────────────────────
  // B-11: discriminación de eventos
  // ─────────────────────────────────────────────────────────────────

  it('B-11: TOKEN_REFRESHED NO dispara recarga de perfil (no llama supabase.from)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    const fakeSession = { user: { id: 'user-token-refresh' } }
    await act(async () => {
      await capturedListener!('TOKEN_REFRESHED', fakeSession)
    })

    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.session).toEqual(fakeSession)
  })

  it('B-11: USER_UPDATED tampoco recarga perfil', async () => {
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

  // ─────────────────────────────────────────────────────────────────
  // B-13: resolución de rol (paciente XOR medico)
  // ─────────────────────────────────────────────────────────────────

  it('B-13: SIGNED_IN como paciente → role="paciente" y paciente cargado', async () => {
    setupFromMock(
      { paciente_id: 'pac-1', pacientes: { id: 'pac-1', nombre: 'Test Paciente' } },
      null, // No tiene vínculo médico
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-pac' } })
    })

    expect(fromMock).toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.role).toBe('paciente')
      expect(result.current.paciente).toEqual({ id: 'pac-1', nombre: 'Test Paciente' })
      expect(result.current.medico).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })

  it('B-13: SIGNED_IN como médico → role="medico" y medico cargado', async () => {
    setupFromMock(
      null, // No tiene vínculo paciente
      { medico_id: 'med-1', medicos: { id: 'med-1', nombre: 'Dr. Test' } },
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-med' } })
    })

    await waitFor(() => {
      expect(result.current.role).toBe('medico')
      expect(result.current.medico).toEqual({ id: 'med-1', nombre: 'Dr. Test' })
      expect(result.current.paciente).toBeNull()
    })
  })

  it('B-13: SIGNED_IN sin perfil → role=null (cuenta auth sin perfil)', async () => {
    setupFromMock(null, null) // Ningún vínculo

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-sin-perfil' } })
    })

    await waitFor(() => {
      expect(result.current.role).toBeNull()
      expect(result.current.paciente).toBeNull()
      expect(result.current.medico).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
})
