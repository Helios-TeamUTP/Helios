import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { rpc: rpcMock } }))

import { useCancelarCita } from './useCancelarCita'

describe('useCancelarCita (ST-37)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cancela OK: llama la RPC y retorna true', async () => {
    rpcMock.mockResolvedValue({ data: [{ cita_id: 'c1', nuevo_estado: 'cancelada' }], error: null })
    const { result } = renderHook(() => useCancelarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cancelar('c1')
    })

    expect(rpcMock).toHaveBeenCalledWith('cancelar_cita_atomica', { p_cita_id: 'c1' })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('muestra el error de la RPC (mensaje en español) y retorna false', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'No autorizado: la cita no pertenece al usuario actual' },
    })
    const { result } = renderHook(() => useCancelarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cancelar('c1')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/No autorizado/)
  })

  it('maneja TimeoutError con mensaje claro', async () => {
    rpcMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useCancelarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.cancelar('c1')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
  })
})
