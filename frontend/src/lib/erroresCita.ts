/**
 * CU-03 (Gestionar Cita): traduce el texto de los RAISE EXCEPTION de las RPC
 * `crear_cita_atomica`, `reprogramar_cita_atomica` y `cancelar_cita_atomica`
 * a los mensajes del documento de casos de uso (flujos de excepción 2.3.2,
 * 2.3.4 y 2.3.6). Hasta ahora el paciente veía el texto crudo de la BD
 * ("Horario ya reservado", "El medico ya alcanzo el maximo de 15 citas...").
 *
 * Si el mensaje no coincide con ningún caso conocido se devuelve tal cual: es
 * mejor mostrar el texto original que ocultar un error que no reconocemos.
 */

export const MSG_HORARIO_NO_DISPONIBLE = 'Ese horario ya no está disponible. Elige otro.'
export const MSG_DIA_SIN_CUPOS = 'Ese día ya no tiene cupos disponibles con este médico.'
export const MSG_CITA_NO_DISPONIBLE =
  'Esta cita ya no está disponible. Actualiza la información e intenta nuevamente.'

export function traducirErrorCita(mensaje: string): string {
  // 2.3.4 Tope diario alcanzado (el tope es una constante de la BD: no fijamos el número).
  if (/m[aá]ximo de \d+ citas/i.test(mensaje)) return MSG_DIA_SIN_CUPOS

  // 2.3.2 Otro paciente reservó el horario (o dejó de existir) mientras se elegía.
  if (/horario (ya )?(est[aá] )?reservado/i.test(mensaje) || /horario no existe/i.test(mensaje)) {
    return MSG_HORARIO_NO_DISPONIBLE
  }

  // 2.3.6 La cita cambió de estado por otro medio (p. ej. el médico la completó).
  if (
    /solo se pueden (cancelar|reprogramar) citas confirmadas/i.test(mensaje) ||
    /la cita no existe/i.test(mensaje)
  ) {
    return MSG_CITA_NO_DISPONIBLE
  }

  return mensaje
}
