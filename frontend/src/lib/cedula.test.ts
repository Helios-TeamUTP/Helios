import { describe, test, expect } from 'vitest'
import {
  isValidCedulaPanama,
  normalizeCedula,
  tipoCedula,
  CEDULA_REGEX,
} from './cedula'

describe('isValidCedulaPanama — cédulas VÁLIDAS', () => {
  test.each([
    ['8-123-4567', 'provincial estándar'],
    ['1-1-1', 'valores mínimos'],
    ['99-9999-9999999', 'máximos (provincia 99, tomo 4 dígitos, asiento 7 dígitos)'],
    ['13-1-1', 'comarca Ngäbe-Buglé (provincia 13)'],
    ['N-12-34567', 'naturalizado'],
    ['E-8-123456', 'extranjero residente'],
    ['PE-4-12345', 'permiso especial'],
    ['PI-12-3456', 'indígena / comarca'],
    ['8-1-1234567', 'asiento en el máximo de 7 dígitos'],
  ])('"%s" → true (%s)', (cedula) => {
    expect(isValidCedulaPanama(cedula)).toBe(true)
  })
})

describe('isValidCedulaPanama — cédulas INVÁLIDAS', () => {
  test.each([
    ['12345', 'bug original — solo dígitos sin estructura'],
    ['00000', 'bug original — ceros sin estructura'],
    ['999999999999', 'bug original — 12 dígitos sin formato'],
    ['100-1-1', 'provincia 100, supera el máximo de 99'],
    ['0-1-1', 'provincia 0 no existe'],
    ['8-0-1', 'tomo 0 inválido'],
    ['8-1-0', 'asiento 0 inválido'],
    ['8-1-12345678', 'asiento de 8 dígitos, supera el máximo de 7'],
    ['8 123 4567', 'espacios en lugar de guiones'],
    ['n-12-34567', 'minúsculas sin normalizar'],
    ['', 'cadena vacía'],
  ])('"%s" → false (%s)', (cedula) => {
    expect(isValidCedulaPanama(cedula)).toBe(false)
  })
})

describe('tipoCedula', () => {
  test.each([
    ['8-123-4567', 'provincial'],
    ['13-1-1', 'provincial'],
    ['N-12-34567', 'naturalizado'],
    ['E-8-123456', 'extranjero'],
    ['PE-4-12345', 'permiso-especial'],
    ['PI-12-3456', 'indigena'],
    ['12345', 'invalida'],
    ['100-1-1', 'invalida'],
    ['', 'invalida'],
  ])('"%s" → %s', (cedula, esperado) => {
    expect(tipoCedula(cedula)).toBe(esperado)
  })
})

describe('normalizeCedula', () => {
  test('quita espacios extremos y pasa a mayúsculas', () => {
    expect(normalizeCedula('  n-12-34567  ')).toBe('N-12-34567')
    expect(normalizeCedula('pe-4-12345')).toBe('PE-4-12345')
  })

  test('una cédula minúscula es inválida sin normalizar, válida al normalizar', () => {
    expect(isValidCedulaPanama('n-12-34567')).toBe(false)
    expect(isValidCedulaPanama(normalizeCedula('n-12-34567'))).toBe(true)
  })
})

describe('CEDULA_REGEX', () => {
  test('matchea una cédula válida y rechaza dígitos sueltos', () => {
    expect(CEDULA_REGEX.test('8-123-4567')).toBe(true)
    expect(CEDULA_REGEX.test('12345')).toBe(false)
  })
})
