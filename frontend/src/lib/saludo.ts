/**
 * Saludo segun la hora local del dia (0-23).
 * Vive en lib/ para poder probarse sin depender del reloj del sistema.
 */
export function saludoPorHora(hora: number): string {
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
