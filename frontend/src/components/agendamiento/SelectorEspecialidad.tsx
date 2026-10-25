import { useEspecialidades } from '../../hooks/useEspecialidades'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'

interface Props {
  value: string | null
  onChange: (id: string, nombre: string) => void
}

export function SelectorEspecialidad({ value, onChange }: Readonly<Props>) {
  const { data, loading, error } = useEspecialidades()

  if (loading) return <LoadingSpinner label="Cargando especialidades…" />
  if (error) return <ErrorMessage message={error} />
  if (data.length === 0)
    return (
      <ErrorMessage message="No hay especialidades registradas. Pide al administrador que cargue datos." />
    )

  return (
    <fieldset className="min-w-0">
      <legend className="label">Especialidad</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((esp) => {
          const active = value === esp.id
          return (
            <button
              key={esp.id}
              type="button"
              onClick={() => onChange(esp.id, esp.nombre)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-helios-primary bg-helios-primary/5 ring-2 ring-helios-primary/40'
                  : 'border-helios-ink/10 bg-white hover:border-helios-primary/40'
              }`}
            >
              <div className="font-semibold text-helios-ink">{esp.nombre}</div>
              {esp.descripcion && (
                <div className="text-xs text-helios-ink/60">{esp.descripcion}</div>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
