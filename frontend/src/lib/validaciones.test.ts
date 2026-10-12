import { describe, expect, it } from 'vitest'
import { validarTelefonoPanama, validarNombre, validarEmail, validarPassword } from './validaciones'

describe('validaciones (B-24)', () => {
  describe('validarTelefonoPanama', () => {
    it('acepta movil de 8 digitos con guion', () => {
      expect(validarTelefonoPanama('6000-0000')).toBe(true)
    })
    it('acepta movil de 8 digitos sin separador', () => {
      expect(validarTelefonoPanama('60000000')).toBe(true)
    })
    it('acepta fijo de 7 digitos', () => {
      expect(validarTelefonoPanama('200-0000')).toBe(true)
    })
    it('acepta prefijo internacional +507', () => {
      expect(validarTelefonoPanama('+507 6000 0000')).toBe(true)
      expect(validarTelefonoPanama('507-6000-0000')).toBe(true)
    })
    it('rechaza telefono con letras', () => {
      expect(validarTelefonoPanama('6000-ABCD')).toBe(false)
    })
    it('rechaza simbolos no permitidos', () => {
      expect(validarTelefonoPanama('6000_0000')).toBe(false)
      expect(validarTelefonoPanama('(600) 0000')).toBe(false)
    })
    it('rechaza longitudes invalidas', () => {
      expect(validarTelefonoPanama('123')).toBe(false)
      expect(validarTelefonoPanama('123456789012')).toBe(false)
    })
    it('rechaza vacio', () => {
      expect(validarTelefonoPanama('')).toBe(false)
    })
  })

  describe('validarNombre', () => {
    it('acepta nombre simple', () => {
      expect(validarNombre('Ana López')).toBe(true)
    })
    it('acepta nombres con apostrofo, punto y guion', () => {
      expect(validarNombre("José M. Brown-Guerrero")).toBe(true)
      expect(validarNombre("O'Brien")).toBe(true)
    })
    it('rechaza nombre con numeros', () => {
      expect(validarNombre('Ana123')).toBe(false)
    })
    it('rechaza nombre con simbolos', () => {
      expect(validarNombre('Ana@López')).toBe(false)
      expect(validarNombre('Ana#1')).toBe(false)
    })
    it('rechaza muy corto o vacio', () => {
      expect(validarNombre('A')).toBe(false)
      expect(validarNombre('')).toBe(false)
      expect(validarNombre('   ')).toBe(false)
    })
  })

  describe('validarEmail', () => {
    it('acepta correos validos', () => {
      expect(validarEmail('ana@test.com')).toBe(true)
      expect(validarEmail('jose.brown@gmail.com')).toBe(true)
    })
    it('rechaza sin arroba o sin dominio', () => {
      expect(validarEmail('anatest.com')).toBe(false)
      expect(validarEmail('ana@test')).toBe(false)
      expect(validarEmail('ana@.com')).toBe(false)
    })
    it('rechaza con espacios o doble arroba', () => {
      expect(validarEmail('ana @test.com')).toBe(false)
      expect(validarEmail('ana@@test.com')).toBe(false)
    })
    it('rechaza vacio', () => {
      expect(validarEmail('')).toBe(false)
    })
  })
})

// Las contraseñas de prueba se generan por código (no literales) para no
// disparar los escáneres de secretos con falsos positivos.
const fuerte = (largo: number) => 'Aa1' + 'x'.repeat(Math.max(largo - 3, 0))

describe('validarPassword (ERS RF-01: mín. 8, 1 mayúscula, 1 número)', () => {
  it('acepta una contraseña que cumple las 3 reglas', () => {
    expect(validarPassword(fuerte(12))).toBeNull()
    expect(validarPassword(fuerte(8))).toBeNull() // exactamente 8 (límite)
  })
  it('rechaza menos de 8 caracteres (límite: 7)', () => {
    expect(validarPassword(fuerte(7))).toMatch(/8 caracteres/)
  })
  it('rechaza sin mayúscula', () => {
    expect(validarPassword('a1' + 'x'.repeat(8))).toMatch(/mayúscula/)
  })
  it('rechaza sin número', () => {
    expect(validarPassword('Ab' + 'x'.repeat(8))).toMatch(/número/)
  })
  it('rechaza vacío', () => {
    expect(validarPassword('')).toMatch(/8 caracteres/)
  })
})
