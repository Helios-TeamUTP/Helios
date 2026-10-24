import { describe, expect, it } from 'vitest'
import { saludoPorHora } from './saludo'

describe('saludoPorHora', () => {
  it.each([
    [0, 'Buenos días'],
    [11, 'Buenos días'],
    [12, 'Buenas tardes'],
    [17, 'Buenas tardes'],
    [18, 'Buenas noches'],
    [23, 'Buenas noches'],
  ])('a las %i h saluda "%s"', (hora, esperado) => {
    expect(saludoPorHora(hora)).toBe(esperado)
  })
})
