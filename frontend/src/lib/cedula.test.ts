import { describe, expect, it } from 'vitest'
import {
  isValidCedulaPanama,
  normalizeCedula,
  detectarTipoCedula,
  EJEMPLOS_CEDULA,
} from './cedula'

describe('cedula panama', () => {
  describe('isValidCedulaPanama', () => {
    it('acepta cedulas numericas de 8 digitos', () => {
      expect(isValidCedulaPanama('12345678')).toBe(true)
    })

    it('acepta cedulas numericas de 9 a 10 digitos', () => {
      expect(isValidCedulaPanama('123456789')).toBe(true)
      expect(isValidCedulaPanama('1234567890')).toBe(true)
    })

    it('acepta formato natural con guiones tipo 8-123-4567', () => {
      expect(isValidCedulaPanama('8-123-4567')).toBe(true)
    })

    it('acepta formato con prefijo PE, N o E', () => {
      expect(isValidCedulaPanama('PE-12-345')).toBe(true)
      expect(isValidCedulaPanama('N-12-345')).toBe(true)
      expect(isValidCedulaPanama('E-12-345')).toBe(true)
    })

    /**
     * Bug B-22: el validador anterior rechazaba cédulas válidas cortas
     * porque exigía >=5 dígitos tras quitar el prefijo. Estos casos reales
     * (del Tribunal Electoral) ahora DEBEN aceptarse.
     */
    it('B-22: acepta cedulas validas cortas por tipo', () => {
      expect(isValidCedulaPanama('PE-5-687')).toBe(true) // antes fallaba (4 digitos)
      expect(isValidCedulaPanama('N-19-473')).toBe(true)
      expect(isValidCedulaPanama('E-8-74258')).toBe(true)
      expect(isValidCedulaPanama('8-926-1601')).toBe(true)
      expect(isValidCedulaPanama('PI-12-3456')).toBe(true)
    })

    it('B-22: normaliza minusculas y espacios antes de validar', () => {
      expect(isValidCedulaPanama('  pe-5-687  ')).toBe(true)
    })

    it('rechaza strings vacios o muy cortos', () => {
      expect(isValidCedulaPanama('')).toBe(false)
      expect(isValidCedulaPanama('1234')).toBe(false)
    })

    it('rechaza strings con letras al medio (no PE/N/E/PI)', () => {
      expect(isValidCedulaPanama('abc12345')).toBe(false)
    })

    it('rechaza con caracteres no permitidos', () => {
      expect(isValidCedulaPanama('123.456.789')).toBe(false)
      expect(isValidCedulaPanama('8/123/4567')).toBe(false)
    })

    it('B-22: acepta claves futuras (nuevas comarcas) y rechaza clave 0', () => {
      // Future-proof: Panamá sigue creando comarcas (ej. Naso Tjër Di 2020) que
      // podrian recibir claves > 13. Aceptamos 1-99 para no rechazar cedulas
      // validas futuras. La clave 0 (o 00) NO existe -> se rechaza.
      expect(isValidCedulaPanama('14-1-1')).toBe(true) // hipotetica comarca nueva
      expect(isValidCedulaPanama('0-1-1')).toBe(false)
      expect(isValidCedulaPanama('00-1-1')).toBe(false)
    })
  })

  describe('detectarTipoCedula (B-22)', () => {
    it('detecta tipo PE', () => {
      expect(detectarTipoCedula('PE-5-687').tipo).toBe('pe')
    })
    it('detecta tipo N (naturalizado)', () => {
      expect(detectarTipoCedula('N-19-473').tipo).toBe('n')
    })
    it('detecta tipo E (extranjero)', () => {
      expect(detectarTipoCedula('E-8-74258').tipo).toBe('e')
    })
    it('detecta tipo PI (comarca)', () => {
      expect(detectarTipoCedula('PI-12-3456').tipo).toBe('pi')
    })
    it('detecta tipo natural', () => {
      expect(detectarTipoCedula('8-926-1601').tipo).toBe('natural')
    })
    it('marca desconocido para basura', () => {
      expect(detectarTipoCedula('abc!!').tipo).toBe('desconocido')
    })
  })

  describe('EJEMPLOS_CEDULA (B-22)', () => {
    it('expone ejemplos por tipo para la UI', () => {
      expect(EJEMPLOS_CEDULA.length).toBeGreaterThanOrEqual(5)
      // Cada ejemplo debe ser una cédula válida segun el propio validador.
      for (const { ejemplo } of EJEMPLOS_CEDULA) {
        expect(isValidCedulaPanama(ejemplo)).toBe(true)
      }
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
