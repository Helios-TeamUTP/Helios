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

  // B-11 (TOKEN_REFRESHED, USER_UPDATED) y B-17 (INITIAL_SESSION): estos
  // eventos NO deben recargar el perfil, solo actualizar la sesion.
  // - INITIAL_SESSION: el SDK de Supabase lo dispara solo al subscribirse y
  //   init() ya cargo el perfil. Sin este filtro, loadPerfil corria 2 veces
  //   concurrentes -> spinner > 10s.
  it.each([
    ['B-11', 'TOKEN_REFRESHED', 'user-token-refresh'],
    ['B-11', 'USER_UPDATED', 'user-updated'],
    ['B-17', 'INITIAL_SESSION', 'user-initial'],
  ])('%s: %s NO recarga perfil (no llama supabase.from)', async (_bug, evento, userId) => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    fromMock.mockClear()

    const fakeSession = { user: { id: userId } }
    await act(async () => {
      await capturedListener!(evento, fakeSession)
    })

    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.session).toEqual(fakeSession)
  })

  // ─────────────────────────────────────────────────────────────────
  // B-17: idempotencia por authUid (INITIAL_SESSION va en el it.each de arriba)
  // ─────────────────────────────────────────────────────────────────

  it('B-17: evento con mismo authUid NO recarga perfil (idempotencia)', async () => {
    // Setup: cargar primero un paciente
    setupFromMock(
      { paciente_id: 'pac-1', pacientes: { id: 'pac-1', nombre: 'Test' } },
      null,
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Disparar SIGNED_IN para que el authUid quede registrado en currentAuthUidRef
    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-mismo' } })
    })
    await waitFor(() => expect(result.current.paciente).toBeTruthy())

    fromMock.mockClear()

    // Ahora un evento espurio (ej. del visibility sync de Supabase) con el
    // mismo authUid NO debe disparar otra recarga del perfil.
    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-mismo' } })
    })

    expect(fromMock).not.toHaveBeenCalled()
  })

  it('B-17: cambio a authUid distinto SI recarga perfil', async () => {
    setupFromMock(
      { paciente_id: 'pac-1', pacientes: { id: 'pac-1', nombre: 'A' } },
      null,
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-A' } })
    })
    await waitFor(() => expect(result.current.paciente).toBeTruthy())

    fromMock.mockClear()

    // authUid DISTINTO → debe recargar (cambio real de usuario)
    await act(async () => {
      await capturedListener!('SIGNED_IN', { user: { id: 'user-B' } })
    })

    expect(fromMock).toHaveBeenCalled()
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
