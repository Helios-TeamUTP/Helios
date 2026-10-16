import { describe, it, expect } from 'vitest'
import {
  traducirErrorAuth,
  MSG_CREDENCIALES,
  MSG_CORREO_EXISTENTE,
  MSG_CORREO_SIN_CONFIRMAR,
  MSG_DEMASIADOS_INTENTOS,
  MSG_REGISTRO_RECHAZADO,
} from './erroresAuth'

const FALLBACK = 'No se pudo completar la operación.'

describe('traducirErrorAuth (CU-01 / CU-02)', () => {
  it('credenciales inválidas: mismo mensaje por código o por texto, sin decir qué campo falló', () => {
    expect(traducirErrorAuth({ code: 'invalid_credentials' }, FALLBACK)).toBe(MSG_CREDENCIALES)
    expect(traducirErrorAuth({ message: 'Invalid login credentials' }, FALLBACK)).toBe(MSG_CREDENCIALES)
    expect(MSG_CREDENCIALES).not.toMatch(/correo es|contraseña es|no existe/i)
  })

  it('correo ya registrado (CA-01-04)', () => {
    expect(traducirErrorAuth({ code: 'user_already_exists' }, FALLBACK)).toBe(MSG_CORREO_EXISTENTE)
    expect(traducirErrorAuth({ message: 'User already registered' }, FALLBACK)).toBe(MSG_CORREO_EXISTENTE)
  })

  it('correo sin confirmar', () => {
    expect(traducirErrorAuth({ code: 'email_not_confirmed' }, FALLBACK)).toBe(MSG_CORREO_SIN_CONFIRMAR)
    expect(traducirErrorAuth({ message: 'Email not confirmed' }, FALLBACK)).toBe(MSG_CORREO_SIN_CONFIRMAR)
  })

  it('límite de intentos / envíos', () => {
    expect(traducirErrorAuth({ status: 429 }, FALLBACK)).toBe(MSG_DEMASIADOS_INTENTOS)
    expect(traducirErrorAuth({ code: 'over_email_send_rate_limit' }, FALLBACK)).toBe(MSG_DEMASIADOS_INTENTOS)
    expect(traducirErrorAuth({ message: 'Email rate limit exceeded' }, FALLBACK)).toBe(MSG_DEMASIADOS_INTENTOS)
  })

  it('un error desconocido (técnico, en inglés) NO se muestra crudo: usa el fallback', () => {
    expect(traducirErrorAuth({ message: 'Unexpected failure in upstream service' }, FALLBACK)).toBe(FALLBACK)
    expect(traducirErrorAuth({}, FALLBACK)).toBe(FALLBACK)
  })
})

describe('traducirErrorAuth — rechazo del trigger de registro', () => {
  it('traduce "Database error saving new user" y no muestra el texto crudo', () => {
    const msg = traducirErrorAuth({ message: 'Database error saving new user', status: 500 }, 'fallback')
    expect(msg).toBe(MSG_REGISTRO_RECHAZADO)
    expect(msg).not.toMatch(/database/i)
  })
})
