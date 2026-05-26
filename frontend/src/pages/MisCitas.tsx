import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCitas } from '../hooks/useCitas'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'

export function MisCitas() {
  const { paciente } = useAuth()
  const { data, loading, error } = useCitas(paciente?.id ?? null)

  if (!paciente) {
    return (
      <div className="card text-center">
        <p className="text-helios-ink/70">
          Necesitas registrarte como paciente antes de ver tus citas.
        </p>
        <Link to="/registro" className="btn-primary mt-4 inline-block">
          Crear cuenta
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-helios-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-helios-primary">
            US-05 · Mis citas
          </span>
          <h1 className="mt-2 text-3xl font-bold text-helios-ink">Hola, {paciente.nombre}</h1>
          <p className="text-sm text-helios-ink/60">Cédula registrada: {paciente.cedula}</p>
        </div>
        <Link to="/agendar" className="btn-primary">
          Agendar nueva cita
        </Link>
      </header>

      {loading && <LoadingSpinner label="Cargando tus citas…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && data.length === 0 && (
        <div className="card text-center text-sm text-helios-ink/60">
          Aún no tienes citas agendadas.
        </div>
      )}

      <ul className="space-y-3">
        {data.map((cita) => (
          <li key={cita.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-helios-primary">
                  {cita.estado}
                </div>
                <div className="text-xl font-bold text-helios-ink">
                  Dr(a). {cita.medico?.nombre ?? 'Sin asignar'}
                </div>
                <div className="text-sm text-helios-ink/70">
                  {cita.medico?.especialidad?.nombre ?? '—'} · {cita.sede?.nombre ?? '—'}
                </div>
              </div>
              <div className="rounded-lg bg-helios-mist px-4 py-2 text-right">
                <div className="text-xs uppercase tracking-wider text-helios-ink/40">Código</div>
                <div className="font-mono text-base font-bold text-helios-ink">
                  {cita.codigo_confirmacion}
                </div>
              </div>
            </div>
            {cita.horario && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-helios-ink/80">
                <span>
                  📅 <strong>{cita.horario.fecha}</strong>
                </span>
                <span>
                  🕒 {cita.horario.hora_inicio.slice(0, 5)} — {cita.horario.hora_fin.slice(0, 5)}
                </span>
              </div>
            )}
            {cita.notas && (
              <div className="mt-3 rounded-lg bg-helios-mist px-3 py-2 text-sm text-helios-ink/70">
                <strong>Notas:</strong> {cita.notas}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
