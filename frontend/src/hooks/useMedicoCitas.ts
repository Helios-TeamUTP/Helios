import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_CITA } from '../lib/columnas'
import type { CitaConPaciente, EstadoCita } from '../lib/types'

/**
 * Modo de filtrado de citas:
 * - 'hoy': solo las citas confirmadas con fecha = hoy (agenda del dia)
 * - 'semana': citas de los proximos 7 dias (hoy incluido), sin canceladas
 * - 'historial': todas las citas con fecha < hoy (vista historica)
 * - 'fecha': las citas (sin canceladas) de UNA fecha elegida por el medico
 *   (CU-05 paso 2.1.3, filtro de agenda por fecha)
 */
export type ModoMedicoCitas = 'hoy' | 'semana' | 'historial' | 'fecha'

/** YYYY-MM-DD con la fecha LOCAL del navegador (B-21: nunca toISOString/UTC). */
function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Arma la consulta de citas del medico segun el modo. Extraida del hook para
 * que `fetchCitas` quede con una complejidad razonable (S3776).
 *
 * Bug B-21: fecha LOCAL (no toISOString/UTC) para que "hoy" sea correcto en
 * Panama (UTC-5) incluso de noche. Sin esto, la agenda del dia podia mostrar
 * la del dia siguiente tras las 7 PM.
 */
function construirConsulta(
  medicoId: string,
  modo: ModoMedicoCitas,
  fecha: string | null,
  ahora: Date,
) {
  const hoy = fechaLocal(ahora)
  const query = supabase
    .from('citas')
    .select(`${COLUMNAS_CITA}, paciente:pacientes!inner(*), horario:horarios!inner(*)`)
    .eq('medico_id', medicoId)

  if (modo === 'hoy') {
    // Sprint 2 (ST-8): la agenda de hoy NO muestra las canceladas
    // (quedan registradas en el historial, pero no estorban la vista).
    return query.eq('horario.fecha', hoy).neq('estado', 'cancelada')
  }
  if (modo === 'semana') {
    // Agenda de los proximos 7 dias (hoy incluido), sin canceladas.
    const finDate = new Date(ahora)
    finDate.setDate(finDate.getDate() + 6)
    return query
      .gte('horario.fecha', hoy)
      .lte('horario.fecha', fechaLocal(finDate))
      .neq('estado', 'cancelada')
  }
  if (modo === 'fecha') {
    // Fecha elegida por el medico (YYYY-MM-DD; el caller ya valido que existe).
    // Igual que 'hoy', no muestra las canceladas.
    return query.eq('horario.fecha', fecha as string).neq('estado', 'cancelada')
  }
  return query.lt('horario.fecha', hoy)
}

/**
 * Hook que carga las citas asignadas a un medico con join al paciente
 * y al horario. Usado en MedicoDashboard.
 *
 * Bug B-13: nuevo hook del dashboard de medicos.
 *
 * Sigue el patron de useCitas (B-08):
 * - try/catch/finally garantiza setLoading(false)
 * - signal flag previene race conditions tras cambio rapido de medicoId
 *
 * @param medicoId - ID del medico autenticado (de useAuth.medico.id)
 * @param modo - 'hoy' filtra fecha=hoy; 'historial' filtra fecha<hoy
 * @param fecha - YYYY-MM-DD, solo se usa con modo 'fecha'
 * @returns data (citas con paciente y horario), loading, error,
 *          refetch, marcarNoAsistio, reflejarEstado
 *
 * CU-05 (flujo 2.2.1) / CU-03 (2.1.12): ademas se suscribe por Realtime a los
 * cambios de `citas` de este medico (paciente agenda, cancela o reprograma) y
 * recarga la agenda en silencio, sin que el medico recargue la pagina.
 */
export function useMedicoCitas(
  medicoId: string | null,
  modo: ModoMedicoCitas = 'hoy',
  fecha: string | null = null,
) {
  const [data, setData] = useState<CitaConPaciente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(
    async (signal?: { active: boolean }, silencioso = false) => {
      if (!medicoId || (modo === 'fecha' && !fecha)) {
        if (!signal || signal.active) {
          setData([])
          setLoading(false)
        }
        return
      }
      // Recarga silenciosa (Realtime): sin spinner, para que la tabla no
      // parpadee ni se reemplace mientras el medico la esta usando.
      if (!silencioso) setLoading(true)
      setError(null)

      try {
        const query = construirConsulta(medicoId, modo, fecha, new Date())

        // Orden por fecha y luego por hora: clave para la vista de semana, que
        // abarca varios dias. Para 'hoy' es un solo dia, asi que no cambia nada.
        const { data, error } = await query
          .order('horario(fecha)', { ascending: true })
          .order('horario(hora_inicio)', { ascending: true })

        if (signal && !signal.active) return

        if (error) {
          setError(error.message)
        } else {
          setData((data ?? []) as unknown as CitaConPaciente[])
        }
      } catch (err) {
        if (!signal || signal.active) {
          console.error('[useMedicoCitas] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!signal || signal.active) setLoading(false)
      }
    },
    [medicoId, modo, fecha],
  )

  useEffect(() => {
    const signal = { active: true }
    // fetchCitas es async y solo llama setState tras chequear signal.active
    // (cancelado en el cleanup de abajo). Patron oficial de React para
    // evitar race conditions en efectos con fetch async; la regla no puede
    // verificar estaticamente que el guard ya lo hace seguro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCitas(signal)
    return () => {
      signal.active = false
    }
  }, [fetchCitas])

  // Realtime: la RLS ya limita los eventos a las citas de este medico; el
  // filtro ademas evita recargas por citas ajenas.
  useEffect(() => {
    if (!medicoId) return
    const signal = { active: true }
    const canal = supabase
      .channel(`citas-medico-${medicoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citas', filter: `medico_id=eq.${medicoId}` },
        () => {
          if (signal.active) void fetchCitas(signal, true)
        },
      )
      .subscribe()
    return () => {
      signal.active = false
      void supabase.removeChannel(canal)
    }
  }, [fetchCitas, medicoId])

  /**
   * Refleja en la lista local un estado que la BD YA confirmo (sin re-fetch ni
   * spinner: un refetch pondria `loading` en true y reemplazaria la tabla).
   */
  const reflejarEstado = useCallback((citaId: string, estado: EstadoCita) => {
    setData((prev) => prev.map((c) => (c.id === citaId ? { ...c, estado } : c)))
  }, [])

  /**
   * Marca UNA cita como "no asistio" via RPC `marcar_cita_no_asistio` (B-35).
   * La BD valida que la cita sea del medico autenticado y siga "confirmada".
   * Completar una cita NO pasa por aqui: requiere la dolencia principal y se
   * hace con `useHistorialClinico().completarCita` (misma operacion atomica).
   */
  const marcarNoAsistio = useCallback(
    async (citaId: string) => {
      const { error } = await supabase.rpc('marcar_cita_no_asistio', { p_cita_id: citaId })
      if (error) {
        console.error('[useMedicoCitas] marcarNoAsistio error:', error.message)
        throw new Error(error.message)
      }
      reflejarEstado(citaId, 'no_asistio')
    },
    [reflejarEstado],
  )

  return { data, loading, error, refetch: () => fetchCitas(), marcarNoAsistio, reflejarEstado }
}
