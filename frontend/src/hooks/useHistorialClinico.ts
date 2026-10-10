import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface CompletarCitaInput {
  citaId: string
  dolenciaPrincipal: string
  receta: string | null
  notasClinicas: string | null
}

/**
 * Completa una cita y registra su informacion clinica en UNA sola operacion
 * atomica (RPC `completar_cita_con_historial`, B-35).
 *
 * Antes eran dos llamadas (insert historial + update de la cita): si la
 * segunda fallaba quedaba un historial huerfano y el reintento chocaba con
 * el indice unico por cita. Ahora la BD valida y guarda todo o nada:
 *  - la cita debe ser del medico autenticado y estar "confirmada"
 *  - la dolencia principal es obligatoria (receta y notas son opcionales)
 *  - la nota del medico se guarda en su propia tabla privada
 */
export function useHistorialClinico() {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completarCita = useCallback(async (input: CompletarCitaInput) => {
    setGuardando(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('completar_cita_con_historial', {
        p_cita_id: input.citaId,
        p_dolencia: input.dolenciaPrincipal,
        p_receta: input.receta,
        p_notas: input.notasClinicas,
      })
      if (rpcError) throw rpcError
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : ((err as { message?: string } | null)?.message ?? 'Error desconocido')
      setError(msg)
      throw new Error(msg, { cause: err })
    } finally {
      setGuardando(false)
    }
  }, [])

  return { completarCita, guardando, error, setError }
}
