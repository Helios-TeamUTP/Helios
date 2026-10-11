import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTableQuery } from '../test/supabase-mock'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { from: fromMock } }))

import { usePacientesMedico } from './usePacientesMedico'
import { COLUMNAS_CITA, COLUMNAS_HISTORIAL } from '../lib/columnas'

const pac = (id: string, nombre: string) => ({ id, nombre, cedula: '8-123-4567' })
const citaDe = (id: string, pacienteId: string, fecha: string) => ({
  id,
  paciente_id: pacienteId,
  created_at: '2026-01-01T00:00:00Z',
  paciente: pac(pacienteId, `Paciente ${pacienteId}`),
  horario: { fecha },
})

function configurar(citas: unknown, historial: unknown, citasError: { message: string } | null = null) {
  const qCitas = createTableQuery({ data: citas, error: citasError })
  const qHist = createTableQuery({ data: historial })
  fromMock.mockImplementation((tabla: string) => (tabla === 'citas' ? qCitas : qHist))
  return { qCitas, qHist }
}

const selectDe = (q: ReturnType<typeof createTableQuery>) =>
  (q.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string

describe('usePacientesMedico', () => {
  beforeEach(() => vi.clearAllMocks())

  it('arma un renglón por paciente con su cita completada más reciente y su dolencia', async () => {
    const { qCitas, qHist } = configurar(
      [citaDe('c3', 'p1', '2026-09-20'), citaDe('c2', 'p2', '2026-09-10'), citaDe('c1', 'p1', '2026-08-01')],
      [
        { id: 'h3', cita_id: 'c3', dolencia_principal: 'Migraña', receta: 'Ibuprofeno' },
        { id: 'h1', cita_id: 'c1', dolencia_principal: 'Gripe', receta: null },
      ],
    )

    const { result } = renderHook(() => usePacientesMedico('m1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toHaveLength(2) // p1 aparece una sola vez
    const p1 = result.current.data.find((r) => r.paciente.id === 'p1')!
    expect(p1.dolencia_principal).toBe('Migraña') // la cita más reciente, no la antigua
    expect(p1.receta).toBe('Ibuprofeno')
    expect(p1.ultima_visita).toBe('2026-09-20')
    const p2 = result.current.data.find((r) => r.paciente.id === 'p2')!
    expect(p2.dolencia_principal).toBe('Sin registrar') // sin historial
    expect(p2.receta).toBeNull()

    // Privacidad: solo columnas permitidas, nunca select('*') ni las notas legacy.
    expect(selectDe(qCitas)).toContain(COLUMNAS_CITA)
    expect(selectDe(qCitas).trimStart().startsWith('*')).toBe(false)
    expect(selectDe(qHist)).toBe(COLUMNAS_HISTORIAL)
    expect(qCitas.eq).toHaveBeenCalledWith('estado', 'completada')
    expect(qHist.eq).toHaveBeenCalledWith('medico_id', 'm1')
  })

  it('ignora citas sin paciente asociado', async () => {
    configurar([{ id: 'c1', paciente_id: null, paciente: null, horario: null, created_at: 'x' }], [])
    const { result } = renderHook(() => usePacientesMedico('m1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('sin medicoId no consulta', async () => {
    const { result } = renderHook(() => usePacientesMedico(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fromMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
  })

  it('expone el error de Supabase y deja de cargar', async () => {
    configurar(null, [], new Error('boom')) // PostgrestError real es instancia de Error
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => usePacientesMedico('m1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    errSpy.mockRestore()
  })
})
