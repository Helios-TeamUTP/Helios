import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RUTA_RESTABLECER } from '../lib/recuperacionPassword'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Recuperar contraseña, paso 1: pedir el enlace por correo.
 *
 * Supabase responde igual exista o no el correo (no hay error para correos
 * desconocidos), así que la UI debe mostrar SIEMPRE un mensaje genérico en
 * caso de éxito para no revelar qué correos están registrados.
 *
 * Requisito de configuración: la URL `${origin}/restablecer-password` debe
 * estar en Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function useSolicitarRecuperacion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const solicitar = useCallback(async (correo: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(correo.trim(), {
          redirectTo: `${window.location.origin}${RUTA_RESTABLECER}`,
        }),
        AUTH_TIMEOUT_MS,
      )
      if (resetError) {
        if (resetError.status === 429 || resetError.code === 'over_email_send_rate_limit') {
          setError('Demasiados intentos. Espera unos minutos antes de pedir otro enlace.')
        } else {
          console.error('[useSolicitarRecuperacion] resetPasswordForEmail:', resetError.message)
          setError('No pudimos enviar el correo. Intenta de nuevo en unos minutos.')
        }
        return false
      }
      return true
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.')
      } else {
        console.error('[useSolicitarRecuperacion] unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { solicitar, loading, error, setError }
}
