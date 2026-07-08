import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface NuevoHistorialClinico {
  citaId: string
  pacienteId: string
  medicoId: string
  dolenciaPrincipal: string
  receta: string | null
  notasClinicas: string | null
}

/**
 * Hook para que el medico registre dolencia_principal + receta al
 * completar una cita.
 *
 * Ver database/migrations/001_historial_clinico.sql para el esquema
 * y las politicas RLS: el medico solo puede insertar en citas donde
 * el ES el medico_id (verificado via auth_medico_link), garantizado
 * a nivel de base de datos, no solo en el frontend.
 */
export function useHistorialClinico() {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const crearHistorial = useCallback(async (input: NuevoHistorialClinico) => {
    setGuardando(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('historial_clinico').insert({
        cita_id: input.citaId,
        paciente_id: input.pacienteId,
        medico_id: input.medicoId,
        dolencia_principal: input.dolenciaPrincipal,
        receta: input.receta,
        notas_clinicas: input.notasClinicas,
      })
      if (insertError) throw insertError
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      throw err
    } finally {
      setGuardando(false)
    }
  }, [])

  return { crearHistorial, guardando, error, setError }
}
