import { Link } from 'react-router-dom'

interface Props {
  codigoConfirmacion: string
  medicoNombre: string
  especialidadNombre: string
  sedeNombre: string
  fecha: string
  horaInicio: string
  onAgendarOtra: () => void
}

export function ResumenCita({
  codigoConfirmacion,
  medicoNombre,
  especialidadNombre,
  sedeNombre,
  fecha,
  horaInicio,
  onAgendarOtra,
}: Props) {
  return (
    <div className="card text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-helios-accent/20 text-helios-primary">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-helios-ink">Cita agendada exitosamente</h2>
      <p className="mt-1 text-sm text-helios-ink/60">
        Guarda tu código de confirmación. Lo necesitarás el día de la cita.
      </p>
      <div className="mx-auto mt-6 inline-flex flex-col rounded-xl border-2 border-dashed border-helios-primary/30 bg-helios-primary/5 px-8 py-4">
        <span className="text-xs uppercase tracking-wider text-helios-primary">
          Código de confirmación
        </span>
        <span className="font-mono text-2xl font-bold text-helios-ink">{codigoConfirmacion}</span>
      </div>
      <dl className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Field label="Médico" value={`Dr(a). ${medicoNombre}`} />
        <Field label="Especialidad" value={especialidadNombre} />
        <Field label="Sede" value={sedeNombre} />
        <Field label="Fecha" value={fecha} />
        <Field label="Hora" value={horaInicio.slice(0, 5)} className="sm:col-span-2" />
      </dl>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={onAgendarOtra} className="btn-secondary">
          Agendar otra cita
        </button>
        <Link to="/mis-citas" className="btn-primary">
          Ver mis citas
        </Link>
      </div>
    </div>
  )
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg bg-helios-mist px-4 py-3 text-left ${className}`}>
      <dt className="text-xs uppercase tracking-wider text-helios-ink/40">{label}</dt>
      <dd className="mt-0.5 font-semibold text-helios-ink">{value}</dd>
    </div>
  )
}
