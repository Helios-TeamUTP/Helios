/**
 * Columnas que el cliente puede pedir de `citas` e `historial_clinico`.
 *
 * Historia (B-34 / B-35): la RLS de Postgres filtra FILAS, no columnas, asi
 * que un `select('*')` entregaba al navegador las notas privadas
 * (`citas.notas` al medico, `historial_clinico.notas_clinicas` al paciente).
 * Esas columnas ya fueron ELIMINADAS (B-34b/B-35b): cada nota vive en su
 * propia tabla con RLS de su autor (`cita_nota_paciente`,
 * `historial_nota_medico`).
 *
 * La regla se conserva como defensa contra regresiones: nada de `select('*')`
 * sobre estas tablas; si manana se agrega una columna sensible, no llega al
 * cliente por accidente. Hay un test que lo vigila (`columnas.test.ts`).
 */

/** Columnas de `citas` permitidas al cliente (la nota privada vive en `cita_nota_paciente`). */
export const COLUMNAS_CITA =
  'id, paciente_id, medico_id, horario_id, sede_id, estado, codigo_confirmacion, created_at'

/** Columnas de `historial_clinico` permitidas al cliente (la nota privada vive en `historial_nota_medico`). */
export const COLUMNAS_HISTORIAL =
  'id, cita_id, paciente_id, medico_id, dolencia_principal, receta, created_at'
