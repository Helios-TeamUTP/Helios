/**
 * Validación de cédula de identidad personal panameña — versión ESTRICTA.
 *
 * Formato oficial (Tribunal Electoral de Panamá):  [TIPO]-[TOMO]-[ASIENTO]
 *
 *  | Tipo                  | Prefijo                | Ejemplo     |
 *  |-----------------------|------------------------|-------------|
 *  | Provincial            | número de provincia    | 8-123-4567  |
 *  | Naturalizado          | N                      | N-12-34567  |
 *  | Extranjero residente  | E                      | E-8-123456  |
 *  | Permiso especial      | PE                     | PE-4-12345  |
 *  | Indígena / comarca    | PI                     | PI-12-3456  |
 *
 * Reglas por componente:
 *  - Provincia: 1 a 99 (1-13 hoy; hasta 99 para futuras provincias/comarcas),
 *    sin cero a la izquierda.
 *  - Tomo: 1 a 4 dígitos, no puede ser 0.
 *  - Asiento: 1 a 7 dígitos, no puede ser 0.
 *  - Separador siempre guion `-`, sin espacios.
 *  - Las letras N, E, PE, PI deben ir en MAYÚSCULAS.
 *
 * Corrige BUG-01: el validador anterior aceptaba cualquier secuencia de 5-12
 * dígitos ("12345", "00000", "999999999999") como válida. Ahora se exige la
 * estructura completa.
 */

/**
 * Regex oficial de la cédula panameña — desglose de cada parte:
 *
 *   ^                          inicio de la cadena
 *   (?: [1-9]\d? | N | E | PE | PI )  TIPO (una de cinco opciones):
 *        [1-9]\d?              · provincia 1-99 (sin cero inicial: "1".."99")
 *        N                     · naturalizado
 *        E                     · extranjero residente
 *        PE                    · permiso especial
 *        PI                    · indígena / comarca
 *   -                          separador (guion, sin espacios)
 *   [1-9]\d{0,3}               TOMO: 1 a 4 dígitos, sin cero inicial → nunca 0
 *   -                          separador
 *   [1-9]\d{0,6}               ASIENTO: 1 a 7 dígitos, sin cero inicial → nunca 0
 *   $                          fin de la cadena
 *
 * Es case-sensitive a propósito: N, E, PE, PI deben venir en MAYÚSCULAS.
 */
export const CEDULA_REGEX = /^(?:[1-9]\d?|N|E|PE|PI)-[1-9]\d{0,3}-[1-9]\d{0,6}$/

/**
 * Valida una cédula panameña por su ESTRUCTURA completa. No normaliza el
 * texto: espera la cédula ya en mayúsculas y sin espacios (usar
 * `normalizeCedula` antes si hace falta). Rechaza dígitos sueltos, letras
 * minúsculas, espacios, valores 0 y provincias > 99.
 */
export function isValidCedulaPanama(cedula: string): boolean {
  return CEDULA_REGEX.test(cedula)
}

/** Normaliza: quita espacios extremos y pasa a mayúsculas (N, E, PE). */
export function normalizeCedula(cedula: string): string {
  return cedula.trim().toUpperCase()
}

/**
 * Devuelve el tipo de una cédula válida, o 'invalida' si no cumple el formato.
 * Útil para etiquetar la cédula del usuario o ramificar lógica por tipo.
 */
export function tipoCedula(
  cedula: string,
): 'provincial' | 'naturalizado' | 'extranjero' | 'permiso-especial' | 'indigena' | 'invalida' {
  if (!isValidCedulaPanama(cedula)) return 'invalida'
  if (cedula.startsWith('PE-')) return 'permiso-especial'
  if (cedula.startsWith('PI-')) return 'indigena'
  if (cedula.startsWith('N-')) return 'naturalizado'
  if (cedula.startsWith('E-')) return 'extranjero'
  return 'provincial' // empieza con dígito de provincia
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers de UI (usados por Register.tsx). Se mantienen para no romper el form;
// se apoyan en el validador estricto de arriba.
// ───────────────────────────────────────────────────────────────────────────

export type TipoCedula = 'natural' | 'n' | 'e' | 'pe' | 'pi' | 'desconocido'

/**
 * Detecta el tipo de cédula para mostrarlo en vivo mientras el usuario escribe.
 * Normaliza primero (acepta minúsculas y espacios extremos) y luego clasifica
 * con el validador estricto. Devuelve 'desconocido' si el formato no es válido.
 */
export function detectarTipoCedula(cedula: string): {
  tipo: TipoCedula
  etiqueta: string
} {
  const t = tipoCedula(normalizeCedula(cedula))
  switch (t) {
    case 'provincial':
      return { tipo: 'natural', etiqueta: 'Panameño por nacimiento' }
    case 'naturalizado':
      return { tipo: 'n', etiqueta: 'Naturalizado (N)' }
    case 'extranjero':
      return { tipo: 'e', etiqueta: 'Extranjero residente (E)' }
    case 'permiso-especial':
      return { tipo: 'pe', etiqueta: 'Permiso especial (PE)' }
    case 'indigena':
      return { tipo: 'pi', etiqueta: 'Indígena / comarca (PI)' }
    default:
      return { tipo: 'desconocido', etiqueta: 'Formato no reconocido' }
  }
}

/** Ejemplos por tipo para mostrar en la UI (placeholder y ayuda visual). */
export const EJEMPLOS_CEDULA: ReadonlyArray<{ tipo: string; ejemplo: string }> = [
  { tipo: 'Provincial', ejemplo: '8-123-4567' },
  { tipo: 'Naturalizado', ejemplo: 'N-19-473' },
  { tipo: 'Extranjero residente', ejemplo: 'E-8-74258' },
  { tipo: 'Permiso especial', ejemplo: 'PE-5-687' },
  { tipo: 'Indígena / comarca', ejemplo: 'PI-12-3456' },
]
