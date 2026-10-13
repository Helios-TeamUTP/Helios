/**
 * Recuperación de contraseña — detección del enlace del correo.
 *
 * Cuando el usuario abre el enlace de "recuperar contraseña", Supabase lo
 * redirige a la app con los datos de sesión en el hash (`#...&type=recovery`)
 * y el SDK los consume y LIMPIA la URL poco después de crearse el cliente.
 * Si leyéramos la URL desde un componente, el hash ya no estaría.
 *
 * Por eso este módulo se importa PRIMERO en main.tsx (antes de lib/supabase):
 * captura el estado del enlace de forma síncrona y lo guarda en
 * sessionStorage, que sobrevive a un F5 en la misma pestaña.
 *
 * Sirve para distinguir un enlace de recuperación real de alguien que
 * simplemente escribe /restablecer-password en la barra de direcciones.
 */

/** Ruta a la que Supabase redirige desde el correo de recuperación. */
export const RUTA_RESTABLECER = '/restablecer-password'

const CLAVE_ESTADO = 'helios_recovery_estado'

export type EstadoEnlaceRecuperacion = 'valido' | 'expirado'

/**
 * Clasifica una URL entrante. Función pura (testeable sin navegador).
 * - `valido`: trae type=recovery en el hash (flujo implícito) o `?code=` en
 *   la ruta de restablecer (flujo PKCE).
 * - `expirado`: Supabase devolvió error otp_expired (enlace vencido o ya usado).
 * - `null`: no tiene nada que ver con recuperación.
 */
export function clasificarUrlRecuperacion(
  pathname: string,
  search: string,
  hash: string,
): EstadoEnlaceRecuperacion | null {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  if (hashParams.get('error_code') === 'otp_expired') return 'expirado'
  if (hashParams.get('type') === 'recovery') return 'valido'
  if (pathname === RUTA_RESTABLECER && new URLSearchParams(search).has('code')) {
    return 'valido'
  }
  return null
}

/**
 * Lee la URL actual, guarda el estado en sessionStorage y, si Supabase
 * aterrizó en otra ruta (p. ej. la URL no estaba en la lista de Redirect
 * URLs y cayó en "/"), mueve al usuario a /restablecer-password conservando
 * el hash para que el SDK siga pudiendo leer los tokens.
 */
export function capturarEnlaceRecuperacion(): void {
  if (typeof window === 'undefined') return
  const { pathname, search, hash } = window.location
  const estado = clasificarUrlRecuperacion(pathname, search, hash)
  if (!estado) return

  try {
    window.sessionStorage.setItem(CLAVE_ESTADO, estado)
  } catch {
    // sessionStorage no disponible (modo privado estricto): sin estado, la
    // página mostrará "enlace inválido" y el usuario podrá pedir otro.
  }

  if (pathname !== RUTA_RESTABLECER) {
    window.history.replaceState(null, '', `${RUTA_RESTABLECER}${search}${hash}`)
  }
}

/** Estado del enlace capturado en esta pestaña, o null si no hay. */
export function leerEstadoRecuperacion(): EstadoEnlaceRecuperacion | null {
  try {
    const valor = window.sessionStorage.getItem(CLAVE_ESTADO)
    return valor === 'valido' || valor === 'expirado' ? valor : null
  } catch {
    return null
  }
}

/** Borra el estado (al terminar el flujo con éxito). */
export function limpiarEstadoRecuperacion(): void {
  try {
    window.sessionStorage.removeItem(CLAVE_ESTADO)
  } catch {
    // nada que limpiar
  }
}

// Efecto al importar: debe ejecutarse antes de que se cree el cliente Supabase.
capturarEnlaceRecuperacion()
