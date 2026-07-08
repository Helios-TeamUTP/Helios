import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const { fromMock, channelMock, removeChannelMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  channelMock: vi.fn(),
  removeChannelMock: vi.fn(),
  rpcMock: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
    rpc: rpcMock,
  },
}))

import { useNotificaciones } from './useNotificaciones'

/** Builder thenable: .select().order().limit() resuelve a { data, error }. */
function mockQuery(data: unknown, error: { message: string } | null = null) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
  builder.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
    resolve({ data, error })
  return builder
}

/** Canal Realtime falso: .on() y .subscribe() encadenables. */
function mockChannel() {
  const chan: Record<string, unknown> = {}
  chan.on = vi.fn(() => chan)
  chan.subscribe = vi.fn(() => chan)
  return chan
}

describe('useNotificaciones (HELL-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    channelMock.mockImplementation(() => mockChannel())
    rpcMock.mockResolvedValue({ data: null, error: null })
  })

  it('no consulta si no hay paciente ni medico', async () => {
    const { result } = renderHook(() => useNotificaciones(null, null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
    expect(result.current.noLeidas).toBe(0)
  })

  it('carga las notificaciones del paciente y cuenta las no leidas', async () => {
    fromMock.mockReturnValue(
      mockQuery([
        { id: 'n1', leida: false, titulo: 'Cita confirmada', mensaje: 'x', destinatario: 'paciente' },
        { id: 'n2', leida: true, titulo: 'Cita cancelada', mensaje: 'y', destinatario: 'paciente' },
      ]),
    )
    const { result } = renderHook(() => useNotificaciones('p1', null))
    await waitFor(() => expect(result.current.data).toHaveLength(2))
    expect(result.current.noLeidas).toBe(1)
    expect(fromMock).toHaveBeenCalledWith('notificaciones')
  })

  it('se suscribe a un canal Realtime propio y lo limpia al desmontar', async () => {
    fromMock.mockReturnValue(mockQuery([]))
    const { result, unmount } = renderHook(() => useNotificaciones('p1', null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(channelMock).toHaveBeenCalledWith('notificaciones-p1')
    unmount()
    expect(removeChannelMock).toHaveBeenCalled()
  })

  it('marcarLeida actualiza de forma optimista y llama la RPC', async () => {
    fromMock.mockReturnValue(
      mockQuery([{ id: 'n1', leida: false, titulo: 't', mensaje: 'm', destinatario: 'paciente' }]),
    )
    const { result } = renderHook(() => useNotificaciones('p1', null))
    await waitFor(() => expect(result.current.data).toHaveLength(1))

    await act(async () => {
      await result.current.marcarLeida('n1')
    })

    expect(result.current.data[0].leida).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('marcar_notificacion_leida', { p_id: 'n1' })
  })

  it('marcarTodasLeidas deja noLeidas en 0 y llama la RPC', async () => {
    fromMock.mockReturnValue(
      mockQuery([
        { id: 'n1', leida: false, titulo: 't', mensaje: 'm', destinatario: 'paciente' },
        { id: 'n2', leida: false, titulo: 't2', mensaje: 'm2', destinatario: 'paciente' },
      ]),
    )
    const { result } = renderHook(() => useNotificaciones('p1', null))
    await waitFor(() => expect(result.current.data).toHaveLength(2))

    await act(async () => {
      await result.current.marcarTodasLeidas()
    })

    expect(result.current.noLeidas).toBe(0)
    expect(rpcMock).toHaveBeenCalledWith('marcar_todas_notificaciones_leidas')
  })
})
