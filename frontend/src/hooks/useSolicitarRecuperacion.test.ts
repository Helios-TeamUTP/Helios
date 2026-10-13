import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { resetMock } = vi.hoisted(() => ({ resetMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: resetMock } },
}))

import { useSolicitarRecuperacion } from './useSolicitarRecuperacion'

describe('useSolicitarRecuperacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('pide el enlace con el correo recortado y redirectTo a /restablecer-password', async () => {
    resetMock.mockResolvedValue({ data: {}, error: null })
    const { result } = renderHook(() => useSolicitarRecuperacion())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.solicitar('  ana@test.com ')
    })

    expect(resetMock).toHaveBeenCalledWith('ana@test.com', {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('mensaje específico cuando Supabase limita los envíos (429)', async () => {
    resetMock.mockResolvedValue({ data: null, error: { status: 429, message: 'rate limit' } })
    const { result } = renderHook(() => useSolicitarRecuperacion())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.solicitar('ana@test.com')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/Demasiados intentos/)
  })

  it('mensaje genérico (sin texto crudo de Supabase) ante otro error', async () => {
    resetMock.mockResolvedValue({ data: null, error: { status: 500, message: 'smtp exploded' } })
    const { result } = renderHook(() => useSolicitarRecuperacion())

    await act(async () => {
      await result.current.solicitar('ana@test.com')
    })

    expect(result.current.error).toMatch(/No pudimos enviar el correo/)
    expect(result.current.error).not.toMatch(/smtp/)
  })

  it('maneja TimeoutError y rehabilita loading', async () => {
    resetMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useSolicitarRecuperacion())

    await act(async () => {
      await result.current.solicitar('ana@test.com')
    })

    expect(result.current.error).toMatch(/tardó demasiado/)
    expect(result.current.loading).toBe(false)
  })

  it('maneja excepciones inesperadas', async () => {
    resetMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useSolicitarRecuperacion())

    await act(async () => {
      await result.current.solicitar('ana@test.com')
    })

    expect(result.current.error).toMatch(/error inesperado/)
  })
})
