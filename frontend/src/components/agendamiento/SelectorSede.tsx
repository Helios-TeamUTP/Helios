import { useSedes } from '../../hooks/useSedes'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'

interface Props {
  value: string | null
  onChange: (id: string, nombre: string) => void
}

export function SelectorSede({ value, onChange }: Readonly<Props>) {
  const { data, loading, error } = useSedes()

  if (loading) return <LoadingSpinner label="Cargando sedes…" />
  if (error) return <ErrorMessage message={error} />
  if (data.length === 0)
    return <ErrorMessage message="No hay sedes activas registradas." />

  return (
    <fieldset className="min-w-0">
      <legend className="label">Sede</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((sede) => {
          const active = value === sede.id
          return (
            <button
              key={sede.id}
              type="button"
              onClick={() => onChange(sede.id, sede.nombre)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-helios-primary bg-helios-primary/5 ring-2 ring-helios-primary/40'
                  : 'border-helios-ink/10 bg-white hover:border-helios-primary/40'
              }`}
            >
              <div className="font-semibold text-helios-ink">{sede.nombre}</div>
              <div className="text-xs text-helios-ink/60">{sede.ciudad}</div>
              {sede.direccion && (
                <div className="mt-1 text-xs text-helios-ink/40">{sede.direccion}</div>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
