import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HorarioAgendable } from '../lib/types'

/** Cuántos días hacia adelante se muestran en el selector de horario. */
export const VENTANA_DIAS_AGENDABLES = 7

/**
 * Bug B-25: la query trae los horarios de HOY en adelante (filtro por fecha),
 * pero un slot de hoy cuya hora ya pasó (ej. 7:00 AM cuando ya son las 5 PM)
 * NO debe poder agendarse. Esta función filtra esos slots ya vencidos.
 *
 * Comparación 100% LOCAL en strings (sin Date/UTC) para evitar desfases de
 * zona horaria: `fecha` es "YYYY-MM-DD" y `hora_inicio` es "HH:MM:SS", ambos
 * zero-padded, así que el orden lexicográfico coincide con el cronológico.
 *
 * Genérico en `T extends { fecha; hora_inicio }` para preservar el tipo del
 * slot (Sprint 5: conserva el campo `dia_completo` de HorarioAgendable).
 *
 * @param horarios - slots crudos traídos de Supabase
 * @param ahora - momento actual (se inyecta para poder testear)
 */
export function filtrarSlotsFuturos<T extends { fecha: string; hora_inicio: string }>(
  horarios: T[],
  ahora: Date,
): T[] {
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`
  return horarios.filter(
    (h) => h.fecha > hoy || (h.fecha === hoy && h.hora_inicio > horaActual),
  )
}

/**
 * La RPC `horarios_agendables` no tiene tope superior de fecha — trae TODOS
 * los horarios futuros del médico, y como estos se generan con meses de
 * anticipación (ver scripts/extender_horarios.py), sin este filtro el
 * paciente vería un calendario con casi medio año de opciones de golpe.
 *
 * Esta función recorta la ventana a los próximos `VENTANA_DIAS_AGENDABLES`
 * días desde hoy, sin tocar la RPC ni los datos en Supabase — el médico
 * puede seguir teniendo horarios generados mucho más lejos, solo no se
 * muestran todos de una vez en el selector.
 *
 * Comparación en string "YYYY-MM-DD" (mismo criterio que filtrarSlotsFuturos,
 * sin pasar por Date/UTC) para que no se desfase por zona horaria.
 *
 * @param horarios - slots ya filtrados por filtrarSlotsFuturos
 * @param ahora - momento actual (se inyecta para poder testear)
 * @param dias - tamaño de la ventana en días (default VENTANA_DIAS_AGENDABLES)
 */
export function limitarVentanaDias<T extends { fecha: string }>(
  horarios: T[],
  ahora: Date,
  dias: number = VENTANA_DIAS_AGENDABLES,
): T[] {
  const limite = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias)
  const limiteStr = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`
  return horarios.filter((h) => h.fecha <= limiteStr)
}

/**
 * Hook que carga los horarios disponibles de un médico específico, limitados
 * a los próximos VENTANA_DIAS_AGENDABLES días desde hoy. Excluye slots de
 * hoy cuya hora ya pasó (B-25).
 *
 * Bug B-08 fix: try/catch/finally garantiza setLoading(false) aunque
 * Supabase falle. El early return cuando no hay medicoId también setea
 * loading=false explícitamente.
 *
 * @param medicoId - ID del médico o null
 * @param excluirCitaId - Sprint 5: al REPROGRAMAR, la cita que se está moviendo
 *   no debe contar para el tope del día (si no, un día en el tope donde una de
 *   las citas es la propia se marcaría "completo" y bloquearía en la UI un
 *   cambio del mismo día que el backend sí permite). Se deja undefined/null al
 *   agendar una cita nueva.
 */
export function useHorarios(medicoId: string | null, excluirCitaId?: string | null) {
  const [data, setData] = useState<HorarioAgendable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!medicoId) {
      // Reset sincrono cuando aun no hay medico seleccionado — patron valido
      // de React (mismo criterio ya documentado en useSedes.ts/useMedicos.ts).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData([])
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
    void (async () => {
      try {
        // Sprint 5: la RPC devuelve los slots libres del médico marcando con
        // `dia_completo` los días que ya llegaron al tope de 15 citas. Va por RPC
        // (no query directa) porque el paciente, por RLS, no puede contar las
        // citas ajenas del médico para saber qué días están llenos.
        const { data, error } = await supabase.rpc('horarios_agendables', {
          p_medico_id: medicoId,
          p_hoy: hoy,
          p_excluir_cita_id: excluirCitaId ?? null,
        })
        if (!active) return
        if (error) {
          setError(error.message)
        } else {
          // Bug B-25: descartar slots de hoy cuya hora ya pasó.
          const futuros = filtrarSlotsFuturos((data ?? []) as HorarioAgendable[], new Date())
          // Recortar a los próximos 7 días para no abrumar al paciente con
          // meses de opciones (la RPC no tiene tope superior de fecha).
          setData(limitarVentanaDias(futuros, new Date()))
        }
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
  }, [medicoId, excluirCitaId])

  return { data, loading, error }
}
