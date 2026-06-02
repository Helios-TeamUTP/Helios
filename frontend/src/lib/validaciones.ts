/**
 * Validaciones de campos de formulario para HELIOS.
 *
 * Bug B-24: el registro NO validaba teléfono, nombre ni correo (más allá del
 * type=email de HTML). Esto permitía errores humanos: letras en el teléfono,
 * números en el nombre, correos malformados. Estas funciones bloquean esos
 * errores en el cliente. La validación de cédula vive en lib/cedula.ts.
 *
 * Todas son funciones puras (string -> boolean) para testearse fácil.
 */

/**
 * Valida un teléfono panameño.
 * Acepta: opcional prefijo internacional (+507 o 507), dígitos con espacios o
 * guiones como separadores. El número (sin prefijo ni separadores) debe tener
 * 7 dígitos (fijo) u 8 dígitos (móvil/celular, normalmente inicia en 6).
 * Rechaza: letras o símbolos distintos de + espacio y guion.
 *
 * Ejemplos válidos: "6000-0000", "60000000", "+507 6000 0000", "200-0000"
 */
export function validarTelefonoPanama(telefono: string): boolean {
  if (!telefono) return false
  const t = telefono.trim()
  // Solo se permiten dígitos, espacios, guiones y un '+' inicial opcional.
  if (!/^\+?[\d\s-]+$/.test(t)) return false
  // Quitar prefijo internacional (+507 o 507) y separadores.
  const soloDigitos = t
    .replace(/^\+?507/, '')
    .replace(/[\s-]/g, '')
  return /^\d{7,8}$/.test(soloDigitos)
}

/**
 * Valida un nombre de persona.
 * Acepta: letras (incluye acentos y ñ), espacios, apóstrofo, punto y guion.
 * Debe tener entre 2 y 80 caracteres y contener al menos una letra.
 * Rechaza: dígitos y símbolos (@, #, %, etc.).
 *
 * Ejemplos válidos: "Ana López", "José M. Brown-Guerrero", "O'Brien"
 */
export function validarNombre(nombre: string): boolean {
  if (!nombre) return false
  const n = nombre.trim()
  if (n.length < 2 || n.length > 80) return false
  // Solo letras (con acentos), espacios y los signos comunes de nombres.
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(n)) return false
  // Debe contener al menos una letra (no solo signos/espacios).
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(n)
}

/**
 * Valida un correo electrónico con un patrón estándar.
 * Refuerza el type=email de HTML (que algunos navegadores aplican laxo).
 * Rechaza espacios, doble @, y falta de dominio con punto.
 *
 * Ejemplos válidos: "ana@test.com", "jose.brown@gmail.com"
 */
export function validarEmail(correo: string): boolean {
  if (!correo) return false
  const c = correo.trim()
  if (c.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
}
