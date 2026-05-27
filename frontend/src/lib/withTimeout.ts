/**
 * Error lanzado cuando una promesa excede su tiempo de espera.
 * Subclase de Error para identificarlo con instanceof en los catch.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`La operación excedió ${ms}ms de espera`)
    this.name = 'TimeoutError'
  }
}

/**
 * Envuelve una promesa (o thenable) con un timeout. Si `promise` no
 * resuelve en `ms` milisegundos, rechaza con TimeoutError.
 *
 * Bug B-10 fix: usado en handlers de Login y Register para evitar que
 * un Supabase lento deje el spinner girando eternamente. El bug B-07
 * arregló useAuth pero los formularios tienen handlers propios que
 * llaman a Supabase directamente.
 *
 * Acepta PromiseLike<T> para soportar los query builders de Supabase
 * (PostgrestBuilder) que son thenables pero no Promise puras.
 *
 * NOTA: No aborta la operación subyacente (no cancela la HTTP request).
 * Solo libera al caller para mostrar error al usuario. La promesa original
 * puede seguir corriendo en background; Supabase JS la deja morir sola.
 * Si en Sprint 2 hace falta cancelar la request real, agregar
 * AbortController vía fetch global en supabase.ts.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(ms)), ms),
    ),
  ])
}

/** Timeout estándar para operaciones de auth en HELIOS (15 segundos). */
export const AUTH_TIMEOUT_MS = 15_000
