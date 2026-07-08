import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sede } from '../lib/types'

/**
 * Hook que carga las sedes activas (policlínicas) desde Supabase.
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. Sin esto, el SelectorSede podía quedar en spinner
 * infinito en cold starts o timeouts.
 *
 * @returns data (sedes activas), loading, error
 */
export function useSedes() {
  const [data, setData] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // Reset sincrono de loading/error al iniciar el efecto — patron valido
    // de React para preparar el estado antes de un fetch async (ver
    // fetchCitas en useCitas.ts para el mismo criterio ya documentado).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('sedes')
          .select('*')
          .eq('activo', true)
          .order('nombre')
        if (!active) return
        if (error) setError(error.message)
        else setData(data ?? [])
      } catch (err) {
        if (active) {
          console.error('[useSedes] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}
