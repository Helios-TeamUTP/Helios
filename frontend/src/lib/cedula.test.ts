import { describe, expect, it } from 'vitest'
import { isValidCedulaPanama, normalizeCedula } from './cedula'

describe('cedula panama', () => {
  describe('isValidCedulaPanama', () => {
    it('acepta cedulas numericas de 8 digitos', () => {
      expect(isValidCedulaPanama('12345678')).toBe(true)
    })

    it('acepta cedulas numericas de 9 a 10 digitos', () => {
      expect(isValidCedulaPanama('123456789')).toBe(true)
      expect(isValidCedulaPanama('1234567890')).toBe(true)
    })

    it('acepta formato con guiones tipo 8-123-456', () => {
      expect(isValidCedulaPanama('8-123-4567')).toBe(true)
    })

    it('acepta formato con prefijo PE, N o E', () => {
      expect(isValidCedulaPanama('PE-12-345')).toBe(true)
      expect(isValidCedulaPanama('N-12-345')).toBe(true)
      expect(isValidCedulaPanama('E-12-345')).toBe(true)
    })

    it('rechaza strings vacios o muy cortos', () => {
      expect(isValidCedulaPanama('')).toBe(false)
      expect(isValidCedulaPanama('1234')).toBe(false)
    })

    it('rechaza strings con letras al medio (no PE/N/E)', () => {
      expect(isValidCedulaPanama('abc12345')).toBe(false)
    })

    it('rechaza con caracteres no permitidos', () => {
      expect(isValidCedulaPanama('123.456.789')).toBe(false)
    })
  })

  describe('normalizeCedula', () => {
    it('quita espacios y pasa a mayusculas', () => {
      expect(normalizeCedula(' pe-12-345 ')).toBe('PE-12-345')
    })

    it('preserva la cedula original cuando ya esta normalizada', () => {
      expect(normalizeCedula('8-123-4567')).toBe('8-123-4567')
    })
  })
})
