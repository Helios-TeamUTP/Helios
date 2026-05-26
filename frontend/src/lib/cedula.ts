export function isValidCedulaPanama(cedula: string): boolean {
  if (!cedula) return false
  const clean = cedula.trim().toUpperCase()
  // Quitamos prefijo PE/N/E opcional y todos los guiones; queda solo dígitos.
  const soloDigitos = clean.replace(/^(PE|N|E)-?/, '').replace(/-/g, '')
  // Cédula panameña válida: entre 5 y 12 dígitos (cubre naturales, naturalizados, extranjeros).
  return /^[0-9]{5,12}$/.test(soloDigitos)
}

export function normalizeCedula(cedula: string): string {
  return cedula.trim().toUpperCase()
}
