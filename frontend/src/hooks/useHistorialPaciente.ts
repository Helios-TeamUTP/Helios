import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_HISTORIAL } from '../lib/columnas'
import type { HistorialClinico, Medico } from '../lib/types'

export interface HistorialConMedico extends HistorialClinico {
  medico?: Medico | null
}

/**
 * Hook para que el paciente vea SU propio historial clinico
 * (dolencia_principal + receta por visita), mas reciente primero.
 *
 * RLS: politica "paciente_lee_su_historial" en
 * database/migrations/001_historial_clinico.sql — el paciente solo
 * puede leer (SELECT) filas donde el es el paciente_id, via
 * auth_paciente_link. Garantizado a nivel de base de datos.
 *
 * @param pacienteId - ID del paciente autenticado (de useAuth.paciente.id)
 */
export function useHistorialPaciente(pacienteId: string | null) {
  const [data, setData] = useState<HistorialConMedico[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorial = useCallback(
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
          .from('historial_clinico')
          .select(`${COLUMNAS_HISTORIAL}, medico:medicos(*)`)
          .eq('paciente_id', pacienteId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (signal && !signal.active) return

        if (error) {
          setError(error.message)
        } else {
          setData((data ?? []) as unknown as HistorialConMedico[])
        }
      } catch (err) {
        if (!signal || signal.active) {
          console.error('[useHistorialPaciente] unexpected:', err)
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
    // fetchHistorial es async y solo llama setState tras chequear
    // signal.active (cancelado en el cleanup de abajo). Mismo patron
    // ya usado en useCitas.ts, useMedicoCitas.ts y usePacientesMedico.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchHistorial(signal)
    return () => {
      signal.active = false
    }
  }, [fetchHistorial])

  return { data, loading, error, refetch: () => fetchHistorial() }
}
