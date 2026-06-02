import { describe, expect, it } from 'vitest'
import { validarTelefonoPanama, validarNombre, validarEmail } from './validaciones'

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
