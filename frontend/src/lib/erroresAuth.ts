/**
 * CU-01 / CU-02: traduce los errores de Supabase Auth (en inglés) a los
 * mensajes del documento de casos de uso. Antes el usuario veía textos como
 * "Invalid login credentials" o "User already registered".
 *
 * Importante (CA-02-01): las credenciales inválidas NUNCA indican cuál campo
 * falló (correo o contraseña), por seguridad.
 *
 * Los mensajes que no reconocemos NO se muestran crudos: se usa `fallback`,
 * porque casi siempre son técnicos y en inglés.
 */

export const MSG_CREDENCIALES = 'Correo o contraseña incorrectos.'
export const MSG_CORREO_EXISTENTE = 'Ya existe una cuenta con este correo. Inicia sesión.'
export const MSG_CORREO_SIN_CONFIRMAR =
  'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
export const MSG_DEMASIADOS_INTENTOS =
  'Demasiados intentos. Espera unos minutos e intenta de nuevo.'

interface ErrorAuthLike {
  message?: string
  code?: string
  status?: number
}

export function traducirErrorAuth(error: ErrorAuthLike, fallback: string): string {
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
    return MSG_CREDENCIALES
  }
  if (code === 'user_already_exists' || /user already registered/i.test(msg)) {
    return MSG_CORREO_EXISTENTE
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return MSG_CORREO_SIN_CONFIRMAR
  }
  if (
    error.status === 429 ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    /rate limit/i.test(msg)
  ) {
    return MSG_DEMASIADOS_INTENTOS
  }
  return fallback
}
