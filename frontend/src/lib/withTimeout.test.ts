import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from './withTimeout'

describe('withTimeout', () => {
  it('resuelve con el valor si la promesa termina antes del timeout', async () => {
    const result = await withTimeout(Promise.resolve('hola'), 1000)
    expect(result).toBe('hola')
  })

  it('propaga el rechazo si la promesa original rechaza antes del timeout', async () => {
    const fail = Promise.reject(new Error('boom'))
    await expect(withTimeout(fail, 1000)).rejects.toThrow('boom')
  })

  describe('cuando la promesa nunca resuelve', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('rechaza con TimeoutError tras transcurrir los ms indicados', async () => {
      const never = new Promise<string>(() => {})
      // Adjuntar el handler ANTES de avanzar timers: evita que la rejection
      // aparezca como unhandled rejection durante el flush de fake timers.
      const caught = withTimeout(never, 1000).catch((e) => e)
      await vi.advanceTimersByTimeAsync(1001)
      expect(await caught).toBeInstanceOf(TimeoutError)
    })

    it('el mensaje del TimeoutError incluye el valor de ms', async () => {
      const never = new Promise<string>(() => {})
      const caught = withTimeout(never, 2500).catch((e: unknown) =>
        e instanceof Error ? e.message : String(e),
      )
      await vi.advanceTimersByTimeAsync(2501)
      expect(await caught).toContain('2500ms')
    })
  })
})

describe('TimeoutError', () => {
  it('es subclase de Error con name TimeoutError', () => {
    const err = new TimeoutError(500)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('TimeoutError')
    expect(err.message).toContain('500')
  })
})

describe('AUTH_TIMEOUT_MS', () => {
  it('está fijado en 15 segundos para HELIOS', () => {
    expect(AUTH_TIMEOUT_MS).toBe(15_000)
  })
})
