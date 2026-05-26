import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Especialidad } from '../lib/types'

export function useEspecialidades() {
  const [data, setData] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('especialidades')
      .select('*')
      .order('nombre')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setData(data ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}
