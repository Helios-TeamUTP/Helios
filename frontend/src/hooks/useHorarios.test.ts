import { describe, expect, it } from 'vitest'
import { filtrarSlotsFuturos } from './useHorarios'
import type { Horario } from '../lib/types'

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
