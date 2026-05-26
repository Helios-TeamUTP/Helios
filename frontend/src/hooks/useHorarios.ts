import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Horario } from '../lib/types'

export function useHorarios(medicoId: string | null) {
  const [data, setData] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!medicoId) {
      setData([])
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    const hoy = new Date().toISOString().slice(0, 10)
    supabase
      .from('horarios')
      .select('*')
      .eq('medico_id', medicoId)
      .eq('disponible', true)
      .gte('fecha', hoy)
      .order('fecha')
      .order('hora_inicio')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setData(data ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [medicoId])

  return { data, loading, error }
}
