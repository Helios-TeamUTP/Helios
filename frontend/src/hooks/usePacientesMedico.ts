import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_CITA, COLUMNAS_HISTORIAL } from '../lib/columnas'
import type { CitaConPaciente, HistorialClinico, PacienteConHistorial } from '../lib/types'

/**
 * Arma un renglon por paciente a partir de sus citas completadas y del
 * historial clinico. Se queda con la cita mas reciente POR paciente: la lista
 * de citas debe venir ordenada de mas reciente a mas antigua, asi que la
 * primera ocurrencia de cada paciente_id es la que vale.
 */
export function resumirPacientes(
  citas: CitaConPaciente[],
  historial: HistorialClinico[],
): PacienteConHistorial[] {
  const historialPorCita = new Map<string, HistorialClinico>(historial.map((h) => [h.cita_id, h]))
  const vistos = new Set<string>()
  const resumen: PacienteConHistorial[] = []

  for (const cita of citas) {
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

  return resumen
}

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
      // Sin signal (refetch manual) siempre vigente; con signal, hasta que el cleanup lo cancele.
      const vigente = () => !signal || signal.active

      if (!medicoId) {
        if (vigente()) {
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

        if (!vigente()) return

        // 3. Una fila por paciente, con su cita mas reciente y su historial.
        setData(
          resumirPacientes(
            (citas ?? []) as unknown as CitaConPaciente[],
            (historial ?? []) as HistorialClinico[],
          ),
        )
      } catch (err) {
        if (vigente()) {
          console.error('[usePacientesMedico] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (vigente()) setLoading(false)
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
    void fetchPacientes(signal)
    return () => {
      signal.active = false
    }
  }, [fetchPacientes])

  return { data, loading, error, refetch: () => fetchPacientes() }
}
