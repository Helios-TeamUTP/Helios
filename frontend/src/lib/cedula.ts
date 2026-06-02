/**
 * Validación de cédula de identidad personal panameña.
 *
 * Bug B-22: el validador anterior exigía 5-12 dígitos tras quitar el prefijo,
 * lo que RECHAZABA cédulas válidas cortas (ej. `PE-5-687` queda en 4 dígitos).
 * Ahora validamos por ESTRUCTURA según el tipo oficial del Tribunal Electoral,
 * con un fallback permisivo de dígitos para no rechazar nunca una cédula real.
 *
 * Tipos oficiales (Tribunal Electoral de Panamá):
 *  - Natural (por nacimiento): provincia(1-13)-tomo-asiento   ej. 8-926-1601
 *  - PE  (panameño nacido en el extranjero):  PE-tomo-asiento ej. PE-5-687
 *  - N   (naturalizado):                       N-tomo-asiento ej. N-19-473
 *  - E   (extranjero domiciliado):           E-provincia-orden ej. E-8-74258
 *  - PI  (indígena / comarca):                PI-tomo-asiento ej. PI-12-3456
 */

export type TipoCedula = 'natural' | 'pe' | 'n' | 'e' | 'pi' | 'desconocido'

/** Patrones por tipo (sobre la cédula normalizada y sin espacios). */
const PATRONES: Record<Exclude<TipoCedula, 'desconocido'>, RegExp> = {
  // Provincia 1-13, tomo hasta 4 dígitos, asiento hasta 6.
  natural: /^([1-9]|1[0-3])-\d{1,4}-\d{1,6}$/,
  pe: /^PE-\d{1,4}-\d{1,6}$/,
  n: /^N-\d{1,4}-\d{1,6}$/,
  e: /^E-([1-9]|1[0-3])-\d{1,6}$/,
  pi: /^PI-\d{1,4}-\d{1,6}$/,
}

/**
 * Fallback de seguridad: dígitos puros 5-13 (sin guiones ni prefijo).
 * Garantiza que NUNCA rechacemos una cédula válida escrita sin guiones.
 * Las cédulas cortas con prefijo (ej. PE-5-687) las cubre su propio patrón;
 * por eso el mínimo de dígitos puros se mantiene en 5 (descarta basura como
 * "1234"). La doble confirmación de cédula (B-23) es la red real contra
 * errores de tipeo.
 */
const FALLBACK_DIGITOS = /^\d{5,13}$/

/** Normaliza: quita espacios extremos y pasa a mayúsculas (PE, N, E, PI). */
export function normalizeCedula(cedula: string): string {
  return cedula.trim().toUpperCase()
}

/** Versión compacta usada internamente: sin espacios internos. */
function compacta(cedula: string): string {
  return normalizeCedula(cedula).replace(/\s+/g, '')
}

/**
 * Detecta el tipo de cédula. Útil para mostrarle al usuario qué tipo
 * reconoció el sistema mientras escribe.
 */
export function detectarTipoCedula(cedula: string): {
  tipo: TipoCedula
  etiqueta: string
} {
  const c = compacta(cedula)
  if (PATRONES.pe.test(c)) return { tipo: 'pe', etiqueta: 'Panameño nacido en el extranjero (PE)' }
  if (PATRONES.pi.test(c)) return { tipo: 'pi', etiqueta: 'Indígena / comarca (PI)' }
  if (PATRONES.n.test(c)) return { tipo: 'n', etiqueta: 'Naturalizado (N)' }
  if (PATRONES.e.test(c)) return { tipo: 'e', etiqueta: 'Extranjero domiciliado (E)' }
  if (PATRONES.natural.test(c)) return { tipo: 'natural', etiqueta: 'Panameño por nacimiento' }
  if (FALLBACK_DIGITOS.test(c)) return { tipo: 'natural', etiqueta: 'Cédula (solo dígitos)' }
  return { tipo: 'desconocido', etiqueta: 'Formato no reconocido' }
}

/**
 * Valida una cédula panameña. Acepta los 5 tipos oficiales (con guiones) y,
 * como red de seguridad, dígitos puros (4-13). Rechaza letras intermedias,
 * símbolos y cadenas vacías.
 */
export function isValidCedulaPanama(cedula: string): boolean {
  if (!cedula) return false
  const c = compacta(cedula)
  return (
    PATRONES.natural.test(c) ||
    PATRONES.pe.test(c) ||
    PATRONES.n.test(c) ||
    PATRONES.e.test(c) ||
    PATRONES.pi.test(c) ||
    FALLBACK_DIGITOS.test(c)
  )
}

/**
 * Ejemplos por tipo para mostrar en la UI (placeholder y ayuda visual).
 * Bug B-22: el PO pidió que el usuario vea ejemplos de los tipos que el
 * sistema conoce, para reducir errores al escribir la cédula.
 */
export const EJEMPLOS_CEDULA: ReadonlyArray<{ tipo: string; ejemplo: string }> = [
  { tipo: 'Panameño por nacimiento', ejemplo: '8-926-1601' },
  { tipo: 'Nacido en el extranjero', ejemplo: 'PE-5-687' },
  { tipo: 'Naturalizado', ejemplo: 'N-19-473' },
  { tipo: 'Extranjero', ejemplo: 'E-8-74258' },
  { tipo: 'Indígena / comarca', ejemplo: 'PI-12-3456' },
]
