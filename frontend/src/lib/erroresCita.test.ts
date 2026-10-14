import { describe, it, expect } from 'vitest'
import {
  traducirErrorCita,
  MSG_HORARIO_NO_DISPONIBLE,
  MSG_DIA_SIN_CUPOS,
  MSG_CITA_NO_DISPONIBLE,
} from './erroresCita'

describe('traducirErrorCita (CU-03, flujos de excepción 2.3.2 / 2.3.4 / 2.3.6)', () => {
  it.each([
    'Horario ya reservado',
    'El nuevo horario ya está reservado',
    'El nuevo horario ya esta reservado',
    'Horario no existe',
    'El nuevo horario no existe',
  ])('"%s" → horario ya no disponible', (raw) => {
    expect(traducirErrorCita(raw)).toBe(MSG_HORARIO_NO_DISPONIBLE)
  })

  it.each([
    'El medico ya alcanzo el maximo de 15 citas para ese dia. Elige otro dia.',
    'El médico ya alcanzó el máximo de 15 citas para ese día.',
  ])('"%s" → día sin cupos', (raw) => {
    expect(traducirErrorCita(raw)).toBe(MSG_DIA_SIN_CUPOS)
  })

  it.each([
    'Solo se pueden cancelar citas confirmadas (estado actual: completada)',
    'Solo se pueden reprogramar citas confirmadas (estado actual: cancelada)',
    'La cita no existe',
  ])('"%s" → cita ya no disponible', (raw) => {
    expect(traducirErrorCita(raw)).toBe(MSG_CITA_NO_DISPONIBLE)
  })

  it('el tope no depende del número concreto (si cambia c_max_citas_dia)', () => {
    expect(traducirErrorCita('maximo de 20 citas')).toBe(MSG_DIA_SIN_CUPOS)
  })

  it('un mensaje desconocido se devuelve tal cual (no se oculta un error nuevo)', () => {
    expect(traducirErrorCita('No autorizado: la cita no pertenece al usuario actual')).toBe(
      'No autorizado: la cita no pertenece al usuario actual',
    )
  })
})
