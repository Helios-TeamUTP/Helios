/**
 * Dispara en el navegador la descarga de un archivo generado en memoria.
 * Funciona igual en escritorio y móvil (Blob + enlace con `download`).
 */
export function descargarBytes(
  bytes: Uint8Array<ArrayBuffer>,
  nombreArchivo: string,
  mime = 'application/pdf',
): void {
  const blob = new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // Liberar la URL en el siguiente ciclo: algunos navegadores aún la están leyendo.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
