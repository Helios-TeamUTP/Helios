import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  marcarSiLlegaPorRecuperacion,
  llegoPorRecuperacion,
  limpiarMarcaRecuperacion,
} from './recuperacion'

describe('recuperacion (RF-04)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.location.hash = ''
  })
  afterEach(() => {
    window.location.hash = ''
  })

  it('marca cuando el hash trae type=recovery', () => {
    window.location.hash = '#foo=bar&type=recovery'
    marcarSiLlegaPorRecuperacion()
    expect(llegoPorRecuperacion()).toBe(true)
  })

  it('no marca con un login normal (type=magiclink, signup o sin hash)', () => {
    window.location.hash = '#foo=bar&type=signup'
    marcarSiLlegaPorRecuperacion()
    expect(llegoPorRecuperacion()).toBe(false)

    window.location.hash = ''
    marcarSiLlegaPorRecuperacion()
    expect(llegoPorRecuperacion()).toBe(false)
  })

  it('no marca si el enlace vino con error (vencido/ya usado)', () => {
    window.location.hash = '#error=access_denied&error_code=otp_expired&error_description=expired'
    marcarSiLlegaPorRecuperacion()
    expect(llegoPorRecuperacion()).toBe(false)
  })

  it('la marca sobrevive aunque el hash se borre (F5 o limpieza de supabase-js)', () => {
    window.location.hash = '#foo=bar&type=recovery'
    marcarSiLlegaPorRecuperacion()
    window.location.hash = ''
    expect(llegoPorRecuperacion()).toBe(true)
  })

  it('limpiarMarcaRecuperacion la borra', () => {
    window.location.hash = '#type=recovery'
    marcarSiLlegaPorRecuperacion()
    limpiarMarcaRecuperacion()
    expect(llegoPorRecuperacion()).toBe(false)
  })
})
