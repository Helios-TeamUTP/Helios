import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { rpc: rpcMock } }))

import { useReprogramarCita } from './useReprogramarCita'

describe('useReprogramarCita (ST-38)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reprograma OK: llama la RPC con cita y nuevo horario, retorna true', async () => {
    rpcMock.mockResolvedValue({
      data: [{ cita_id: 'c1', nuevo_horario_id: 'h2' }],
      error: null,
    })
    const { result } = renderHook(() => useReprogramarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.reprogramar('c1', 'h2')
    })

    expect(rpcMock).toHaveBeenCalledWith('reprogramar_cita_atomica', {
      p_cita_id: 'c1',
      p_nuevo_horario_id: 'h2',
    })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('muestra el error de la RPC (ej. horario ya reservado) y retorna false', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'El nuevo horario ya está reservado' },
    })
    const { result } = renderHook(() => useReprogramarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.reprogramar('c1', 'h2')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/ya está reservado/)
  })

  it('maneja TimeoutError', async () => {
    rpcMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useReprogramarCita())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.reprogramar('c1', 'h2')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
  })
})
