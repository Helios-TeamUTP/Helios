/**
 * Columnas que el cliente puede pedir de las tablas con notas privadas.
 *
 * La RLS de Postgres filtra FILAS, no columnas: un `select('*')` entrega al
 * navegador TODAS las columnas de las filas visibles. Por eso las columnas
 * legacy con notas privadas (`citas.notas`, `historial_clinico.notas_clinicas`)
 * NUNCA se piden desde el cliente (B-34 / B-35). Cada nota vive en su propia
 * tabla con RLS de su autor: `cita_nota_paciente` y `historial_nota_medico`.
 */

/** `citas` sin `notas` (nota privada del paciente, legacy). */
export const COLUMNAS_CITA =
  'id, paciente_id, medico_id, horario_id, sede_id, estado, codigo_confirmacion, created_at'

/** `historial_clinico` sin `notas_clinicas` (nota privada del medico, legacy). */
export const COLUMNAS_HISTORIAL =
  'id, cita_id, paciente_id, medico_id, dolencia_principal, receta, created_at'
