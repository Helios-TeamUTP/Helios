import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTableQuery } from '../test/supabase-mock'

const { fromMock, rpcMock, channelMock, removeChannelMock, realtime } = vi.hoisted(() => {
  // Realtime (CU-05 2.2.1): el canal captura el callback para poder disparar eventos.
  const realtime: { handler: (() => void) | null } = { handler: null }
  const canal: Record<string, ReturnType<typeof vi.fn>> = {}
  canal.on = vi.fn((_evento: string, _filtro: unknown, cb: () => void) => {
    realtime.handler = cb
    return canal
  })
  canal.subscribe = vi.fn(() => canal)
  return {
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
    channelMock: vi.fn(() => canal),
    removeChannelMock: vi.fn(),
    realtime,
  }
})
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}))

import { useMedicoCitas } from './useMedicoCitas'
import { COLUMNAS_CITA } from '../lib/columnas'

const FECHA = expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)

const cita = (id: string, estado = 'confirmada') => ({ id, estado, paciente_id: 'p1' })

function selectDe(query: ReturnType<typeof createTableQuery>) {
  return (query.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
}

describe('useMedicoCitas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtime.handler = null
  })

  it('hoy: pide solo columnas permitidas (sin la nota privada del paciente) y filtra por fecha y estado', async () => {
    const query = createTableQuery({ data: [cita('c1')] })
    fromMock.mockReturnValue(query)

    const { result } = renderHook(() => useMedicoCitas('m1', 'hoy'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fromMock).toHaveBeenCalledWith('citas')
    const select = selectDe(query)
    expect(select).toContain(COLUMNAS_CITA)
    expect(select.trimStart().startsWith('*')).toBe(false)
    expect(select).not.toMatch(/\bnotas\b/)
    expect(query.eq).toHaveBeenCalledWith('medico_id', 'm1')
    expect(query.eq).toHaveBeenCalledWith('horario.fecha', FECHA)
    expect(query.neq).toHaveBeenCalledWith('estado', 'cancelada')
    expect(result.current.data).toHaveLength(1)
  })

  it('semana: filtra el rango de 7 días sin canceladas', async () => {
    const query = createTableQuery({ data: [] })
    fromMock.mockReturnValue(query)
    const { result } = renderHook(() => useMedicoCitas('m1', 'semana'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(query.gte).toHaveBeenCalledWith('horario.fecha', FECHA)
    expect(query.lte).toHaveBeenCalledWith('horario.fecha', FECHA)
    expect(query.neq).toHaveBeenCalledWith('estado', 'cancelada')
  })

  it('historial: filtra fechas anteriores a hoy', async () => {
    const query = createTableQuery({ data: [] })
    fromMock.mockReturnValue(query)
    const { result } = renderHook(() => useMedicoCitas('m1', 'historial'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(query.lt).toHaveBeenCalledWith('horario.fecha', FECHA)
  })

  it('sin medicoId no consulta y devuelve lista vacía', async () => {
    const { result } = renderHook(() => useMedicoCitas(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
  })

  it('expone el error de Supabase', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: null, error: { message: 'boom' } }))
    const { result } = renderHook(() => useMedicoCitas('m1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
  })

  it('marcarNoAsistio llama a la RPC atómica y refleja el estado local sin refetch', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [cita('c1'), cita('c2')] }))
    rpcMock.mockResolvedValue({ data: 'c1', error: null })
    const { result } = renderHook(() => useMedicoCitas('m1'))
    await waitFor(() => expect(result.current.data).toHaveLength(2))

    await act(async () => {
      await result.current.marcarNoAsistio('c1')
    })

    expect(rpcMock).toHaveBeenCalledWith('marcar_cita_no_asistio', { p_cita_id: 'c1' })
    expect(result.current.data.find((c) => c.id === 'c1')?.estado).toBe('no_asistio')
    expect(result.current.data.find((c) => c.id === 'c2')?.estado).toBe('confirmada')
    expect(fromMock).toHaveBeenCalledTimes(1) // no hubo re-fetch (evita el spinner)
  })

  it('marcarNoAsistio lanza el mensaje de la BD y NO cambia el estado local si falla', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [cita('c1')] }))
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Solo se pueden marcar como no asistio las citas confirmadas' },
    })
    const { result } = renderHook(() => useMedicoCitas('m1'))
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      await expect(result.current.marcarNoAsistio('c1')).rejects.toThrow(/solo se pueden marcar/i)
    })

    expect(result.current.data[0].estado).toBe('confirmada')
    errSpy.mockRestore()
  })

  it('reflejarEstado actualiza solo la cita indicada (estado ya confirmado por la BD)', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [cita('c1'), cita('c2')] }))
    const { result } = renderHook(() => useMedicoCitas('m1'))
    await waitFor(() => expect(result.current.data).toHaveLength(2))

    act(() => result.current.reflejarEstado('c2', 'completada'))

    expect(result.current.data.find((c) => c.id === 'c2')?.estado).toBe('completada')
    expect(result.current.data.find((c) => c.id === 'c1')?.estado).toBe('confirmada')
  })

  // ── CU-05: filtro por fecha (2.1.3) ──────────────────────────────────────
  it('fecha: filtra por la fecha elegida y excluye las canceladas', async () => {
    const query = createTableQuery({ data: [cita('c1')] })
    fromMock.mockReturnValue(query)
    const { result } = renderHook(() => useMedicoCitas('m1', 'fecha', '2026-07-04'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(query.eq).toHaveBeenCalledWith('medico_id', 'm1')
    expect(query.eq).toHaveBeenCalledWith('horario.fecha', '2026-07-04')
    expect(query.neq).toHaveBeenCalledWith('estado', 'cancelada')
    expect(selectDe(query)).toContain(COLUMNAS_CITA)
    expect(result.current.data).toHaveLength(1)
  })

  it('fecha sin fecha elegida: no consulta y deja la lista vacía', async () => {
    const { result } = renderHook(() => useMedicoCitas('m1', 'fecha', null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
  })

  // ── CU-05 / CU-03: Realtime (2.2.1 y 2.1.12, < 5 s sin recargar) ─────────
  it('realtime: se suscribe a las citas de ESTE médico y limpia el canal al desmontar', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [] }))
    const { result, unmount } = renderHook(() => useMedicoCitas('m1', 'hoy'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(channelMock).toHaveBeenCalledWith('citas-medico-m1')
    const canal = channelMock.mock.results[0].value as { on: ReturnType<typeof vi.fn> }
    expect(canal.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'citas', filter: 'medico_id=eq.m1' },
      expect.any(Function),
    )

    unmount()
    expect(removeChannelMock).toHaveBeenCalled()
  })

  it('realtime: sin medicoId no se suscribe', async () => {
    const { result } = renderHook(() => useMedicoCitas(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(channelMock).not.toHaveBeenCalled()
  })

  it('realtime: un evento recarga la agenda EN SILENCIO (sin spinner) con los datos nuevos', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [cita('c1')] }))
    const { result } = renderHook(() => useMedicoCitas('m1', 'hoy'))
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(realtime.handler).not.toBeNull()

    // Un paciente agenda otra cita: llega el evento y la BD ya tiene 2.
    fromMock.mockReturnValue(createTableQuery({ data: [cita('c1'), cita('c2')] }))
    act(() => realtime.handler?.())

    // Recarga silenciosa: la tabla no pasa por el estado de carga.
    expect(result.current.loading).toBe(false)
    await waitFor(() => expect(result.current.data).toHaveLength(2))
    expect(fromMock).toHaveBeenCalledTimes(2)
  })
})
