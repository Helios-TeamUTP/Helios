import { generarPdf, type LineaPdf } from './pdfSimple'

/**
 * Armado del PDF de historial clínico (CU-04 paciente / CU-05 médico).
 *
 * Reglas de privacidad que este módulo hace cumplir por construcción:
 *  - Modo "medico": NUNCA lleva la nota privada del paciente (CA-03-05) ni
 *    las notas privadas del médico (el PDF puede entregarse al paciente o a
 *    otro profesional; las notas privadas son solo del autor).
 *  - Modo "paciente": lleva la nota que el propio paciente escribió al agendar
 *    (CA-04-02) y NUNCA notas del médico (CA-04-03).
 * Las notas privadas del médico ni siquiera son un campo de `EntradaHistorial`.
 */

export type ModoHistorial = 'medico' | 'paciente'

export interface PacientePdf {
  nombre: string
  cedula: string
  telefono?: string | null
  correo?: string | null
  fecha_nacimiento?: string | null
}

export interface EntradaHistorial {
  /** YYYY-MM-DD de la cita (se formatea sin pasar por Date: B-21). */
  fecha: string | null
  /** HH:MM[:SS] */
  hora: string | null
  medico: string | null
  especialidad: string | null
  sede: string | null
  dolencia: string
  receta: string | null
  /** Solo se usa en modo "paciente" (es la nota privada del propio paciente). */
  notaPaciente?: string | null
}

const SIN_DATO = '—'

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' por manipulación de texto (sin Date, sin zona horaria). */
export function formatearFecha(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : SIN_DATO
}

const dos = (n: number) => String(n).padStart(2, '0')

/** Sello "DD/MM/YYYY HH:mm" con la hora LOCAL del navegador. */
function sello(d: Date): string {
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`
}

/** historial-clinico-ana-lopez-2026-10-15.pdf (sin acentos ni caracteres raros). */
export function nombreArchivoHistorial(nombrePaciente: string, ahora: Date): string {
  const slug =
    nombrePaciente
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'paciente'
  const fecha = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
  return `historial-clinico-${slug}-${fecha}.pdf`
}

/** Más reciente primero (fecha + hora). Las entradas sin fecha van al final. */
export function ordenarEntradas(entradas: EntradaHistorial[]): EntradaHistorial[] {
  const clave = (e: EntradaHistorial) => (e.fecha ? `${e.fecha} ${e.hora ?? ''}` : '')
  return [...entradas].sort((a, b) => {
    const ka = clave(a)
    const kb = clave(b)
    if (!ka && !kb) return 0
    if (!ka) return 1
    if (!kb) return -1
    return kb.localeCompare(ka)
  })
}

interface OpcionesPdf {
  paciente: PacientePdf
  entradas: EntradaHistorial[]
  modo: ModoHistorial
  /** Nombre del médico que descarga (solo modo "medico"). */
  generadoPor?: string | null
  ahora: Date
}

export function construirPdfHistorial({
  paciente,
  entradas,
  modo,
  generadoPor,
  ahora,
}: OpcionesPdf): Uint8Array<ArrayBuffer> {
  const lineas: LineaPdf[] = [
    { texto: 'HELIOS - Historial clínico', estilo: 'titulo' },
    { texto: `Generado el ${sello(ahora)}`, estilo: 'pequeno' },
    { texto: 'Datos del paciente', estilo: 'subtitulo', separacion: 14 },
    { texto: `Nombre: ${paciente.nombre}` },
    { texto: `Cédula: ${paciente.cedula}` },
  ]
  if (paciente.fecha_nacimiento) {
    lineas.push({ texto: `Fecha de nacimiento: ${formatearFecha(paciente.fecha_nacimiento)}` })
  }
  if (modo === 'medico') {
    lineas.push({ texto: `Teléfono: ${paciente.telefono || 'No registrado'}` })
    lineas.push({ texto: `Correo: ${paciente.correo || 'No registrado'}` })
  }

  const alcance =
    modo === 'medico'
      ? `Incluye únicamente las atenciones registradas por ${generadoPor || 'el médico que genera este documento'}.`
      : 'Incluye las atenciones registradas por todos tus médicos en HELIOS.'
  lineas.push(
    { texto: 'Atenciones registradas', estilo: 'subtitulo', separacion: 14 },
    { texto: `${entradas.length} en total. ${alcance}`, estilo: 'pequeno' },
  )

  for (const e of ordenarEntradas(entradas)) {
    const cuando = `${formatearFecha(e.fecha)} · ${e.hora?.slice(0, 5) ?? SIN_DATO}`
    lineas.push({ texto: cuando, estilo: 'subtitulo', separacion: 12 })

    const quien =
      modo === 'paciente'
        ? [
            e.medico ?? 'Médico no disponible',
            e.especialidad ? `(${e.especialidad})` : null,
            e.sede ? `- ${e.sede}` : null,
          ]
        : [e.sede ? `Sede: ${e.sede}` : null]
    const textoQuien = quien.filter(Boolean).join(' ')
    if (textoQuien) lineas.push({ texto: textoQuien, estilo: 'pequeno' })

    lineas.push({ texto: `Dolencia principal: ${e.dolencia}`, separacion: 4 })
    lineas.push({ texto: `Receta: ${e.receta?.trim() || 'Sin receta'}` })
    if (modo === 'paciente' && e.notaPaciente) {
      lineas.push({ texto: `Mi nota (privada): ${e.notaPaciente}` })
    }
  }

  lineas.push({
    texto:
      modo === 'medico'
        ? 'Documento confidencial. Contiene información clínica del paciente. No incluye las notas privadas del médico ni del paciente.'
        : 'Documento confidencial. Contiene tu información clínica personal.',
    estilo: 'pequeno',
    separacion: 20,
  })

  return generarPdf(lineas)
}
