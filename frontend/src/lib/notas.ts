import type { NotaEmbed } from './types'

/**
 * Extrae el texto de una nota privada embebida por PostgREST
 * (`cita_nota_paciente` / `historial_nota_medico`).
 *
 * PostgREST devuelve una relacion 1-a-1 como objeto, pero si no detecta la
 * unicidad la devuelve como arreglo; aceptamos ambas formas para no depender
 * de ese detalle. Devuelve null si no hay nota o esta vacia.
 */
export function textoNota(embed: NotaEmbed | NotaEmbed[] | null | undefined): string | null {
  const nota = Array.isArray(embed) ? embed[0] : embed
  const texto = nota?.nota?.trim()
  return texto ? texto : null
}
