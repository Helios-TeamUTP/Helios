import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

type TablaConNombre = 'pacientes' | 'medicos'

/**
 * Lógica compartida entre useActualizarNombre (paciente) y
 * useActualizarNombreMedico (médico) — antes estaba duplicada en los dos
 * archivos y SonarCloud lo marcó (6.5% duplicación en código nuevo,
 * Quality Gate exige ≤3%). Actualiza únicamente `{tabla}.nombre`.
 */
export function useActualizarNombreEntidad(tabla: TablaConNombre) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizarNombre = useCallback(
    async (id: string, nombre: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { error: updateError } = await withTimeout(
          supabase.from(tabla).update({ nombre }).eq('id', id),
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
          console.error(`[useActualizarNombreEntidad:${tabla}] unexpected:`, err)
          setError('Ocurrió un error inesperado al guardar. Intenta de nuevo.')
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [tabla],
  )

  return { actualizarNombre, loading, error, setError }
}
