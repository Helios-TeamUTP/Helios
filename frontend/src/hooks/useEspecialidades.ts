import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Especialidad } from '../lib/types'

/**
 * Hook que carga las especialidades médicas activas desde Supabase.
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle (cold start, RLS, timeout). Sin esto, el spinner del
 * SelectorEspecialidad podía quedar infinito.
 *
 * @returns data (especialidades), loading, error
 */
export function useEspecialidades() {
  const [data, setData] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // Reset sincrono de loading/error al iniciar el efecto — mismo patron
    // ya documentado en useSedes.ts/useMedicos.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('especialidades')
          .select('*')
          .order('nombre')
        if (!active) return
        if (error) setError(error.message)
        else setData(data ?? [])
      } catch (err) {
        if (active) {
          console.error('[useEspecialidades] unexpected:', err)
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
