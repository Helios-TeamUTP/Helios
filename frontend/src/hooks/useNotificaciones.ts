import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'
import type { Notificacion } from '../lib/types'

/**
 * Sprint 4 (HELL-5): notificaciones in-app en tiempo real.
 *
 * Carga las notificaciones del usuario (RLS garantiza que solo vea las suyas) y
 * se suscribe a un canal Supabase Realtime para que las nuevas aparezcan SIN
 * recargar — esta es la "red de seguridad" visible de la demo y la base del
 * modulo de sincronizacion entre sedes.
 *
 * Patron del equipo:
 *  - B-08/B-10: try/catch/finally + withTimeout + flag `active` para cleanup,
 *    asi un fetch colgado nunca deja loading eterno ni cruza datos tras logout.
 *  - El canal Realtime se limpia con removeChannel en el cleanup del efecto
 *    (patron estandar de Supabase para no fugar suscripciones).
 *
 * Recibe el id del paciente O del medico (uno sera null). Se usa para filtrar el
 * canal Realtime a las filas propias.
 *
 * @param pacienteId id del paciente logueado, o null
 * @param medicoId   id del medico logueado, o null
 */
export function useNotificaciones(pacienteId: string | null, medicoId: string | null) {
  const [data, setData] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noLeidas = data.reduce((n, notif) => (notif.leida ? n : n + 1), 0)

  const fetchNotificaciones = useCallback(async () => {
    if (!pacienteId && !medicoId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // RLS filtra a las del usuario; no hace falta filtrar por id aqui.
      const { data: rows, error: qErr } = await withTimeout(
        supabase
          .from('notificaciones')
          .select('*')
          .eq('canal', 'in_app') // la campanita solo muestra in-app (el correo es Fase C)
          .order('created_at', { ascending: false })
          .limit(50),
        AUTH_TIMEOUT_MS,
      )
      if (qErr) setError(qErr.message)
      else setData(rows ?? [])
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
      } else {
        console.error('[useNotificaciones] unexpected:', err)
        setError('No se pudieron cargar las notificaciones.')
      }
    } finally {
      setLoading(false)
    }
  }, [pacienteId, medicoId])

  useEffect(() => {
    let active = true
    // fetchNotificaciones es async y solo llama setState tras chequear
    // `active` (cancelado en el cleanup de abajo). Mismo patron ya
    // documentado en useCitas.ts, useMedicoCitas.ts y usePacientesMedico.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotificaciones()

    const id = pacienteId ?? medicoId
    if (!id) return
    const columna = pacienteId ? 'paciente_id' : 'medico_id'

    const canal = supabase
      .channel(`notificaciones-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `${columna}=eq.${id}`,
        },
        (payload) => {
          if (!active) return
          const nueva = payload.new as Notificacion
          // El filtro Realtime es por id de destinatario; ademas descartamos
          // las de correo para que la campanita solo muestre in-app.
          if (nueva.canal !== 'in_app') return
          // Anteponer la nueva notificacion sin re-consultar toda la lista.
          setData((prev) => [nueva, ...prev])
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(canal) // cleanup obligatorio del canal
    }
  }, [fetchNotificaciones, pacienteId, medicoId])

  /** Marca una notificacion como leida (optimista; la RPC valida dueño). */
  const marcarLeida = useCallback(
    async (id: string) => {
      setData((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      try {
        // Supabase NO lanza en error de RPC: hay que revisar { error } (CLAUDE.md §7).
        const { error: rpcErr } = await supabase.rpc('marcar_notificacion_leida', { p_id: id })
        if (rpcErr) throw rpcErr
      } catch (err) {
        console.error('[useNotificaciones] marcarLeida:', err)
        fetchNotificaciones() // revertir el optimista al estado real del servidor
      }
    },
    [fetchNotificaciones],
  )

  /** Marca todas como leidas (optimista). */
  const marcarTodasLeidas = useCallback(async () => {
    setData((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      const { error: rpcErr } = await supabase.rpc('marcar_todas_notificaciones_leidas')
      if (rpcErr) throw rpcErr
    } catch (err) {
      console.error('[useNotificaciones] marcarTodasLeidas:', err)
      fetchNotificaciones() // revertir el optimista al estado real del servidor
    }
  }, [fetchNotificaciones])

  return {
    data,
    noLeidas,
    loading,
    error,
    marcarLeida,
    marcarTodasLeidas,
    refetch: fetchNotificaciones,
  }
}
