import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Paciente } from '../lib/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  paciente: Paciente | null
  loading: boolean
  signOut: () => Promise<void>
  refreshPaciente: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPaciente = useCallback(async (authUid: string) => {
    const { data: link } = await supabase
      .from('auth_paciente_link')
      .select('paciente_id')
      .eq('auth_uid', authUid)
      .maybeSingle()

    if (!link?.paciente_id) {
      setPaciente(null)
      return
    }
    const { data: pac } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', link.paciente_id)
      .maybeSingle()
    setPaciente(pac ?? null)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) await loadPaciente(data.session.user.id)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) await loadPaciente(newSession.user.id)
      else setPaciente(null)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [loadPaciente])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setPaciente(null)
  }, [])

  const refreshPaciente = useCallback(async () => {
    if (session?.user) await loadPaciente(session.user.id)
  }, [session, loadPaciente])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      paciente,
      loading,
      signOut,
      refreshPaciente,
    }),
    [session, paciente, loading, signOut, refreshPaciente],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
