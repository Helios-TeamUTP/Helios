interface Props {
  message: string
}

/** Contraparte "positiva" de ErrorMessage. Feedback específico por acción
 * (ej. "Nombre actualizado ✓"), no un mensaje genérico. */
export function SuccessMessage({ message }: Props) {
  return (
    <div
      role="status"
      className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {message}
    </div>
  )
}
