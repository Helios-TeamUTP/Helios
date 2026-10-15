import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNAS_HISTORIAL } from '../lib/columnas'
import { descargarBytes } from '../lib/descargarArchivo'
import {
  construirPdfHistorial,
  nombreArchivoHistorial,
  type EntradaHistorial,
  type ModoHistorial,
  type PacientePdf,
} from '../lib/historialPdf'
import { textoNota } from '../lib/notas'
import type { NotaEmbed } from '../lib/types'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'

/**
 * Columnas a pedir por modo. Son DISTINTAS a propósito (privacidad):
 *  - médico: nunca se pide `cita_nota_paciente` (CA-03-05: el médico no ve esa
 *    nota "en ninguna vista"; ni siquiera se intenta leerla) ni
 *    `historial_nota_medico` (no va al PDF).
 *  - paciente: se pide su propia nota; nunca `historial_nota_medico` (CA-04-03).
 */
const SELECT_MEDICO =
  `${COLUMNAS_HISTORIAL}, ` +
  'cita:citas(horario:horarios(fecha, hora_inicio), sede:sedes(nombre))'

const SELECT_PACIENTE =
  `${COLUMNAS_HISTORIAL}, ` +
  'medico:medicos(nombre, especialidad:especialidades(nombre)), ' +
  'cita:citas(horario:horarios(fecha, hora_inicio), sede:sedes(nombre), ' +
  'nota_paciente:cita_nota_paciente(nota))'

interface FilaHistorial {
  dolencia_principal: string
  receta: string | null
  medico?: { nombre?: string | null; especialidad?: { nombre?: string | null } | null } | null
  cita?: {
    horario?: { fecha?: string | null; hora_inicio?: string | null } | null
    sede?: { nombre?: string | null } | null
    nota_paciente?: NotaEmbed | NotaEmbed[] | null
  } | null
}

function aEntrada(f: FilaHistorial, modo: ModoHistorial): EntradaHistorial {
  return {
    fecha: f.cita?.horario?.fecha ?? null,
    hora: f.cita?.horario?.hora_inicio ?? null,
    medico: f.medico?.nombre ?? null,
    especialidad: f.medico?.especialidad?.nombre ?? null,
    sede: f.cita?.sede?.nombre ?? null,
    dolencia: f.dolencia_principal,
    receta: f.receta,
    // Solo el paciente ve su nota. En modo médico no se copia ni aunque llegara.
    notaPaciente: modo === 'paciente' ? textoNota(f.cita?.nota_paciente) : null,
  }
}

export interface OpcionesDescarga {
  paciente: PacientePdf & { id: string }
  modo: ModoHistorial
  /** Nombre del médico que descarga (solo se muestra en modo "medico"). */
  generadoPor?: string | null
}

/**
 * Descarga el historial clínico completo de un paciente como PDF.
 *
 * Trae TODAS las atenciones (no solo las 5 de la ficha). La RLS de
 * `historial_clinico` decide qué se ve: al médico solo lo que él registró; al
 * paciente solo lo suyo. Si no hay nada, no se genera un PDF vacío: se avisa.
 */
export function useDescargarHistorial() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const descargar = useCallback(async ({ paciente, modo, generadoPor }: OpcionesDescarga) => {
    setLoading(true)
    setError(null)
    setAviso(null)
    try {
      const { data, error: consultaError } = await withTimeout(
        supabase
          .from('historial_clinico')
          .select(modo === 'paciente' ? SELECT_PACIENTE : SELECT_MEDICO)
          .eq('paciente_id', paciente.id),
        AUTH_TIMEOUT_MS,
      )
      if (consultaError) {
        console.error('[useDescargarHistorial] consulta:', consultaError.message)
        setError('No se pudo preparar el historial. Intenta nuevamente.')
        return false
      }

      const entradas = ((data ?? []) as unknown as FilaHistorial[]).map((f) => aEntrada(f, modo))
      if (entradas.length === 0) {
        setAviso('Aún no hay historial clínico registrado para descargar.')
        return false
      }

      const ahora = new Date()
      descargarBytes(
        construirPdfHistorial({ paciente, entradas, modo, generadoPor, ahora }),
        nombreArchivoHistorial(paciente.nombre, ahora),
      )
      return true
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
      } else {
        console.error('[useDescargarHistorial] unexpected:', err)
        setError('No se pudo preparar el historial. Intenta nuevamente.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { descargar, loading, error, aviso }
}
