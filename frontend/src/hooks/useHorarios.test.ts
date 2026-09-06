import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { filtrarSlotsFuturos, limitarVentanaDias } from './useHorarios'
import type { Horario, HorarioAgendable } from '../lib/types'

// Mock de supabase — el hook useHorarios llama a supabase.rpc('horarios_agendables', ...).
vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { useHorarios } from './useHorarios'

/**
 * Bug B-25: no se debe poder agendar un slot de HOY cuya hora ya pasó
 * (ej. 7:00 AM cuando ya son las 5:30 PM). filtrarSlotsFuturos los descarta.
 */
function h(over: Partial<Horario>): Horario {
  return {
    id: over.id ?? 'h',
    medico_id: 'm1',
    fecha: '2026-06-02',
    hora_inicio: '07:00:00',
    hora_fin: '07:20:00',
    disponible: true,
    created_at: '2026-06-01T00:00:00Z',
    ...over,
  } as Horario
}

describe('filtrarSlotsFuturos (B-25)', () => {
  // "Ahora" fijo: 2 de junio de 2026, 17:30:00 (hora local).
  const ahora = new Date(2026, 5, 2, 17, 30, 0)

  it('descarta un slot de HOY cuya hora ya pasó (7:00 AM)', () => {
    const r = filtrarSlotsFuturos([h({ id: 'pasado', fecha: '2026-06-02', hora_inicio: '07:00:00' })], ahora)
    expect(r).toHaveLength(0)
  })

  it('mantiene un slot de HOY cuya hora aún no llega (18:00)', () => {
    const r = filtrarSlotsFuturos([h({ id: 'futuro-hoy', fecha: '2026-06-02', hora_inicio: '18:00:00' })], ahora)
    expect(r.map((x) => x.id)).toEqual(['futuro-hoy'])
  })

  it('mantiene todos los slots de días futuros', () => {
    const r = filtrarSlotsFuturos(
      [h({ id: 'manana-7am', fecha: '2026-06-03', hora_inicio: '07:00:00' })],
      ahora,
    )
    expect(r.map((x) => x.id)).toEqual(['manana-7am'])
  })

  it('descarta slots de días pasados (defensa extra)', () => {
    const r = filtrarSlotsFuturos([h({ id: 'ayer', fecha: '2026-06-01', hora_inicio: '23:00:00' })], ahora)
    expect(r).toHaveLength(0)
  })

  it('mezcla: solo devuelve los futuros, en el mismo orden', () => {
    const entrada = [
      h({ id: 'hoy-7am', fecha: '2026-06-02', hora_inicio: '07:00:00' }), // pasó
      h({ id: 'hoy-6pm', fecha: '2026-06-02', hora_inicio: '18:00:00' }), // futuro
      h({ id: 'manana', fecha: '2026-06-03', hora_inicio: '08:00:00' }), // futuro
    ]
    expect(filtrarSlotsFuturos(entrada, ahora).map((x) => x.id)).toEqual(['hoy-6pm', 'manana'])
  })
})

describe('limitarVentanaDias', () => {
  // "Ahora" fijo: 2 de junio de 2026 (hora local).
  const ahora = new Date(2026, 5, 2, 10, 0, 0)

  it('mantiene un slot dentro de la ventana de 7 días', () => {
    const r = limitarVentanaDias([h({ id: 'dia-6', fecha: '2026-06-08' })], ahora, 7)
    expect(r.map((x) => x.id)).toEqual(['dia-6'])
  })

  it('mantiene el slot exactamente en el último día de la ventana', () => {
    // 2 de junio + 7 dias = 9 de junio (limite inclusivo)
    const r = limitarVentanaDias([h({ id: 'limite', fecha: '2026-06-09' })], ahora, 7)
    expect(r.map((x) => x.id)).toEqual(['limite'])
  })

  it('descarta un slot un día después del límite de la ventana', () => {
    const r = limitarVentanaDias([h({ id: 'fuera', fecha: '2026-06-10' })], ahora, 7)
    expect(r).toHaveLength(0)
  })

  it('descarta slots de meses más adelante (el caso real: RPC sin tope superior)', () => {
    const r = limitarVentanaDias(
      [h({ id: 'agosto', fecha: '2026-08-24' }), h({ id: 'febrero', fecha: '2027-02-20' })],
      ahora,
      7,
    )
    expect(r).toHaveLength(0)
  })

  it('usa VENTANA_DIAS_AGENDABLES (7) como default si no se pasa dias', () => {
    const dentro = limitarVentanaDias([h({ id: 'dentro', fecha: '2026-06-09' })], ahora)
    const fuera = limitarVentanaDias([h({ id: 'fuera', fecha: '2026-06-10' })], ahora)
    expect(dentro).toHaveLength(1)
    expect(fuera).toHaveLength(0)
  })

  it('combinado con filtrarSlotsFuturos: solo quedan los futuros Y dentro de una semana', () => {
    const entrada = [
      h({ id: 'pasado', fecha: '2026-05-30' }),
      h({ id: 'hoy-tarde', fecha: '2026-06-02', hora_inicio: '18:00:00' }),
      h({ id: 'semana-1', fecha: '2026-06-08' }),
      h({ id: 'muy-lejos', fecha: '2026-08-24' }),
    ]
    const futuros = filtrarSlotsFuturos(entrada, ahora)
    const resultado = limitarVentanaDias(futuros, ahora)
    expect(resultado.map((x) => x.id)).toEqual(['hoy-tarde', 'semana-1'])
  })
})

function horarioAgendable(over: Partial<HorarioAgendable> = {}): HorarioAgendable {
  return {
    id: over.id ?? 'h1',
    medico_id: 'm1',
    fecha: '2026-09-05',
    hora_inicio: '09:00:00',
    hora_fin: '09:20:00',
    disponible: true,
    dia_completo: false,
    created_at: '2026-08-01T00:00:00Z',
    ...over,
  } as HorarioAgendable
}

describe('useHorarios (hook)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('con medicoId=null resetea data a [] y no llama a la RPC', () => {
    const { result } = renderHook(() => useHorarios(null))
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('carga horarios, aplica filtrarSlotsFuturos + limitarVentanaDias, y setea loading correctamente', async () => {
    // Fecha relativa (mañana) en vez de una fecha fija: si coincidiera con
    // "hoy" del sistema, filtrarSlotsFuturos podría descartarla según la
    // hora exacta en que corra el test (bug de test frágil detectado en
    // revisión manual, no relacionado con la lógica del hook).
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaCercana = manana.toISOString().slice(0, 10)

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [horarioAgendable({ id: 'cerca', fecha: fechaCercana }), horarioAgendable({ id: 'lejos', fecha: '2027-01-01' })],
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useHorarios('med-1'))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    // 'lejos' esta fuera de la ventana de VENTANA_DIAS_AGENDABLES y se descarta.
    expect(result.current.data.map((h) => h.id)).toEqual(['cerca'])
    expect(result.current.error).toBeNull()
  })

  it('pasa medicoId y excluirCitaId correctamente a la RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as unknown as Awaited<
      ReturnType<typeof supabase.rpc>
    >)

    renderHook(() => useHorarios('med-1', 'cita-a-reprogramar'))

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalled())
    expect(supabase.rpc).toHaveBeenCalledWith(
      'horarios_agendables',
      expect.objectContaining({ p_medico_id: 'med-1', p_excluir_cita_id: 'cita-a-reprogramar' }),
    )
  })

  it('usa null como p_excluir_cita_id cuando no se pasa (agendar cita nueva)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as unknown as Awaited<
      ReturnType<typeof supabase.rpc>
    >)

    renderHook(() => useHorarios('med-1'))

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalled())
    expect(supabase.rpc).toHaveBeenCalledWith(
      'horarios_agendables',
      expect.objectContaining({ p_excluir_cita_id: null }),
    )
  })

  it('setea error cuando la RPC devuelve error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RLS denegado' },
    } as unknown as Awaited<ReturnType<typeof supabase.rpc>>)

    const { result } = renderHook(() => useHorarios('med-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('RLS denegado')
    expect(result.current.data).toEqual([])
  })

  it('setea error genérico cuando la RPC lanza una excepción', async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useHorarios('med-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('network down')
  })

  it('no actualiza estado tras desmontar (cleanup del useEffect)', async () => {
    let resolveRpc: (v: { data: unknown; error: unknown }) => void = () => {}
    vi.mocked(supabase.rpc).mockImplementation(
      () => new Promise((resolve) => { resolveRpc = resolve }) as unknown as ReturnType<typeof supabase.rpc>,
    )

    const { unmount } = renderHook(() => useHorarios('med-1'))
    unmount()

    expect(() => resolveRpc({ data: [], error: null })).not.toThrow()
  })
})
