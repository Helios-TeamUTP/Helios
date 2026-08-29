import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Fix CI: src/lib/supabase.ts lanza un error al importarse si faltan
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Localmente esto no se nota
// porque frontend/.env.local tiene credenciales reales (Vite las carga
// tambien en modo test), pero en GitHub Actions ese archivo no existe
// (correctamente, nunca se commitea un .env.local con secretos reales).
// Sin este stub, CUALQUIER test que importe (aunque sea indirectamente)
// algo de src/lib/supabase.ts truena al importarse, antes de correr un
// solo test — asi fallaban useHorarios.test.ts y MisCitas.test.tsx en CI.
//
// Valores de relleno: ningun test real deberia hacer una llamada de red
// de verdad contra esta URL (eso se cubre con vi.mock('../lib/supabase')
// en los tests que si ejercitan llamadas a Supabase). Esto solo evita que
// el modulo truene al importarse.
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-ci.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-solo-para-ci')

afterEach(() => {
  cleanup()
})
