import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  /**
   * Token de version para prevenir race conditions cuando varias llamadas
   * a loadPaciente() estan en vuelo simultaneamente. Solo la respuesta
   * del authUid actual aplica setPaciente().
   *
   * Critico en app medica: sin esto, una respuesta tardia podria mostrar
   * datos del paciente anterior tras un cambio rapido de sesion.
   */
  const currentAuthUidRef = useRef<string | null>(null)

  /**
   * Carga el paciente vinculado al auth_uid.
   * Bug B-07 fix: try/catch garantiza que NUNCA propague excepcion al caller.
   * Race condition fix: ignora respuesta si el authUid actual cambio mientras
   * la query estaba en vuelo.
   */
  const loadPaciente = useCallback(async (authUid: string) => {
    currentAuthUidRef.current = authUid
    try {
      const { data: link, error: linkErr } = await supabase
        .from('auth_paciente_link')
        .select('paciente_id')
        .eq('auth_uid', authUid)
        .maybeSingle()

      // Respuesta tardia: el usuario ya cambio. Ignorar.
      if (currentAuthUidRef.current !== authUid) return

      if (linkErr) {
        console.error('[useAuth] loadPaciente link error:', linkErr.message)
        setPaciente(null)
        return
      }
      if (!link?.paciente_id) {
        setPaciente(null)
        return
      }

      const { data: pac, error: pacErr } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', link.paciente_id)
        .maybeSingle()

      // Verificar de nuevo: la segunda query tambien pudo tardar.
      if (currentAuthUidRef.current !== authUid) return

      if (pacErr) {
        console.error('[useAuth] loadPaciente paciente error:', pacErr.message)
        setPaciente(null)
        return
      }
      setPaciente(pac ?? null)
    } catch (err) {
      console.error('[useAuth] loadPaciente unexpected:', err)
      if (currentAuthUidRef.current === authUid) setPaciente(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    /**
     * Bug B-07 fix: try/catch/finally garantiza que setLoading(false)
     * SIEMPRE se ejecute, incluso si getSession() o loadPaciente() fallan.
     */
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session)
        if (data.session?.user) await loadPaciente(data.session.user.id)
      } catch (err) {
        console.error('[useAuth] init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()

    /**
     * Listener de cambios de auth. try/catch/finally garantiza loading=false.
     * Si llega una nueva sesion, ponemos loading=true mientras cargamos el
     * paciente para evitar que la UI vea un instante de "logueado sin paciente"
     * que dispararia redirects incorrectos a /registro.
     */
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)

      // Si la sesion cambia y hay usuario nuevo, indicamos loading
      // hasta que loadPaciente termine.
      const hasNewUser = !!newSession?.user
      if (hasNewUser) setLoading(true)
      else currentAuthUidRef.current = null

      try {
        if (hasNewUser) await loadPaciente(newSession.user.id)
        else setPaciente(null)
      } catch (err) {
        console.error('[useAuth] onAuthStateChange error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      currentAuthUidRef.current = null
      subscription.subscription.unsubscribe()
    }
  }, [loadPaciente])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[useAuth] signOut error:', err)
    } finally {
      // Defensa adicional: si el listener no se dispara por red caida,
      // limpiamos estado manualmente.
      currentAuthUidRef.current = null
      setSession(null)
      setPaciente(null)
    }
  }, [])

  const refreshPaciente = useCallback(async () => {
    if (session?.user) await loadPaciente(session.user.id)
    // Solo depende del user.id, no del session entero (evita re-renders
    // por cada token refresh).
  }, [session?.user?.id, loadPaciente])

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
