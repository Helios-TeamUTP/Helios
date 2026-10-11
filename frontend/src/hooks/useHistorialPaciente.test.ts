import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTableQuery } from '../test/supabase-mock'

const { fromMock, channelMock, removeChannelMock } = vi.hoisted(() => {
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

import { useHistorialPaciente } from './useHistorialPaciente'
import { COLUMNAS_HISTORIAL } from '../lib/columnas'

// Privacidad (CA-04-03 / CA-05-08): la nota del médico NUNCA debe pedirse
// desde la sesión del paciente. La RLS filtra filas, no columnas, así que lo
// único que lo garantiza en el cliente es no incluir la columna en el select.
describe('useHistorialPaciente (B-35: no pide la nota privada del médico)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usa la lista permitida y no pide notas_clinicas, nota_medico ni select("*")', async () => {
    const query = createTableQuery({ data: [] })
    fromMock.mockReturnValue(query)

    const { result } = renderHook(() => useHistorialPaciente('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fromMock).toHaveBeenCalledWith('historial_clinico')
    const select = (query.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(select).toContain(COLUMNAS_HISTORIAL)
    expect(select).not.toContain('notas_clinicas')
    expect(select).not.toContain('historial_nota_medico')
    expect(select).not.toContain('nota_medico')
    expect(select.trimStart().startsWith('*')).toBe(false)
    expect(query.eq).toHaveBeenCalledWith('paciente_id', 'p1')
  })
})
