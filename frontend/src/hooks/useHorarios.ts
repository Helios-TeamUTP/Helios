import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Horario } from '../lib/types'

/**
 * Hook que carga los horarios disponibles de un médico específico desde hoy
 * en adelante (no muestra slots pasados).
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. El early return cuando no hay medicoId también setea
 * loading=false explícitamente.
 *
 * @param medicoId - ID del médico o null
 * @returns data (horarios disponibles), loading, error
 */
export function useHorarios(medicoId: string | null) {
  const [data, setData] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!medicoId) {
      setData([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    // Bug B-21: NO usar toISOString() — devuelve la fecha en UTC y en Panamá
    // (UTC-5) después de las 7 PM eso adelanta al día siguiente, ocultando los
    // slots de "hoy". Construimos la fecha LOCAL (YYYY-MM-DD) a mano.
    const ahora = new Date()
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('horarios')
          .select('*')
          .eq('medico_id', medicoId)
          .eq('disponible', true)
          .gte('fecha', hoy)
          .order('fecha')
          .order('hora_inicio')
        if (!active) return
        if (error) setError(error.message)
        else setData(data ?? [])
      } catch (err) {
        if (active) {
          console.error('[useHorarios] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [medicoId])

  return { data, loading, error }
}
