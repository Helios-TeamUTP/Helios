interface Props {
  readonly message: string
}

/** Contraparte "positiva" de ErrorMessage. Feedback específico por acción
 * (ej. "Nombre actualizado ✓"), no un mensaje genérico.
 *
 * Usa <output> (rol implícito "status") en vez de un <div role="status">
 * — recomendación de SonarCloud sobre usar el elemento HTML semántico
 * correcto en vez de un rol ARIA sobre un div genérico. */
export function SuccessMessage({ message }: Props) {
  return (
    <output className="block rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      {message}
    </output>
  )
}
