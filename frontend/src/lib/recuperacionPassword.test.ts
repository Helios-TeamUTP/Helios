import { describe, it, expect, beforeEach } from 'vitest'
import {
  clasificarUrlRecuperacion,
  leerEstadoRecuperacion,
  limpiarEstadoRecuperacion,
  RUTA_RESTABLECER,
} from './recuperacionPassword'

describe('clasificarUrlRecuperacion', () => {
  it('hash con type=recovery (flujo implícito) → valido', () => {
    expect(
      clasificarUrlRecuperacion('/', '', '#foo=bar&type=recovery'),
    ).toBe('valido')
  })

  it('error otp_expired en el hash → expirado', () => {
    expect(
      clasificarUrlRecuperacion(
        RUTA_RESTABLECER,
        '',
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      ),
    ).toBe('expirado')
  })

  it('?code= en la ruta de restablecer (flujo PKCE) → valido', () => {
    expect(clasificarUrlRecuperacion(RUTA_RESTABLECER, '?code=xyz', '')).toBe('valido')
  })

  it('?code= en otra ruta NO cuenta como recuperación', () => {
    expect(clasificarUrlRecuperacion('/login', '?code=xyz', '')).toBeNull()
  })

  it('un login normal (type=signup, sin parámetros) → null', () => {
    expect(clasificarUrlRecuperacion('/', '', '')).toBeNull()
    expect(clasificarUrlRecuperacion('/', '', '#foo=bar&type=signup')).toBeNull()
  })
})

describe('leer / limpiar estado de recuperación', () => {
  beforeEach(() => sessionStorage.clear())

  it('devuelve null si no hay nada guardado', () => {
    expect(leerEstadoRecuperacion()).toBeNull()
  })

  it('lee un estado válido guardado y lo borra con limpiar', () => {
    sessionStorage.setItem('helios_recovery_estado', 'valido')
    expect(leerEstadoRecuperacion()).toBe('valido')
    limpiarEstadoRecuperacion()
    expect(leerEstadoRecuperacion()).toBeNull()
  })

  it('ignora valores manipulados que no son un estado conocido', () => {
    sessionStorage.setItem('helios_recovery_estado', 'cualquier-cosa')
    expect(leerEstadoRecuperacion()).toBeNull()
  })
})
