import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Módulo 05 — Perfil (solo paciente), Acción 3: cambiar contraseña.
 *
 * Reautentica con signInWithPassword ANTES de permitir el cambio — sin
 * esto, updateUser() solo no pide la contraseña actual, y cualquiera que
 * deje la sesión abierta en un computador público podría secuestrar la
 * cuenta con solo saber la contraseña nueva que quiere poner.
 *
 * Al terminar, intenta cerrar sesión en otros dispositivos
 * (`scope: 'others'`). Si el plan de Supabase no lo soporta, no bloquea el
 * flujo — el password ya quedó cambiado correctamente, solo no se pudo
 * forzar el cierre de otras sesiones.
 */
export function useCambiarPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiarPassword = useCallback(
    async (
      correoActual: string,
      passwordActual: string,
      passwordNuevo: string,
    ): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { error: authError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: correoActual,
            password: passwordActual,
          }),
          AUTH_TIMEOUT_MS,
        )
        if (authError) {
          setError('Contraseña actual incorrecta')
          return false
        }

        const { error: updateError } = await withTimeout(
          supabase.auth.updateUser({ password: passwordNuevo }),
          AUTH_TIMEOUT_MS,
        )
        if (updateError) {
          setError(updateError.message)
          return false
        }

        try {
          await supabase.auth.signOut({ scope: 'others' })
        } catch (err) {
          console.warn('[useCambiarPassword] no se pudo cerrar sesión en otros dispositivos:', err)
        }

        return true
      } catch (err) {
        if (err instanceof TimeoutError) {
          setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
        } else {
          console.error('[useCambiarPassword] unexpected:', err)
          setError('Ocurrió un error inesperado al cambiar la contraseña. Intenta de nuevo.')
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { cambiarPassword, loading, error, setError }
}
