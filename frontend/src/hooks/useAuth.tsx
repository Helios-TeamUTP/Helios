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
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

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
   * Bug B-11 fix: cada query envuelta con withTimeout(AUTH_TIMEOUT_MS) para
   * que un Supabase colgado no atasque el loading=true del caller (causaba
   * "Verificando sesion..." eterno tras F5 en /mis-citas).
   */
  const loadPaciente = useCallback(async (authUid: string) => {
    currentAuthUidRef.current = authUid
    try {
      const { data: link, error: linkErr } = await withTimeout(
        supabase
          .from('auth_paciente_link')
          .select('paciente_id')
          .eq('auth_uid', authUid)
          .maybeSingle(),
        AUTH_TIMEOUT_MS,
      )

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

      const { data: pac, error: pacErr } = await withTimeout(
        supabase
          .from('pacientes')
          .select('*')
          .eq('id', link.paciente_id)
          .maybeSingle(),
        AUTH_TIMEOUT_MS,
      )

      // Verificar de nuevo: la segunda query tambien pudo tardar.
      if (currentAuthUidRef.current !== authUid) return

      if (pacErr) {
        console.error('[useAuth] loadPaciente paciente error:', pacErr.message)
        setPaciente(null)
        return
      }
      setPaciente(pac ?? null)
    } catch (err) {
      if (err instanceof TimeoutError) {
        console.error('[useAuth] loadPaciente timeout — UI continua sin paciente')
      } else {
        console.error('[useAuth] loadPaciente unexpected:', err)
      }
      if (currentAuthUidRef.current === authUid) setPaciente(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    /**
     * Bug B-07 fix: try/catch/finally garantiza que setLoading(false)
     * SIEMPRE se ejecute, incluso si getSession() o loadPaciente() fallan.
     * Bug B-11 fix: getSession() envuelto con withTimeout para que un
     * Supabase colgado nunca atasque el init (el spinner "Verificando
     * sesion..." quedaba eterno tras F5 si la red estaba mal).
     */
    const init = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS)
        if (!mounted) return
        setSession(data.session)
        if (data.session?.user) await loadPaciente(data.session.user.id)
      } catch (err) {
        if (err instanceof TimeoutError) {
          console.error('[useAuth] init timeout — UI continua sin sesion')
        } else {
          console.error('[useAuth] init error:', err)
        }
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
     *
     * Bug B-11 fix: discriminamos por evento. TOKEN_REFRESHED y USER_UPDATED
     * ocurren periodicamente (Supabase refresca el JWT cada 5-60 min) y NO
     * cambian el usuario. Si recargaramos paciente en cada uno, el spinner
     * "Verificando sesion..." se mostraria al navegar/refrescar; ademas si la
     * recarga colgaba, el loading quedaba eterno. Solo actualizamos session.
     */
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      // Token refresh / user update: solo actualizamos session, no recargamos
      // paciente ni mostramos spinner. El usuario sigue siendo el mismo.
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession)
        return
      }

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
        if (err instanceof TimeoutError) {
          console.error('[useAuth] onAuthStateChange timeout — UI continua sin paciente')
        } else {
          console.error('[useAuth] onAuthStateChange error:', err)
        }
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
