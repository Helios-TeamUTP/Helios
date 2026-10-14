import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { traducirErrorCita } from '../lib/erroresCita'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Sprint 2 (ST-37 / HELL-37): cancelar una cita del paciente.
 *
 * Llama a la RPC SECURITY DEFINER `cancelar_cita_atomica`, que valida que el
 * caller sea el dueño del paciente, cambia estado a 'cancelada' y libera el
 * horario — todo atómico en la BD. El frontend no toca la tabla directamente
 * (RLS no permite UPDATE de citas al paciente; solo vía esta RPC controlada).
 *
 * Patrón B-10: withTimeout + try/catch/finally garantiza que `loading` nunca
 * quede colgado y que el error se muestre claro al usuario.
 *
 * @returns cancelar(citaId) -> Promise<boolean> (true si se canceló), loading, error
 */
export function useCancelarCita() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelar = useCallback(async (citaId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { error: rpcError } = await withTimeout(
        supabase.rpc('cancelar_cita_atomica', { p_cita_id: citaId }),
        AUTH_TIMEOUT_MS,
      )
      if (rpcError) {
        // El mensaje viene de RAISE EXCEPTION; se traduce al texto del documento
        // de casos de uso (CU-03 2.3.6 si la cita ya no está disponible).
        setError(traducirErrorCita(rpcError.message))
        return false
      }
      return true
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
      } else {
        console.error('[useCancelarCita] unexpected:', err)
        setError('Ocurrió un error inesperado al cancelar. Intenta de nuevo.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { cancelar, loading, error, setError }
}
