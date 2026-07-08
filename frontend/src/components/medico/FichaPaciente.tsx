import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CitaConRelaciones, HistorialClinico, Paciente } from '../../lib/types'
import { LoadingSpinner } from '../shared/LoadingSpinner'

interface FichaPacienteProps {
  paciente: Paciente
  /** Cierra el modal */
  onClose: () => void
}

/**
 * Modal con los datos de un paciente + sus ultimas 5 citas con cualquier
 * medico, incluyendo dolencia principal y receta cuando existan.
 *
 * Bug B-13: componente nuevo del dashboard de medicos.
 * v2: agrega historial_clinico (dolencia_principal, receta) por cita.
 * RLS de historial_clinico solo permite ver lo que el medico logueado
 * escribio — si otro medico atendio esa cita, el campo simplemente no
 * aparece (comportamiento correcto de privacidad, no es un bug).
 *
 * UX: cierra con boton X, click en backdrop, o tecla Escape.
 */
export function FichaPaciente({ paciente, onClose }: FichaPacienteProps) {
  const [historial, setHistorial] = useState<CitaConRelaciones[]>([])
  const [clinico, setClinico] = useState<Map<string, HistorialClinico>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const signal = { active: true }
    ;(async () => {
      try {
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select(
            '*, horario:horarios(*), medico:medicos(*, especialidad:especialidades(*)), sede:sedes(*)',
          )
          .eq('paciente_id', paciente.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (citasError) throw citasError

        // Historial clinico de estas citas (RLS ya filtra a lo que el
        // medico logueado puede ver: solo lo que el mismo escribio).
        const { data: hist, error: histError } = await supabase
          .from('historial_clinico')
          .select('*')
          .eq('paciente_id', paciente.id)

        if (histError) throw histError

        if (!signal.active) return

        setHistorial((citas ?? []) as unknown as CitaConRelaciones[])
        setClinico(
          new Map(((hist ?? []) as HistorialClinico[]).map((h) => [h.cita_id, h])),
        )
      } catch (err) {
        if (signal.active) {
          console.error('[FichaPaciente] unexpected:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (signal.active) setLoading(false)
      }
    })()
    return () => {
      signal.active = false
    }
  }, [paciente.id])

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${paciente.nombre}`}
    >
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-helios-ink">{paciente.nombre}</h2>
            <p className="text-sm text-helios-ink/60">Ficha del paciente</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-2"
            aria-label="Cerrar ficha"
          >
            ✕
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-helios-ink/50">Cédula</dt>
            <dd className="font-medium">{paciente.cedula}</dd>
          </div>
          <div>
            <dt className="text-helios-ink/50">Teléfono</dt>
            <dd className="font-medium">
              {paciente.telefono ? (
                <a
                  href={`tel:${paciente.telefono}`}
                  className="text-helios-primary hover:underline"
                >
                  {paciente.telefono}
                </a>
              ) : (
                <span className="italic text-helios-ink/40">No registrado</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-helios-ink/50">Correo</dt>
            <dd className="font-medium">
              {paciente.correo ?? (
                <span className="italic text-helios-ink/40">No registrado</span>
              )}
            </dd>
          </div>
          {paciente.fecha_nacimiento && (
            <div>
              <dt className="text-helios-ink/50">Fecha de nacimiento</dt>
              <dd className="font-medium">{paciente.fecha_nacimiento}</dd>
            </div>
          )}
        </dl>

        <hr className="my-5 border-helios-ink/10" />

        <h3 className="text-sm font-semibold text-helios-ink/80">Últimas 5 citas</h3>
        {loading && (
          <div className="mt-3 flex justify-center">
            <LoadingSpinner label="Cargando historial…" />
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            No se pudo cargar el historial: {error}
          </p>
        )}
        {!loading && !error && historial.length === 0 && (
          <p className="mt-3 text-sm italic text-helios-ink/50">
            Este paciente no tiene citas registradas previas.
          </p>
        )}
        {!loading && !error && historial.length > 0 && (
          <ul className="mt-3 space-y-2">
            {historial.map((c) => {
              const hist = clinico.get(c.id)
              return (
                <li
                  key={c.id}
                  className="rounded-lg border border-helios-ink/10 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {c.horario?.fecha ?? '—'} · {c.horario?.hora_inicio?.slice(0, 5) ?? '—'}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-helios-ink/50">
                      {c.estado}
                    </span>
                  </div>
                  <p className="text-helios-ink/70">
                    {c.medico?.nombre ?? 'Médico desconocido'}
                    {c.medico?.especialidad?.nombre && ` — ${c.medico.especialidad.nombre}`}
                  </p>

                  {hist && (
                    <div className="mt-2 space-y-1 border-t border-helios-ink/5 pt-2">
                      <p>
                        <span className="font-semibold text-helios-ink/60">Dolencia: </span>
                        <span className="text-helios-ink/80">{hist.dolencia_principal}</span>
                      </p>
                      {hist.receta && (
                        <p>
                          <span className="font-semibold text-helios-ink/60">Receta: </span>
                          <span className="text-helios-ink/80">{hist.receta}</span>
                        </p>
                      )}
                      {hist.notas_clinicas && (
                        <p>
                          <span className="font-semibold text-helios-ink/60">Notas: </span>
                          <span className="text-helios-ink/80">{hist.notas_clinicas}</span>
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
