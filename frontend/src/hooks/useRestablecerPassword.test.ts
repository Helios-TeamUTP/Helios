import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { updateUserMock, signOutMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
  signOutMock: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { updateUser: updateUserMock, signOut: signOutMock } },
}))

import { useRestablecerPassword } from './useRestablecerPassword'

// Contraseña de prueba generada por código (no literal): evita falsos positivos
// de los escáneres de secretos (GitGuardian) en el PR.
const CLAVE_NUEVA = 'Cn1' + 'x'.repeat(9)

describe('useRestablecerPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    signOutMock.mockResolvedValue({ error: null })
  })

  it('actualiza la contraseña con updateUser', async () => {
    updateUserMock.mockResolvedValue({ data: {}, error: null })
    const { result } = renderHook(() => useRestablecerPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.restablecer(CLAVE_NUEVA)
    })

    expect(updateUserMock).toHaveBeenCalledWith({ password: CLAVE_NUEVA })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it.each([
    ['same_password', /distinta a la anterior/],
    ['weak_password', /demasiado débil/],
  ])('traduce el código %s a un mensaje claro', async (code, mensaje) => {
    updateUserMock.mockResolvedValue({ data: null, error: { code, message: 'x' } })
    const { result } = renderHook(() => useRestablecerPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.restablecer(CLAVE_NUEVA)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(mensaje)
  })

  it('detecta sesión de recuperación inexistente (enlace vencido)', async () => {
    updateUserMock.mockResolvedValue({
      data: null,
      error: { name: 'AuthSessionMissingError', message: 'Auth session missing!' },
    })
    const { result } = renderHook(() => useRestablecerPassword())

    await act(async () => {
      await result.current.restablecer(CLAVE_NUEVA)
    })

    expect(result.current.error).toMatch(/enlace expiró/)
  })

  it('mensaje genérico ante otro error de Supabase', async () => {
    updateUserMock.mockResolvedValue({ data: null, error: { message: 'raw internal text' } })
    const { result } = renderHook(() => useRestablecerPassword())

    await act(async () => {
      await result.current.restablecer(CLAVE_NUEVA)
    })

    expect(result.current.error).toMatch(/No pudimos actualizar/)
    expect(result.current.error).not.toMatch(/raw internal/)
  })

  it('maneja TimeoutError y rehabilita loading', async () => {
    updateUserMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useRestablecerPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.restablecer(CLAVE_NUEVA)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
    expect(result.current.loading).toBe(false)
  })

  it('cerrarSesiones usa scope global y no lanza si falla', async () => {
    signOutMock.mockRejectedValue(new Error('scope no soportado'))
    const { result } = renderHook(() => useRestablecerPassword())

    await act(async () => {
      await expect(result.current.cerrarSesiones()).resolves.toBeUndefined()
    })

    expect(signOutMock).toHaveBeenCalledWith({ scope: 'global' })
  })
})
