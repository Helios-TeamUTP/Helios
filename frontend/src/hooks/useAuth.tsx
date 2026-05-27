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
import type { MedicoConRelaciones, Paciente, Role } from '../lib/types'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

interface AuthContextValue {
  user: User | null
  session: Session | null
  paciente: Paciente | null
  /**
   * Bug B-13: medico con especialidad y sede joinned para mostrar en
   * el header del MedicoDashboard ("Dr. X · Medicina General · Sede Panama").
   */
  medico: MedicoConRelaciones | null
  /**
   * Rol del usuario: 'paciente', 'medico' o null (sin perfil).
   * Bug B-13: usado por ProtectedRoute requireRole y por Login para
   * redirigir al dashboard correcto.
   */
  role: Role
  loading: boolean
  signOut: () => Promise<void>
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [medico, setMedico] = useState<MedicoConRelaciones | null>(null)
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
   * Carga el perfil vinculado al auth_uid: paciente Y/O medico.
   * Bug B-07: try/catch garantiza que NUNCA propague excepcion al caller.
   * Race condition fix: ignora respuesta si el authUid actual cambio mientras
   * la query estaba en vuelo.
   * Bug B-11: queries envueltas con withTimeout(AUTH_TIMEOUT_MS) para que
   * un Supabase colgado no atasque el loading=true del caller.
   * Bug B-12: cada perfil se carga con UNA query (JOIN nativo Supabase).
   * Bug B-13: ahora carga AMBOS perfiles (paciente y medico) en PARALELO
   * con Promise.all para no agregar latencia. Si encuentra paciente -> rol
   * paciente; si encuentra medico -> rol medico; ninguno -> rol null (cuenta
   * auth sin perfil, sera redirigido a /registro como hoy).
   *
   * Asumimos exclusion: un usuario es paciente XOR medico, nunca ambos.
   * Si por accidente tuviera ambos vinculos, prevalece medico (acceso
   * privilegiado al dashboard).
   */
  const loadPerfil = useCallback(async (authUid: string) => {
    currentAuthUidRef.current = authUid
    try {
      const [pacResult, medResult] = await Promise.all([
        withTimeout(
          supabase
            .from('auth_paciente_link')
            .select('paciente_id, pacientes!inner(*)')
            .eq('auth_uid', authUid)
            .maybeSingle(),
          AUTH_TIMEOUT_MS,
        ),
        withTimeout(
          supabase
            .from('auth_medico_link')
            .select(
              'medico_id, medicos!inner(*, especialidad:especialidades(*), sede:sedes(*))',
            )
            .eq('auth_uid', authUid)
            .maybeSingle(),
          AUTH_TIMEOUT_MS,
        ),
      ])

      // Respuesta tardia: el usuario ya cambio. Ignorar.
      if (currentAuthUidRef.current !== authUid) return

      if (pacResult.error) {
        console.error('[useAuth] loadPerfil paciente error:', pacResult.error.message)
      }
      if (medResult.error) {
        console.error('[useAuth] loadPerfil medico error:', medResult.error.message)
      }

      const pacienteRel = (
        pacResult.data as unknown as { pacientes: Paciente | null } | null
      )?.pacientes
      const medicoRel = (
        medResult.data as unknown as { medicos: MedicoConRelaciones | null } | null
      )?.medicos

      setPaciente(pacienteRel ?? null)
      setMedico(medicoRel ?? null)
    } catch (err) {
      if (err instanceof TimeoutError) {
        console.error('[useAuth] loadPerfil timeout — UI continua sin perfil')
      } else {
        console.error('[useAuth] loadPerfil unexpected:', err)
      }
      if (currentAuthUidRef.current === authUid) {
        setPaciente(null)
        setMedico(null)
      }
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
        if (data.session?.user) await loadPerfil(data.session.user.id)
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
        if (hasNewUser) {
          await loadPerfil(newSession.user.id)
        } else {
          setPaciente(null)
          setMedico(null)
        }
      } catch (err) {
        if (err instanceof TimeoutError) {
          console.error('[useAuth] onAuthStateChange timeout — UI continua sin perfil')
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
  }, [loadPerfil])

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
      setMedico(null)
    }
  }, [])

  const refreshPerfil = useCallback(async () => {
    if (session?.user) await loadPerfil(session.user.id)
    // Solo depende del user.id, no del session entero (evita re-renders
    // por cada token refresh).
  }, [session?.user?.id, loadPerfil])

  /**
   * Bug B-13: derivar rol del perfil cargado. Si por algun motivo
   * ambos vinculos coexistieran, medico tiene precedencia (defensivo).
   */
  const role: Role = medico ? 'medico' : paciente ? 'paciente' : null

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      paciente,
      medico,
      role,
      loading,
      signOut,
      refreshPerfil,
    }),
    [session, paciente, medico, role, loading, signOut, refreshPerfil],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
