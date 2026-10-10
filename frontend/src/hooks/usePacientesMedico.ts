import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_CITA, COLUMNAS_HISTORIAL } from '../lib/columnas'
import type { CitaConPaciente, HistorialClinico, PacienteConHistorial } from '../lib/types'

/**
 * Hook que arma el resumen "Gestión de Pacientes" del medico:
 * un renglon por paciente, con su cita 'completada' mas reciente
 * y el historial_clinico (dolencia_principal, receta) asociado.
 *
 * Sigue el mismo patron de useMedicoCitas.ts:
 * - signal flag previene race conditions tras cambio rapido de medicoId
 * - try/catch/finally garantiza setLoading(false)
 *
 * @param medicoId - ID del medico autenticado (de useAuth.medico.id)
 */
export function usePacientesMedico(medicoId: string | null) {
  const [data, setData] = useState<PacienteConHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPacientes = useCallback(
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

      try {
        // 1. Citas completadas de este medico, con paciente y horario,
        //    ordenadas de mas reciente a mas antigua.
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select(`${COLUMNAS_CITA}, paciente:pacientes!inner(*), horario:horarios!inner(*)`)
          .eq('medico_id', medicoId)
          .eq('estado', 'completada')
          .order('horario(fecha)', { ascending: false })

        if (citasError) throw citasError

        // 2. Historial clinico de este medico (una query aparte, se cruza en JS
        //    para evitar ambiguedad de embed con 3 FKs en historial_clinico).
        const { data: historial, error: historialError } = await supabase
          .from('historial_clinico')
          .select(COLUMNAS_HISTORIAL)
          .eq('medico_id', medicoId)

        if (historialError) throw historialError

        if (signal && !signal.active) return

        const historialPorCita = new Map<string, HistorialClinico>(
          ((historial ?? []) as HistorialClinico[]).map((h) => [h.cita_id, h]),
        )

        // 3. Nos quedamos solo con la cita mas reciente POR paciente
        //    (la lista ya viene ordenada desc, asi que la primera
        //    ocurrencia de cada paciente_id es la mas reciente).
        const vistos = new Set<string>()
        const resumen: PacienteConHistorial[] = []

        for (const cita of (citas ?? []) as unknown as CitaConPaciente[]) {
          if (!cita.paciente_id || !cita.paciente) continue
          if (vistos.has(cita.paciente_id)) continue
          vistos.add(cita.paciente_id)

          const hist = historialPorCita.get(cita.id)
          resumen.push({
            paciente: cita.paciente,
            dolencia_principal: hist?.dolencia_principal ?? 'Sin registrar',
            receta: hist?.receta ?? null,
            ultima_visita: cita.horario?.fecha ?? cita.created_at,
          })
        }

        setData(resumen)
      } catch (err) {
        if (!signal || signal.active) {
          console.error('[usePacientesMedico] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!signal || signal.active) setLoading(false)
      }
    },
    [medicoId],
  )

  useEffect(() => {
    const signal = { active: true }
    // fetchPacientes es async y solo llama setState tras chequear
    // signal.active (cancelado en el cleanup de abajo). Mismo patron ya
    // usado en useCitas.ts y useMedicoCitas.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPacientes(signal)
    return () => {
      signal.active = false
    }
  }, [fetchPacientes])

  return { data, loading, error, refetch: () => fetchPacientes() }
}
