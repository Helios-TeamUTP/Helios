import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReprogramarCita } from './useReprogramarCita'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

vi.mock('../lib/withTimeout', () => ({
  AUTH_TIMEOUT_MS: 5000,
  TimeoutError: class TimeoutError extends Error {},
  withTimeout: vi.fn((promise) => promise),
}))

import { supabase } from '../lib/supabase'
import { withTimeout, TimeoutError } from '../lib/withTimeout'

describe('useReprogramarCita', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restaura el passthrough por defecto: clearAllMocks() limpia llamadas
    // pero NO restaura mockImplementation/mockRejectedValue de tests previos.
    vi.mocked(withTimeout).mockImplementation((promise) => Promise.resolve(promise))
  })

  it('retorna loading=false y error=null en estado inicial', () => {
    const { result } = renderHook(() => useReprogramarCita())
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('retorna true y no setea error cuando RPC es exitosa', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useReprogramarCita())
    let ok: boolean

    await act(async () => {
      ok = await result.current.reprogramar('cita-123', 'horario-456')
    })

    expect(ok!).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('retorna false y setea el mensaje de error cuando RPC falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      error: { message: 'Horario no disponible' },
    } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useReprogramarCita())
    let ok: boolean

    await act(async () => {
      ok = await result.current.reprogramar('cita-123', 'horario-456')
    })

    expect(ok!).toBe(false)
    expect(result.current.error).toBe('Horario no disponible')
  })

  it('maneja TimeoutError correctamente', async () => {
    vi.mocked(withTimeout).mockRejectedValue(new TimeoutError(15000))

    const { result } = renderHook(() => useReprogramarCita())
    let ok: boolean

    await act(async () => {
      ok = await result.current.reprogramar('cita-123', 'horario-456')
    })

    expect(ok!).toBe(false)
    expect(result.current.error).toContain('tardó demasiado')
  })

  it('setError permite limpiar el error manualmente', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      error: { message: 'Error de prueba' },
    } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useReprogramarCita())

    await act(async () => {
      await result.current.reprogramar('cita-123', 'horario-456')
    })

    expect(result.current.error).toBe('Error de prueba')

    act(() => {
      result.current.setError(null)
    })

    expect(result.current.error).toBeNull()
  })

  it('llama a supabase.rpc con los parámetros correctos', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useReprogramarCita())

    await act(async () => {
      await result.current.reprogramar('cita-abc', 'horario-xyz')
    })

    expect(supabase.rpc).toHaveBeenCalledWith('reprogramar_cita_atomica', {
      p_cita_id: 'cita-abc',
      p_nuevo_horario_id: 'horario-xyz',
    })
  })
})
