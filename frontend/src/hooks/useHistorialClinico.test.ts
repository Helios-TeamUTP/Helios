import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { rpc: rpcMock } }))

import { useHistorialClinico } from './useHistorialClinico'

const input = {
  citaId: 'c1',
  dolenciaPrincipal: 'Gripe',
  receta: 'Paracetamol',
  notasClinicas: 'Control en 48h',
}

describe('useHistorialClinico.completarCita (B-35, atómico)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('completa la cita con UNA sola llamada RPC y los parámetros correctos', async () => {
    rpcMock.mockResolvedValue({ data: 'hist-1', error: null })
    const { result } = renderHook(() => useHistorialClinico())

    await act(async () => {
      await result.current.completarCita(input)
    })

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith('completar_cita_con_historial', {
      p_cita_id: 'c1',
      p_dolencia: 'Gripe',
      p_receta: 'Paracetamol',
      p_notas: 'Control en 48h',
    })
    expect(result.current.error).toBeNull()
    expect(result.current.guardando).toBe(false)
  })

  it('envía receta y notas null cuando son opcionales y no se llenaron (solo dolencia)', async () => {
    rpcMock.mockResolvedValue({ data: 'hist-1', error: null })
    const { result } = renderHook(() => useHistorialClinico())

    await act(async () => {
      await result.current.completarCita({
        citaId: 'c1',
        dolenciaPrincipal: 'Gripe',
        receta: null,
        notasClinicas: null,
      })
    })

    expect(rpcMock).toHaveBeenCalledWith('completar_cita_con_historial', {
      p_cita_id: 'c1',
      p_dolencia: 'Gripe',
      p_receta: null,
      p_notas: null,
    })
  })

  it('si la BD rechaza (p. ej. dolencia vacía) lanza el mensaje de la BD y lo expone en error', async () => {
    // PostgrestError real es un objeto con `message`; no siempre es instanceof Error.
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'La dolencia principal es obligatoria para completar la cita' },
    })
    const { result } = renderHook(() => useHistorialClinico())

    await act(async () => {
      await expect(result.current.completarCita({ ...input, dolenciaPrincipal: '' })).rejects.toThrow(
        /dolencia principal es obligatoria/,
      )
    })

    expect(result.current.error).toMatch(/dolencia principal es obligatoria/)
    expect(result.current.guardando).toBe(false)
  })

  it('no hace ninguna escritura directa a tablas (todo pasa por la RPC)', async () => {
    rpcMock.mockResolvedValue({ data: 'hist-1', error: null })
    const { result } = renderHook(() => useHistorialClinico())
    await act(async () => {
      await result.current.completarCita(input)
    })
    // El mock de supabase solo expone `rpc`: si el hook llamara .from() fallaría.
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })
})
