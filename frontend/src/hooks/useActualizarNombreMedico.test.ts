import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TimeoutError } from '../lib/withTimeout'

const { updateMock, eqMock, fromMock } = vi.hoisted(() => {
  const updateMock = vi.fn()
  const eqMock = vi.fn()
  const fromMock = vi.fn()
  return { updateMock, eqMock, fromMock }
})
vi.mock('../lib/supabase', () => ({ supabase: { from: fromMock } }))

import { useActualizarNombreMedico } from './useActualizarNombreMedico'

describe('useActualizarNombreMedico (Módulo 05, extensión médico)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromMock.mockReturnValue({ update: updateMock })
    updateMock.mockReturnValue({ eq: eqMock })
  })

  it('actualiza la tabla medicos, mandando SOLO el campo nombre', async () => {
    eqMock.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useActualizarNombreMedico())

    await act(async () => {
      await result.current.actualizarNombreMedico('m1', 'Dr. García Nuevo')
    })

    expect(fromMock).toHaveBeenCalledWith('medicos')
    expect(updateMock).toHaveBeenCalledWith({ nombre: 'Dr. García Nuevo' })
    expect(updateMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ especialidad_id: expect.anything() }),
    )
    expect(eqMock).toHaveBeenCalledWith('id', 'm1')
  })

  it('retorna true sin error si Supabase confirma el update', async () => {
    eqMock.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useActualizarNombreMedico())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombreMedico('m1', 'Dr. García')
    })

    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('propaga error de RLS si el update falla', async () => {
    eqMock.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
    const { result } = renderHook(() => useActualizarNombreMedico())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombreMedico('m1', 'Dr. García')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/row-level security/)
  })

  it('maneja TimeoutError con mensaje claro', async () => {
    eqMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useActualizarNombreMedico())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombreMedico('m1', 'Dr. García')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
  })
})
