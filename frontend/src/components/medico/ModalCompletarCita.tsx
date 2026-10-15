import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { CitaConPaciente } from '../../lib/types'

interface ModalCompletarCitaProps {
  cita: CitaConPaciente
  onClose: () => void
  onGuardar: (input: {
    dolenciaPrincipal: string
    receta: string | null
    notasClinicas: string | null
  }) => Promise<void>
}

/**
 * Modal que el medico completa AL MARCAR una cita como 'completada'.
 * Captura dolencia_principal (obligatoria) y receta/notas (opcionales)
 * y las guarda en historial_clinico ANTES de cambiar el estado de la
 * cita — así queda ligado a la cita exacta, no a un registro suelto.
 *
 * UX: cierra con boton X, click en backdrop (si no esta enviando),
 * o boton Cancelar. No se puede cerrar mientras se esta guardando.
 */
export function ModalCompletarCita({ cita, onClose, onGuardar }: ModalCompletarCitaProps) {
  const [dolencia, setDolencia] = useState('')
  const [receta, setReceta] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nombre = cita.paciente?.nombre ?? 'este paciente'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dolenciaLimpia = dolencia.trim()
    if (!dolenciaLimpia) {
      setError('La dolencia principal es obligatoria para completar la cita.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await onGuardar({
        dolenciaPrincipal: dolenciaLimpia,
        receta: receta.trim() || null,
        notasClinicas: notas.trim() || null,
      })
      // El padre cierra el modal tras exito (evita doble-submit si algo tarda)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Intenta de nuevo.')
      setEnviando(false)
    }
  }

  // Clic en el fondo (no dentro de la tarjeta) o Escape cierran el modal, salvo mientras se guarda.
  const cerrarPorFondo = (e: MouseEvent<HTMLDivElement>) => {
    if (!enviando && e.target === e.currentTarget) onClose()
  }
  const cerrarConEscape = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !enviando) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={cerrarPorFondo}
      onKeyDown={cerrarConEscape}
      role="dialog"
      aria-modal="true"
      aria-label="Completar cita"
    >
      <form onSubmit={handleSubmit} className="card w-full max-w-md">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-helios-ink">Completar cita</h2>
            <p className="mt-1 text-sm text-helios-ink/60">
              Registra el motivo de la consulta de <strong>{nombre}</strong> antes de
              marcarla como completada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="btn-ghost px-2"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="dolencia" className="label">
              Dolencia principal <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="dolencia"
              className="input"
              rows={2}
              value={dolencia}
              onChange={(e) => setDolencia(e.target.value)}
              placeholder="Ej.: Dolor abdominal difuso de 2 días de evolución"
              disabled={enviando}
              required
            />
          </div>

          <div>
            <label htmlFor="receta" className="label">
              Receta <span className="font-normal text-helios-ink/40">(opcional)</span>
            </label>
            <textarea
              id="receta"
              className="input"
              rows={2}
              value={receta}
              onChange={(e) => setReceta(e.target.value)}
              placeholder="Ej.: Ibuprofeno 400mg cada 8 horas por 3 días"
              disabled={enviando}
            />
          </div>

          <div>
            <label htmlFor="notas" className="label">
              Notas clínicas <span className="font-normal text-helios-ink/40">(opcional)</span>
            </label>
            <textarea
              id="notas"
              className="input"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones adicionales…"
              disabled={enviando}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={enviando} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? 'Guardando…' : 'Guardar y completar'}
          </button>
        </div>
      </form>
    </div>
  )
}
