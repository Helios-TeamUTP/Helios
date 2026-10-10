import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_CITA } from '../lib/columnas'
import type { CitaConPaciente, EstadoCita } from '../lib/types'

/**
 * Modo de filtrado de citas:
 * - 'hoy': solo las citas confirmadas con fecha = hoy (agenda del dia)
 * - 'semana': citas de los proximos 7 dias (hoy incluido), sin canceladas
 * - 'historial': todas las citas con fecha < hoy (vista historica)
 */
export type ModoMedicoCitas = 'hoy' | 'semana' | 'historial'

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
 * @returns data (citas con paciente y horario), loading, error,
 *          refetch, marcarNoAsistio, reflejarEstado
 */
export function useMedicoCitas(medicoId: string | null, modo: ModoMedicoCitas = 'hoy') {
  const [data, setData] = useState<CitaConPaciente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(
    async (signal?: { active: boolean }) => {
      if (!medicoId) {
        if (!signal || signal.active) {
          setData([])
          setLoading(false)
        }
        return
      }
      setLoading(true)
      setError(null)

      // Bug B-21: fecha LOCAL (no toISOString/UTC) para que "hoy" sea correcto
      // en Panamá (UTC-5) incluso de noche. Sin esto, la agenda del día podía
      // mostrar la del día siguiente tras las 7 PM.
      const ahora = new Date()
      const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}` // YYYY-MM-DD

      try {
        let query = supabase
          .from('citas')
          .select(`${COLUMNAS_CITA}, paciente:pacientes!inner(*), horario:horarios!inner(*)`)
          .eq('medico_id', medicoId)

        if (modo === 'hoy') {
          // Sprint 2 (ST-8): la agenda de hoy NO muestra las canceladas
          // (quedan registradas en el historial, pero no estorban la vista).
          query = query.eq('horario.fecha', hoy).neq('estado', 'cancelada')
        } else if (modo === 'semana') {
          // Agenda de los proximos 7 dias (hoy incluido), sin canceladas.
          // Fecha LOCAL (no UTC) por la misma razon que `hoy` (B-21).
          const finDate = new Date(ahora)
          finDate.setDate(finDate.getDate() + 6)
          const fin = `${finDate.getFullYear()}-${String(finDate.getMonth() + 1).padStart(2, '0')}-${String(finDate.getDate()).padStart(2, '0')}`
          query = query.gte('horario.fecha', hoy).lte('horario.fecha', fin).neq('estado', 'cancelada')
        } else {
          query = query.lt('horario.fecha', hoy)
        }

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
    [medicoId, modo],
  )

  useEffect(() => {
    const signal = { active: true }
    // fetchCitas es async y solo llama setState tras chequear signal.active
    // (cancelado en el cleanup de abajo). Patron oficial de React para
    // evitar race conditions en efectos con fetch async; la regla no puede
    // verificar estaticamente que el guard ya lo hace seguro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCitas(signal)
    return () => {
      signal.active = false
    }
  }, [fetchCitas])

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
