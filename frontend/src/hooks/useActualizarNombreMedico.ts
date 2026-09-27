import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Extensión del Módulo 05 — Perfil, para médico.
 *
 * A diferencia de useActualizarNombre (pacientes), el alcance del médico
 * es intencionalmente más chico: SOLO nombre, nunca correo ni password
 * desde este módulo. Actualiza únicamente `medicos.nombre`.
 */
export function useActualizarNombreMedico() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizarNombreMedico = useCallback(
    async (medicoId: string, nombre: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { error: updateError } = await withTimeout(
          supabase.from('medicos').update({ nombre }).eq('id', medicoId),
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
          console.error('[useActualizarNombreMedico] unexpected:', err)
          setError('Ocurrió un error inesperado al guardar. Intenta de nuevo.')
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { actualizarNombreMedico, loading, error, setError }
}
