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

import { useActualizarNombre } from './useActualizarNombre'

describe('useActualizarNombre (Módulo 05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromMock.mockReturnValue({ update: updateMock })
    updateMock.mockReturnValue({ eq: eqMock })
  })

  it('manda SOLO el campo nombre en el payload, nunca el objeto completo', async () => {
    eqMock.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useActualizarNombre())

    await act(async () => {
      await result.current.actualizarNombre('p1', 'Juan Pérez Nuevo')
    })

    expect(fromMock).toHaveBeenCalledWith('pacientes')
    expect(updateMock).toHaveBeenCalledWith({ nombre: 'Juan Pérez Nuevo' })
    expect(updateMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ cedula: expect.anything() }),
    )
    expect(eqMock).toHaveBeenCalledWith('id', 'p1')
  })

  it('retorna true y sin error si Supabase confirma el update', async () => {
    eqMock.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useActualizarNombre())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombre('p1', 'Ana López')
    })

    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('propaga el error de RLS/Supabase si el update falla', async () => {
    eqMock.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
    const { result } = renderHook(() => useActualizarNombre())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombre('p1', 'Ana López')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/row-level security/)
  })

  it('maneja TimeoutError con mensaje claro', async () => {
    eqMock.mockRejectedValue(new TimeoutError(15_000))
    const { result } = renderHook(() => useActualizarNombre())

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.actualizarNombre('p1', 'Ana López')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/tardó demasiado/)
  })
})
