/**
 * RF-04 (recuperacion de contrasena): detectar que el usuario llego a la
 * app desde el enlace del correo de recuperacion.
 *
 * El enlace llega como `/restablecer#...&type=recovery` (con los datos de la sesion de recuperacion).
 * supabase-js consume y BORRA ese hash al crear el cliente, asi que hay que
 * anotarlo ANTES de crearlo (ver `lib/supabase.ts`). La marca vive en
 * sessionStorage: sobrevive a un F5 en la misma pestana y se borra al cerrarla.
 *
 * Sirve para que `/restablecer` solo se muestre a quien llego por un enlace
 * de recuperacion, no a cualquier usuario que ya tenia sesion iniciada.
 */
const CLAVE = 'helios.recuperacion'

export function marcarSiLlegaPorRecuperacion(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (params.get('type') !== 'recovery') return
  try {
    window.sessionStorage.setItem(CLAVE, '1')
  } catch {
    // almacenamiento bloqueado: sin marca, /restablecer mostrara "enlace invalido"
  }
}

export function llegoPorRecuperacion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

export function limpiarMarcaRecuperacion(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(CLAVE)
  } catch {
    // nada que limpiar
  }
}
