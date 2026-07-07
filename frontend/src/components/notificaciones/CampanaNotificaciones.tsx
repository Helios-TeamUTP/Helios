import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNotificaciones } from '../../hooks/useNotificaciones'
import type { Notificacion } from '../../lib/types'

/**
 * Sprint 4 (HELL-5): campanita de notificaciones en el header.
 *
 * Muestra un contador de no leidas y, al abrir, la lista en tiempo real.
 * El paciente y el medico ven cada quien las suyas (RLS + el id que pasamos).
 */
export function CampanaNotificaciones() {
  const { paciente, medico } = useAuth()
  const { data, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones(
    paciente?.id ?? null,
    medico?.id ?? null,
  )
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  // Cerrar el panel al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [abierto])

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-helios-ink/70 transition hover:bg-helios-ink/5"
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
      >
        <CampanaIcon />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-helios-logo px-1 text-[10px] font-bold leading-none text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-helios-ink/10 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-helios-ink/5 px-4 py-3">
            <span className="text-sm font-semibold text-helios-ink">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodasLeidas()}
                className="text-xs font-semibold text-helios-primary hover:underline"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-helios-ink/50">
                No tienes notificaciones todavía.
              </p>
            ) : (
              data.map((n) => (
                <ItemNotificacion key={n.id} n={n} onLeer={() => marcarLeida(n.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemNotificacion({ n, onLeer }: { n: Notificacion; onLeer: () => void }) {
  return (
    <button
      type="button"
      onClick={onLeer}
      className={`flex w-full gap-3 border-b border-helios-ink/5 px-4 py-3 text-left transition hover:bg-helios-mist ${
        n.leida ? 'opacity-60' : ''
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          n.leida ? 'bg-transparent' : 'bg-helios-logo'
        }`}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-helios-ink">{n.titulo}</span>
        <span className="mt-0.5 block text-xs text-helios-ink/70">{n.mensaje}</span>
      </span>
    </button>
  )
}

function CampanaIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
