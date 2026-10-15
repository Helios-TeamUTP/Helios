import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createTableQuery } from '../test/supabase-mock'
import { TimeoutError } from '../lib/withTimeout'

const { fromMock, descargarBytesMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  descargarBytesMock: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({ supabase: { from: fromMock } }))
vi.mock('../lib/descargarArchivo', () => ({ descargarBytes: descargarBytesMock }))

import { useDescargarHistorial } from './useDescargarHistorial'

const paciente = {
  id: 'pac-1',
  nombre: 'Juan Pérez',
  cedula: '8-123-4567',
  telefono: '6000-1234',
  correo: 'juan@example.com',
  fecha_nacimiento: null,
}

const fila = (over: Record<string, unknown> = {}) => ({
  id: 'h1',
  cita_id: 'c1',
  dolencia_principal: 'Gripe estacional',
  receta: 'Paracetamol',
  medico: { nombre: 'Dra. García', especialidad: { nombre: 'Cardiología' } },
  cita: {
    horario: { fecha: '2026-08-24', hora_inicio: '09:00:00' },
    sede: { nombre: 'Policlínica Central' },
    nota_paciente: { nota: 'Me dolía la garganta' },
  },
  ...over,
})

const selectDe = (q: ReturnType<typeof createTableQuery>) =>
  (q.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string

/** Texto del PDF que se mandó a descargar (Latin-1, sin escapes de paréntesis). */
const pdfDescargado = () => {
  const bytes = descargarBytesMock.mock.calls[0][0] as Uint8Array
  return new TextDecoder('latin1').decode(bytes).replace(/\\([()\\])/g, '$1')
}

describe('useDescargarHistorial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // clearAllMocks no borra implementaciones: sin esto un `throw` simulado se filtra a otros tests.
    descargarBytesMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('MÉDICO: no pide la nota del paciente ni ninguna nota privada, y baja todo el historial del paciente', async () => {
    const query = createTableQuery({ data: [fila()] })
    fromMock.mockReturnValue(query)
    const { result } = renderHook(() => useDescargarHistorial())

    let ok = false
    await act(async () => {
      ok = await result.current.descargar({ paciente, modo: 'medico', generadoPor: 'Dra. García' })
    })

    expect(ok).toBe(true)
    expect(fromMock).toHaveBeenCalledWith('historial_clinico')
    expect(query.eq).toHaveBeenCalledWith('paciente_id', 'pac-1')
    // Sin límite de 5 como en la ficha: es el historial completo.
    expect(query.limit).not.toHaveBeenCalled()

    const select = selectDe(query)
    expect(select).toContain('sede:sedes(nombre)')
    expect(select).not.toContain('cita_nota_paciente') // CA-03-05: ni se intenta leer
    expect(select).not.toContain('historial_nota_medico') // notas del médico: no van al PDF
    expect(select).not.toContain('notas_clinicas')
    expect(select).not.toContain('*')
  })

  it('MÉDICO: aunque el servidor devolviera la nota del paciente, el PDF no la incluye', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [fila()] })) // la fila trae nota_paciente
    const { result } = renderHook(() => useDescargarHistorial())

    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico', generadoPor: 'Dra. García' })
    })

    const t = pdfDescargado()
    expect(t).toContain('Dolencia principal: Gripe estacional')
    expect(t).not.toContain('Me dolía la garganta')
    expect(t).not.toContain('Mi nota')
  })

  it('PACIENTE: pide su propia nota y el médico, pero nunca la nota del médico', async () => {
    const query = createTableQuery({ data: [fila()] })
    fromMock.mockReturnValue(query)
    const { result } = renderHook(() => useDescargarHistorial())

    await act(async () => {
      await result.current.descargar({ paciente, modo: 'paciente' })
    })

    const select = selectDe(query)
    expect(select).toContain('nota_paciente:cita_nota_paciente(nota)')
    expect(select).toContain('medico:medicos(')
    expect(select).not.toContain('historial_nota_medico') // CA-04-03
    expect(select).not.toContain('notas_clinicas')
    expect(select).not.toContain('*')

    const t = pdfDescargado()
    expect(t).toContain('Mi nota (privada): Me dolía la garganta') // CA-04-02
    expect(t).toContain('Dra. García (Cardiología)')
  })

  it('entrega el PDF con un nombre de archivo seguro y la fecha de hoy', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [fila()] }))
    const { result } = renderHook(() => useDescargarHistorial())

    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico' })
    })

    expect(descargarBytesMock).toHaveBeenCalledTimes(1)
    expect(descargarBytesMock.mock.calls[0][1]).toMatch(
      /^historial-clinico-juan-perez-\d{4}-\d{2}-\d{2}\.pdf$/,
    )
    expect(new TextDecoder('latin1').decode(descargarBytesMock.mock.calls[0][0]).startsWith('%PDF-')).toBe(true)
  })

  it('sin historial NO genera un PDF vacío: avisa', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [] }))
    const { result } = renderHook(() => useDescargarHistorial())

    let ok = true
    await act(async () => {
      ok = await result.current.descargar({ paciente, modo: 'medico' })
    })

    expect(ok).toBe(false)
    expect(descargarBytesMock).not.toHaveBeenCalled()
    expect(result.current.aviso).toBe('Aún no hay historial clínico registrado para descargar.')
    expect(result.current.error).toBeNull()
  })

  it('error de la consulta: mensaje claro (sin texto crudo de la BD) y no descarga', async () => {
    fromMock.mockReturnValue(createTableQuery({ error: { message: 'permission denied for table x' } }))
    const { result } = renderHook(() => useDescargarHistorial())

    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico' })
    })

    expect(descargarBytesMock).not.toHaveBeenCalled()
    expect(result.current.error).toBe('No se pudo preparar el historial. Intenta nuevamente.')
    expect(result.current.error).not.toMatch(/permission denied/)
  })

  it('TimeoutError: mensaje de demora y loading se rehabilita', async () => {
    const colgado = createTableQuery()
    // Thenable que rechaza de verdad (invoca el callback de rechazo, como una promesa).
    colgado.then = (_resolver: unknown, rechazar: (e: unknown) => unknown) =>
      rechazar(new TimeoutError(15_000))
    fromMock.mockReturnValue(colgado)
    const { result } = renderHook(() => useDescargarHistorial())

    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico' })
    })

    expect(result.current.error).toMatch(/tardó demasiado/)
    expect(result.current.loading).toBe(false)
  })

  it('excepción inesperada (p. ej. la descarga falla): mensaje genérico', async () => {
    fromMock.mockReturnValue(createTableQuery({ data: [fila()] }))
    descargarBytesMock.mockImplementationOnce(() => {
      throw new Error('blob no soportado')
    })
    const { result } = renderHook(() => useDescargarHistorial())

    let ok = true
    await act(async () => {
      ok = await result.current.descargar({ paciente, modo: 'medico' })
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('No se pudo preparar el historial. Intenta nuevamente.')
    expect(result.current.loading).toBe(false)
  })

  it('limpia el aviso y el error de un intento anterior al reintentar', async () => {
    fromMock.mockReturnValueOnce(createTableQuery({ data: [] }))
    const { result } = renderHook(() => useDescargarHistorial())
    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico' })
    })
    expect(result.current.aviso).not.toBeNull()

    fromMock.mockReturnValueOnce(createTableQuery({ data: [fila()] }))
    await act(async () => {
      await result.current.descargar({ paciente, modo: 'medico' })
    })
    expect(result.current.aviso).toBeNull()
  })
})
