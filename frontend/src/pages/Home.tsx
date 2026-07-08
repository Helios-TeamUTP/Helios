import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Home() {
  const { user, paciente } = useAuth()

  return (
    <section className="grid items-center gap-12 md:grid-cols-2">
      <div>
        <span className="inline-flex items-center rounded-full bg-helios-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-helios-primary">
          Agenda tu cita en minutos
        </span>
        <h1 className="mt-4 text-4xl font-bold text-helios-ink md:text-5xl">
          Tu cita médica, sin filas y en menos de 2 minutos.
        </h1>
        <p className="mt-4 text-lg text-helios-ink/70">
          HELIOS unifica las policlínicas de la red para que escojas sede, especialidad, médico y
          horario con un solo flujo. Confirmación inmediata y código de cita guardado a tu nombre.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link to="/agendar" className="btn-primary">
                Agendar una cita
              </Link>
              <Link to="/mis-citas" className="btn-secondary">
                Ver mis citas
              </Link>
            </>
          ) : (
            <>
              <Link to="/registro" className="btn-primary">
                Crear cuenta gratuita
              </Link>
              <Link to="/login" className="btn-secondary">
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
        {paciente && (
          <p className="mt-6 text-sm text-helios-ink/60">
            Hola, <strong>{paciente.nombre}</strong>. Cédula registrada: {paciente.cedula}
          </p>
        )}
      </div>
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-helios-ink">¿Cómo funciona?</h2>
        <ol className="space-y-3 text-sm text-helios-ink/80">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-helios-primary/10 text-helios-primary font-semibold">
              1
            </span>
            <span>Selecciona la especialidad y la sede más cercana.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-helios-primary/10 text-helios-primary font-semibold">
              2
            </span>
            <span>Escoge un médico disponible.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-helios-primary/10 text-helios-primary font-semibold">
              3
            </span>
            <span>Elige día y hora en el calendario.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-helios-primary/10 text-helios-primary font-semibold">
              4
            </span>
            <span>Confirma y recibe tu código de cita.</span>
          </li>
        </ol>
        <div className="rounded-lg bg-helios-primary/5 px-4 py-3 text-xs text-helios-primary">
          Disponibilidad sincronizada en tiempo real entre todas las sedes.
        </div>
      </div>
    </section>
  )
}
