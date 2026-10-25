import { EJEMPLOS_CEDULA, isValidCedulaPanama, normalizeCedula } from './cedula'
import { validarEmail, validarNombre, validarTelefonoPanama } from './validaciones'

/** Campos del formulario de registro de paciente. */
export interface RegistroForm {
  nombre: string
  cedula: string
  cedulaConfirm: string // B-23: doble confirmación de cédula
  telefono: string
  correo: string
  password: string
  passwordConfirm: string // B-23: doble confirmación de contraseña
}

/** Texto de ejemplos de cédula para la ayuda visual (B-22). */
export const EJEMPLOS_TEXTO = EJEMPLOS_CEDULA.map((e) => e.ejemplo).join('  ·  ')

// CU-01 flujo 2.3.1 / CA-01-01: ningún campo obligatorio puede ir vacío. El
// teléfono es opcional. El orden es el de la validación (el primero vacío gana).
const OBLIGATORIOS: ReadonlyArray<readonly [keyof RegistroForm, string]> = [
  ['nombre', 'nombre completo'],
  ['cedula', 'cédula'],
  ['cedulaConfirm', 'confirmar cédula'],
  ['correo', 'correo electrónico'],
  ['password', 'contraseña'],
  ['passwordConfirm', 'confirmar contraseña'],
]

/**
 * Valida el formulario de registro. Devuelve el mensaje del PRIMER error
 * encontrado (el orden de las reglas es parte del comportamiento) o null si
 * el formulario es válido. Función pura: no toca la red ni el estado de React.
 */
export function validarRegistro(form: RegistroForm): string | null {
  const faltante = OBLIGATORIOS.find(([campo]) => !form[campo].trim())
  if (faltante) return `Debe completar ${faltante[1]} para continuar.`

  // B-24: validación de nombre (solo letras, espacios y signos de nombre).
  if (!validarNombre(form.nombre)) {
    return 'Nombre inválido. Usa solo letras, espacios, apóstrofo o guion (2-80 caracteres).'
  }

  // B-22: validación de cédula (acepta los 5 tipos panameños).
  const cedulaNorm = normalizeCedula(form.cedula)
  if (!isValidCedulaPanama(cedulaNorm)) {
    return `El formato de la cédula no es válido. Ejemplos válidos: ${EJEMPLOS_TEXTO}.`
  }

  // B-23: la cédula y su confirmación deben coincidir (evita errores de tipeo).
  if (normalizeCedula(form.cedulaConfirm) !== cedulaNorm) {
    return 'La cédula no coincide con la confirmación. Verifica que las escribiste igual.'
  }

  // B-24: teléfono es opcional, pero si se ingresa debe ser válido.
  if (form.telefono.trim() && !validarTelefonoPanama(form.telefono)) {
    return 'Ingresa un número de teléfono válido. Usa solo números (ej: 6000-0000 o +507 6000 0000).'
  }

  // B-24: correo con formato válido (refuerza el type=email).
  if (!validarEmail(form.correo)) {
    return 'Correo electrónico inválido. Revisa el formato (ej: nombre@correo.com).'
  }

  // Contraseña: mínimo 6 caracteres y debe coincidir con su confirmación.
  if (form.password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  // B-23: doble confirmación de contraseña.
  if (form.password !== form.passwordConfirm) {
    return 'La contraseña no coincide con la confirmación. Verifica que las escribiste igual.'
  }

  return null
}
