import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sede } from '../lib/types'

export function useSedes() {
  const [data, setData] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('sedes')
      .select('*')
      .eq('activo', true)
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
