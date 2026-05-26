import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MedicoConRelaciones } from '../lib/types'

export function useMedicos(sedeId: string | null, especialidadId: string | null) {
  const [data, setData] = useState<MedicoConRelaciones[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sedeId || !especialidadId) {
      setData([])
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    supabase
      .from('medicos')
      .select('*, especialidad:especialidades(*), sede:sedes(*)')
      .eq('sede_id', sedeId)
      .eq('especialidad_id', especialidadId)
      .eq('activo', true)
      .order('nombre')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setData((data ?? []) as unknown as MedicoConRelaciones[])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [sedeId, especialidadId])

  return { data, loading, error }
}
