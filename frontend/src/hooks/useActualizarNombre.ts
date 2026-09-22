import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Módulo 05 — Perfil (solo paciente), Acción 1: cambiar nombre.
 *
 * Actualiza únicamente `pacientes.nombre`. NUNCA manda otros campos en el
 * payload, aunque la policy RLS "paciente_actualiza_su_perfil" técnicamente
 * lo permitiría (RLS no filtra por columna — cedula/telefono/correo se
 * protegen aquí, en el cliente, no en la base de datos).
 *
 * Mismo patrón que useCancelarCita: withTimeout + try/catch/finally para
 * que `loading` nunca quede colgado (B-10).
 */
export function useActualizarNombre() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizarNombre = useCallback(
    async (pacienteId: string, nombre: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { error: updateError } = await withTimeout(
          supabase.from('pacientes').update({ nombre }).eq('id', pacienteId),
          AUTH_TIMEOUT_MS,
        )
        if (updateError) {
          setError(updateError.message)
          return false
        }
        return true
      } catch (err) {
        if (err instanceof TimeoutError) {
          setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
        } else {
          console.error('[useActualizarNombre] unexpected:', err)
          setError('Ocurrió un error inesperado al guardar. Intenta de nuevo.')
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { actualizarNombre, loading, error, setError }
}
