import { describe, it, expect } from 'vitest'
import { validarRegistro, EJEMPLOS_TEXTO, type RegistroForm } from './validarRegistro'

const valido: RegistroForm = {
  nombre: 'María Pérez',
  cedula: '8-123-4567',
  cedulaConfirm: '8-123-4567',
  telefono: '6000-0000',
  correo: 'maria@correo.com',
  password: 'secreto1',
  passwordConfirm: 'secreto1',
}
const con = (cambios: Partial<RegistroForm>): RegistroForm => ({ ...valido, ...cambios })

describe('validarRegistro', () => {
  it('devuelve null con un formulario válido', () => {
    expect(validarRegistro(valido)).toBeNull()
  })

  it('el teléfono es opcional: vacío o solo espacios es válido', () => {
    expect(validarRegistro(con({ telefono: '' }))).toBeNull()
    expect(validarRegistro(con({ telefono: '   ' }))).toBeNull()
  })

  describe('campos obligatorios (CA-01-01)', () => {
    it.each([
      ['nombre', 'nombre completo'],
      ['cedula', 'cédula'],
      ['cedulaConfirm', 'confirmar cédula'],
      ['correo', 'correo electrónico'],
      ['password', 'contraseña'],
      ['passwordConfirm', 'confirmar contraseña'],
    ] as const)('%s vacío -> pide "%s"', (campo, etiqueta) => {
      expect(validarRegistro(con({ [campo]: '' }))).toBe(`Debe completar ${etiqueta} para continuar.`)
    })

    it('un campo con solo espacios cuenta como vacío', () => {
      expect(validarRegistro(con({ correo: '   ' }))).toBe(
        'Debe completar correo electrónico para continuar.',
      )
    })

    it('si faltan varios, gana el primero en el orden del formulario', () => {
      expect(validarRegistro(con({ nombre: '', cedula: '', password: '' }))).toBe(
        'Debe completar nombre completo para continuar.',
      )
      expect(validarRegistro(con({ correo: '', password: '' }))).toBe(
        'Debe completar correo electrónico para continuar.',
      )
    })
  })

  it('rechaza un nombre con caracteres no permitidos (B-24)', () => {
    expect(validarRegistro(con({ nombre: 'Juan123' }))).toBe(
      'Nombre inválido. Usa solo letras, espacios, apóstrofo o guion (2-80 caracteres).',
    )
  })

  it('rechaza una cédula con formato inválido e incluye los ejemplos (B-22)', () => {
    const msg = validarRegistro(con({ cedula: 'abc', cedulaConfirm: 'abc' }))
    expect(msg).toBe(`El formato de la cédula no es válido. Ejemplos válidos: ${EJEMPLOS_TEXTO}.`)
    expect(EJEMPLOS_TEXTO.length).toBeGreaterThan(0)
  })

  it('rechaza si la cédula y su confirmación no coinciden (B-23)', () => {
    expect(validarRegistro(con({ cedulaConfirm: '8-123-4568' }))).toBe(
      'La cédula no coincide con la confirmación. Verifica que las escribiste igual.',
    )
  })

  it('compara la confirmación de cédula ya normalizada (espacios alrededor no importan)', () => {
    expect(validarRegistro(con({ cedulaConfirm: ' 8-123-4567 ' }))).toBeNull()
  })

  it('rechaza un teléfono inválido solo cuando se ingresa (B-24)', () => {
    expect(validarRegistro(con({ telefono: '12ab' }))).toBe(
      'Ingresa un número de teléfono válido. Usa solo números (ej: 6000-0000 o +507 6000 0000).',
    )
  })

  it('rechaza un correo con formato inválido (B-24)', () => {
    expect(validarRegistro(con({ correo: 'sin-arroba' }))).toBe(
      'Correo electrónico inválido. Revisa el formato (ej: nombre@correo.com).',
    )
  })

  describe('contraseña', () => {
    it('rechaza menos de 6 caracteres', () => {
      expect(validarRegistro(con({ password: '12345', passwordConfirm: '12345' }))).toBe(
        'La contraseña debe tener al menos 6 caracteres.',
      )
    })

    it('acepta exactamente 6 caracteres', () => {
      expect(validarRegistro(con({ password: '123456', passwordConfirm: '123456' }))).toBeNull()
    })

    it('rechaza si no coincide con su confirmación (B-23)', () => {
      expect(validarRegistro(con({ passwordConfirm: 'otra-clave' }))).toBe(
        'La contraseña no coincide con la confirmación. Verifica que las escribiste igual.',
      )
    })
  })

  describe('prioridad: con varios errores gana la regla más temprana', () => {
    it('nombre inválido antes que cédula inválida', () => {
      expect(validarRegistro(con({ nombre: 'X1', cedula: 'abc', cedulaConfirm: 'abc' }))).toMatch(
        /^Nombre inválido/,
      )
    })

    it('cédula inválida antes que teléfono, correo y contraseña inválidos', () => {
      const msg = validarRegistro(
        con({ cedula: 'abc', cedulaConfirm: 'abc', telefono: '12ab', correo: 'x', password: '1' }),
      )
      expect(msg).toMatch(/^El formato de la cédula no es válido/)
    })

    it('teléfono inválido antes que correo inválido', () => {
      expect(validarRegistro(con({ telefono: '12ab', correo: 'x' }))).toMatch(/^Ingresa un número/)
    })

    it('correo inválido antes que contraseña corta', () => {
      expect(validarRegistro(con({ correo: 'x', password: '1', passwordConfirm: '2' }))).toMatch(
        /^Correo electrónico inválido/,
      )
    })

    it('contraseña corta antes que contraseñas distintas', () => {
      expect(validarRegistro(con({ password: '1', passwordConfirm: '2' }))).toMatch(
        /^La contraseña debe tener al menos 6/,
      )
    })
  })
})
