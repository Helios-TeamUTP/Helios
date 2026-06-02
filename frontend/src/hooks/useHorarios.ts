import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Horario } from '../lib/types'

/**
 * Bug B-25: la query trae los horarios de HOY en adelante (filtro por fecha),
 * pero un slot de hoy cuya hora ya pasó (ej. 7:00 AM cuando ya son las 5 PM)
 * NO debe poder agendarse. Esta función filtra esos slots ya vencidos.
 *
 * Comparación 100% LOCAL en strings (sin Date/UTC) para evitar desfases de
 * zona horaria: `fecha` es "YYYY-MM-DD" y `hora_inicio` es "HH:MM:SS", ambos
 * zero-padded, así que el orden lexicográfico coincide con el cronológico.
 *
 * @param horarios - slots crudos traídos de Supabase
 * @param ahora - momento actual (se inyecta para poder testear)
 */
export function filtrarSlotsFuturos(horarios: Horario[], ahora: Date): Horario[] {
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`
  return horarios.filter(
    (h) => h.fecha > hoy || (h.fecha === hoy && h.hora_inicio > horaActual),
  )
}

/**
 * Hook que carga los horarios disponibles de un médico específico desde hoy
 * en adelante. Excluye slots de hoy cuya hora ya pasó (B-25).
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. El early return cuando no hay medicoId también setea
 * loading=false explícitamente.
 *
 * @param medicoId - ID del médico o null
 * @returns data (horarios disponibles), loading, error
 */
export function useHorarios(medicoId: string | null) {
  const [data, setData] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!medicoId) {
      setData([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    // Bug B-21: NO usar toISOString() — devuelve la fecha en UTC y en Panamá
    // (UTC-5) después de las 7 PM eso adelanta al día siguiente, ocultando los
    // slots de "hoy". Construimos la fecha LOCAL (YYYY-MM-DD) a mano.
    const ahora = new Date()
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('horarios')
          .select('*')
          .eq('medico_id', medicoId)
          .eq('disponible', true)
          .gte('fecha', hoy)
          .order('fecha')
          .order('hora_inicio')
        if (!active) return
        if (error) setError(error.message)
        // Bug B-25: descartar slots de hoy cuya hora ya pasó (no agendar en el pasado).
        else setData(filtrarSlotsFuturos(data ?? [], new Date()))
      } catch (err) {
        if (active) {
          console.error('[useHorarios] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [medicoId])

  return { data, loading, error }
}
