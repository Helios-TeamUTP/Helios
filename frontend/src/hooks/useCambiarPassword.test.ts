import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { signInWithPasswordMock, updateUserMock, signOutMock } = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  updateUserMock: vi.fn(),
  signOutMock: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      updateUser: updateUserMock,
      signOut: signOutMock,
    },
  },
}))

import { useCambiarPassword } from './useCambiarPassword'

describe('useCambiarPassword (Módulo 05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signOutMock.mockResolvedValue({ error: null })
  })

  it('rechaza el cambio si la contraseña actual es incorrecta (reautenticación falla)', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    const { result } = renderHook(() => useCambiarPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cambiarPassword('juan@mail.com', 'incorrecta', 'NuevaClave123')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Contraseña actual incorrecta')
    expect(updateUserMock).not.toHaveBeenCalled() // nunca llega a intentar el update
  })

  it('reautentica, actualiza el password y cierra sesión en otros dispositivos', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null })
    updateUserMock.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useCambiarPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cambiarPassword('juan@mail.com', 'actual123', 'NuevaClave123')
    })

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'juan@mail.com',
      password: 'actual123',
    })
    expect(updateUserMock).toHaveBeenCalledWith({ password: 'NuevaClave123' })
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'others' })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('no bloquea el flujo si signOut(others) falla (plan sin soporte)', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null })
    updateUserMock.mockResolvedValue({ error: null })
    signOutMock.mockRejectedValue(new Error('scope not supported on this plan'))
    const { result } = renderHook(() => useCambiarPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cambiarPassword('juan@mail.com', 'actual123', 'NuevaClave123')
    })

    expect(ok).toBe(true) // el password sí se cambió, eso es lo que importa
  })

  it('maneja TimeoutError con mensaje claro', async () => {
    signInWithPasswordMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useCambiarPassword())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cambiarPassword('juan@mail.com', 'actual123', 'NuevaClave123')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
  })
})
