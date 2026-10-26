/**
 * Largo mínimo de contraseña para TODOS los flujos de HELIOS: registro,
 * recuperar contraseña (RF-04) y cambiar contraseña desde Mi perfil (Módulo 05).
 *
 * Una sola constante para que los tres flujos no se desalineen. Debe ser
 * igual o mayor que el mínimo configurado en Supabase (Authentication →
 * Policies); si algún día se sube allá, súbela también aquí.
 */
export const PASSWORD_MIN_LENGTH = 6
