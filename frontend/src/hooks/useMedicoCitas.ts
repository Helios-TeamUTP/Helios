import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CitaConPaciente, EstadoCita } from '../lib/types'

/**
 * Modo de filtrado de citas:
 * - 'hoy': solo las citas confirmadas con fecha = hoy (agenda del dia)
 * - 'historial': todas las citas con fecha < hoy (vista historica)
 */
export type ModoMedicoCitas = 'hoy' | 'historial'

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
 *          refetch, marcarEstado
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
          .select('*, paciente:pacientes!inner(*), horario:horarios!inner(*)')
          .eq('medico_id', medicoId)

        if (modo === 'hoy') {
          // Sprint 2 (ST-8): la agenda de hoy NO muestra las canceladas
          // (quedan registradas en el historial, pero no estorban la vista).
          query = query.eq('horario.fecha', hoy).neq('estado', 'cancelada')
        } else {
          query = query.lt('horario.fecha', hoy)
        }

        const { data, error } = await query.order('horario(hora_inicio)', { ascending: true })

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
    fetchCitas(signal)
    return () => {
      signal.active = false
    }
  }, [fetchCitas])

  /**
   * Actualiza el estado de UNA cita (completada / no_asistio).
   * RLS de B-14 garantiza que solo el medico dueño de la cita puede ejecutarlo.
   * Refresca la lista tras el UPDATE para reflejar el nuevo estado.
   */
  const marcarEstado = useCallback(
    async (citaId: string, nuevoEstado: EstadoCita) => {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', citaId)
      if (error) {
        console.error('[useMedicoCitas] marcarEstado error:', error.message)
        throw new Error(error.message)
      }
      // Refresco optimista: actualizamos el estado en el array local sin re-fetch
      setData((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c)),
      )
    },
    [],
  )

  return { data, loading, error, refetch: () => fetchCitas(), marcarEstado }
}
