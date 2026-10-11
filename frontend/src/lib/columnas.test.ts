import { describe, it, expect } from 'vitest'
import { COLUMNAS_CITA, COLUMNAS_HISTORIAL } from './columnas'

// Invariante de privacidad (B-34 / B-35): el cliente no debe poder pedir por
// accidente las columnas legacy con notas privadas ni usar select('*').
describe('columnas permitidas (privacidad de notas)', () => {
  const cols = (s: string) => s.split(',').map((c) => c.trim())

  it('citas: no incluye la nota privada del paciente ni comodines', () => {
    expect(cols(COLUMNAS_CITA)).not.toContain('notas')
    expect(COLUMNAS_CITA).not.toContain('*')
    expect(cols(COLUMNAS_CITA)).toEqual(
      expect.arrayContaining(['id', 'paciente_id', 'medico_id', 'horario_id', 'estado']),
    )
  })

  it('historial_clinico: no incluye la nota privada del médico ni comodines', () => {
    expect(cols(COLUMNAS_HISTORIAL)).not.toContain('notas_clinicas')
    expect(COLUMNAS_HISTORIAL).not.toContain('*')
    expect(cols(COLUMNAS_HISTORIAL)).toEqual(
      expect.arrayContaining(['id', 'cita_id', 'dolencia_principal', 'receta']),
    )
  })
})
