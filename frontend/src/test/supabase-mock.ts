import { vi } from 'vitest'

export interface MockTableConfig {
  data?: unknown
  error?: { message: string } | null
}

// Builder que devuelve un thenable encadenable: todos los metodos retornan this,
// salvo .then() / .maybeSingle() / .single() que resuelven con { data, error }.
export function createTableQuery({ data = [], error = null }: MockTableConfig = {}) {
  const result = { data, error }
  const builder: Record<string, unknown> = {}
  const passthroughMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'order',
    'limit',
    'range',
  ]
  for (const method of passthroughMethods) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: Array.isArray(data) ? data[0] ?? null : data, error }),
  )
  builder.single = vi.fn(() =>
    Promise.resolve({ data: Array.isArray(data) ? data[0] ?? null : data, error }),
  )
  builder.then = (resolve: (value: typeof result) => unknown) => resolve(result)
  return builder
}

export interface MockSupabase {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
  auth: {
    getSession: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }
}

export function createMockSupabase(tables: Record<string, MockTableConfig> = {}): MockSupabase {
  return {
    from: vi.fn((tableName: string) => createTableQuery(tables[tableName])),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      ),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  }
}
