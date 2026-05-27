import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia frontend/.env.example a frontend/.env.local y completa los valores.',
  )
}

/**
 * Cliente Supabase compartido para toda la app HELIOS.
 *
 * Cliente sin tipado generico para Sprint 1. Sprint 2 endurecera con
 * codegen via `supabase gen types typescript`.
 *
 * Bug B-09 fix: Por defecto, Supabase JS SDK usa localStorage que
 * persiste sesion indefinidamente. Esto es un riesgo de seguridad para
 * una app medica (si pierdes la laptop, el siguiente que la abra entra
 * con tu sesion). Usamos sessionStorage para que cerrar la pestaña/browser
 * borre la sesion automaticamente.
 *
 * Comportamiento resultante:
 * - Cerrar tab/browser → sesion se borra → proxima visita pide login
 * - F5 en la misma tab → mantiene sesion (UX aceptable)
 * - Cada tab tiene su propia sesion independiente (mas seguro)
 *
 * Para volver a localStorage (UX más permisiva), cambiar storage a
 * window.localStorage. Para deshabilitar persistencia totalmente,
 * persistSession: false.
 */
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
})
