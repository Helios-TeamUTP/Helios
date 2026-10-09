import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTableQuery } from '../test/supabase-mock'

const { fromMock, channelMock, removeChannelMock } = vi.hoisted(() => {
  // Canal Realtime simulado: .on().subscribe() encadenables.
  const canal: Record<string, unknown> = {}
  canal.on = vi.fn(() => canal)
  canal.subscribe = vi.fn(() => canal)
  return {
    fromMock: vi.fn(),
    channelMock: vi.fn(() => canal),
    removeChannelMock: vi.fn(),
  }
})
vi.mock('../lib/supabase', () => ({
  supabase: { from: fromMock, channel: channelMock, removeChannel: removeChannelMock },
}))

import { useCitas } from './useCitas'

describe('useCitas (B-34: nota privada del paciente)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pide la nota privada desde cita_nota_paciente (no desde la columna legacy)', async () => {
    const query = createTableQuery({
      data: [{ id: 'c1', nota_paciente: { nota: 'Llevar exámenes' } }],
    })
    fromMock.mockReturnValue(query)

    const { result } = renderHook(() => useCitas('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fromMock).toHaveBeenCalledWith('citas')
    const select = (query.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(select).toContain('nota_paciente:cita_nota_paciente(nota)')
    expect(query.eq).toHaveBeenCalledWith('paciente_id', 'p1')
    expect(result.current.data[0].nota_paciente?.nota).toBe('Llevar exámenes')
  })

  it('no consulta nada y termina de cargar cuando no hay pacienteId', async () => {
    const { result } = renderHook(() => useCitas(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
  })

  it('expone el error de Supabase y deja de cargar', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: null, error: { message: 'boom' } }))
    const { result } = renderHook(() => useCitas('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
  })
})
