import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CitaConRelaciones } from '../lib/types'

export function useCitas(pacienteId: string | null) {
  const [data, setData] = useState<CitaConRelaciones[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    if (!pacienteId) {
      setData([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('citas')
      .select(
        '*, horario:horarios(*), medico:medicos(*, especialidad:especialidades(*)), sede:sedes(*)',
      )
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setData((data ?? []) as unknown as CitaConRelaciones[])
    setLoading(false)
  }, [pacienteId])

  useEffect(() => {
    fetchCitas()
  }, [fetchCitas])

  return { data, loading, error, refetch: fetchCitas }
}
