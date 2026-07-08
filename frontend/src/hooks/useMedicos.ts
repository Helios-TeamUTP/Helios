import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MedicoConRelaciones } from '../lib/types'

/**
 * Hook que carga médicos activos filtrados por sede y especialidad.
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. El early return cuando faltan sedeId o especialidadId
 * también setea loading=false explícitamente.
 *
 * @param sedeId - ID de sede o null
 * @param especialidadId - ID de especialidad o null
 * @returns data (médicos con relaciones), loading, error
 */
export function useMedicos(sedeId: string | null, especialidadId: string | null) {
  const [data, setData] = useState<MedicoConRelaciones[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sedeId || !especialidadId) {
      // Reset sincrono cuando aun no hay seleccion completa — patron valido
      // de React (mismo criterio ya documentado en useCitas.ts/useSedes.ts).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select('*, especialidad:especialidades(*), sede:sedes(*)')
          .eq('sede_id', sedeId)
          .eq('especialidad_id', especialidadId)
          .eq('activo', true)
          .order('nombre')
        if (!active) return
        if (error) setError(error.message)
        else setData((data ?? []) as unknown as MedicoConRelaciones[])
      } catch (err) {
        if (active) {
          console.error('[useMedicos] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [sedeId, especialidadId])

  return { data, loading, error }
}
