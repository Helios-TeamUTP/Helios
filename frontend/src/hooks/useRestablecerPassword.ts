import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Recuperar contraseña, paso 2: fijar la contraseña nueva.
 *
 * Se llama con la sesión temporal que Supabase crea al abrir el enlace del
 * correo, por eso no pide la contraseña actual (el usuario la olvidó).
 *
 * `cerrarSesiones` es un paso aparte a propósito: la página marca el flujo
 * como completado ANTES de cerrar la sesión, para que no parpadee la pantalla
 * de "enlace inválido" cuando la sesión desaparece.
 */
export function useRestablecerPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restablecer = useCallback(async (passwordNuevo: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password: passwordNuevo }),
        AUTH_TIMEOUT_MS,
      )
      if (updateError) {
        if (updateError.code === 'same_password') {
          setError('La contraseña nueva debe ser distinta a la anterior.')
        } else if (updateError.code === 'weak_password') {
          setError(
            'La contraseña es demasiado débil. Usa una más larga o combina letras, números y símbolos.',
          )
        } else if (updateError.name === 'AuthSessionMissingError') {
          setError('Tu enlace expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".')
        } else {
          console.error('[useRestablecerPassword] updateUser:', updateError.message)
          setError('No pudimos actualizar la contraseña. Intenta de nuevo.')
        }
        return false
      }
      return true
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
      } else {
        console.error('[useRestablecerPassword] unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cierra la sesión en TODOS los dispositivos (scope global). Si alguien
   * tenía la cuenta abierta con la contraseña vieja, queda fuera. Si falla
   * no bloquea: la contraseña ya cambió.
   */
  const cerrarSesiones = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (err) {
      console.warn('[useRestablecerPassword] no se pudo cerrar sesión global:', err)
    }
  }, [])

  return { restablecer, cerrarSesiones, loading, error, setError }
}
