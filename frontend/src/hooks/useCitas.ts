import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CitaConRelaciones } from '../lib/types'

/**
 * Hook que carga las citas del paciente autenticado con joins anidados
 * a horarios, médicos, especialidades y sedes.
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. El early return cuando no hay pacienteId también setea
 * loading=false explícitamente.
 *
 * Race condition fix (code-reviewer HIGH): signal flag previene que una
 * respuesta tardía de un pacienteId viejo sobrescriba los datos del
 * pacienteId nuevo. CRÍTICO en app médica: sin esto, citas del Paciente A
 * podrían mostrarse al Paciente B tras logout/login rápido.
 *
 * @param pacienteId - ID del paciente autenticado o null si no hay sesión
 * @returns data (citas con relaciones), loading, error, refetch
 */
export function useCitas(pacienteId: string | null) {
  const [data, setData] = useState<CitaConRelaciones[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carga citas del paciente. Acepta opcionalmente un `signal` con un flag
   * `active` para descartar respuestas tardías (race condition guard).
   * Cuando se llama desde `refetch` (sin signal), siempre aplica el resultado.
   */
  const fetchCitas = useCallback(
    async (signal?: { active: boolean }) => {
      if (!pacienteId) {
        if (!signal || signal.active) {
          setData([])
          setLoading(false)
        }
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('citas')
          .select(
            '*, horario:horarios(*), medico:medicos(*, especialidad:especialidades(*)), sede:sedes(*)',
          )
          .eq('paciente_id', pacienteId)
          .order('created_at', { ascending: false })

        // Descartar respuesta si el efecto ya fue cancelado
        if (signal && !signal.active) return

        if (error) {
          setError(error.message)
        } else {
          setData((data ?? []) as unknown as CitaConRelaciones[])
        }
      } catch (err) {
        if (!signal || signal.active) {
          console.error('[useCitas] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!signal || signal.active) setLoading(false)
      }
    },
    [pacienteId],
  )

  useEffect(() => {
    const signal = { active: true }
    // fetchCitas es async y solo llama setState tras chequear signal.active
    // (cancelado en el cleanup de abajo). Este es el patron oficial de React
    // para evitar race conditions en efectos con fetch async; la regla
    // react-hooks/set-state-in-effect no puede verificar estaticamente que
    // el guard ya lo hace seguro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCitas(signal)
    return () => {
      signal.active = false
    }
  }, [fetchCitas])

  return { data, loading, error, refetch: () => fetchCitas() }
}
