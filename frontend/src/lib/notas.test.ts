import { describe, it, expect } from 'vitest'
import { textoNota } from './notas'

describe('textoNota', () => {
  it('lee la nota cuando PostgREST devuelve un objeto', () => {
    expect(textoNota({ nota: 'Traer exámenes' })).toBe('Traer exámenes')
  })
  it('lee la nota cuando PostgREST devuelve un arreglo', () => {
    expect(textoNota([{ nota: 'Control en 48h' }])).toBe('Control en 48h')
  })
  it('devuelve null si no hay nota, es null, undefined o está vacía', () => {
    expect(textoNota(null)).toBeNull()
    expect(textoNota(undefined)).toBeNull()
    expect(textoNota([])).toBeNull()
    expect(textoNota({ nota: '   ' })).toBeNull()
  })
})
