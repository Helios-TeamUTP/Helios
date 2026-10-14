import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { traducirErrorCita } from '../lib/erroresCita'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Sprint 2 (ST-38 / HELL-38): reprogramar una cita a otro horario disponible
 * del MISMO médico.
 *
 * Llama a la RPC SECURITY DEFINER `reprogramar_cita_atomica`, que valida dueño
 * + disponibilidad del nuevo horario + mismo médico, libera el horario viejo y
 * reserva el nuevo — todo atómico (locks FOR UPDATE evitan que dos pacientes
 * tomen el mismo slot).
 *
 * Patrón B-10: withTimeout + try/catch/finally.
 *
 * @returns reprogramar(citaId, nuevoHorarioId) -> Promise<boolean>, loading, error
 */
export function useReprogramarCita() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reprogramar = useCallback(
    async (citaId: string, nuevoHorarioId: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { error: rpcError } = await withTimeout(
          supabase.rpc('reprogramar_cita_atomica', {
            p_cita_id: citaId,
            p_nuevo_horario_id: nuevoHorarioId,
          }),
          AUTH_TIMEOUT_MS,
        )
        if (rpcError) {
          setError(traducirErrorCita(rpcError.message)) // RAISE EXCEPTION → texto del documento de CU
          return false
        }
        return true
      } catch (err) {
        if (err instanceof TimeoutError) {
          setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
        } else {
          console.error('[useReprogramarCita] unexpected:', err)
          setError('Ocurrió un error inesperado al reprogramar. Intenta de nuevo.')
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { reprogramar, loading, error, setError }
}
