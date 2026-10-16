import { useMedicos } from '../../hooks/useMedicos'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'

interface Props {
  sedeId: string
  especialidadId: string
  value: string | null
  onChange: (id: string, nombre: string) => void
}

export function ListaMedicos({ sedeId, especialidadId, value, onChange }: Readonly<Props>) {
  const { data, loading, error } = useMedicos(sedeId, especialidadId)

  if (loading) return <LoadingSpinner label="Buscando médicos disponibles…" />
  if (error) return <ErrorMessage message={error} />
  if (data.length === 0)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        No hay médicos disponibles para la combinación seleccionada. Prueba con otra sede o
        especialidad.
      </div>
    )

  return (
    <ul className="space-y-2">
      {data.map((medico) => {
        const active = value === medico.id
        return (
          <li key={medico.id}>
            <button
              type="button"
              onClick={() => onChange(medico.id, medico.nombre)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-helios-primary bg-helios-primary/5 ring-2 ring-helios-primary/40'
                  : 'border-helios-ink/10 bg-white hover:border-helios-primary/40'
              }`}
            >
              <div>
                <div className="font-semibold text-helios-ink">Dr(a). {medico.nombre}</div>
                <div className="text-xs text-helios-ink/60">
                  {medico.especialidad?.nombre} · {medico.sede?.nombre}
                </div>
              </div>
              <span className="text-xs text-helios-primary">Seleccionar →</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
