/**
 * @deprecated Reemplazado por MedicoDashboardV2.tsx (rama feature/dashboard-medico).
 * Mantenido para referencia histórica — no está montado en el router.
 */
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMedicoCitas } from '../hooks/useMedicoCitas'
import { CitaCardMedico } from '../components/medico/CitaCardMedico'
import { FichaPaciente } from '../components/medico/FichaPaciente'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import type { CitaConPaciente, Paciente } from '../lib/types'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Formatea 'YYYY-MM-DD' a 'Lunes 18 de junio'. Local-safe (parsea los
 * componentes a mano) para evitar el desfase de timezone en Panamá (B-21).
 */
function formatFechaLarga(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number)
  if (!y || !m || !d) return fechaIso
  const fecha = new Date(y, m - 1, d)
  return `${DIAS[fecha.getDay()]} ${d} de ${MESES[fecha.getMonth()]}`
}

/** Agrupa citas (ya ordenadas por fecha) en bloques por día para la vista de semana. */
function agruparPorFecha(
  citas: CitaConPaciente[],
): { fecha: string; citas: CitaConPaciente[] }[] {
  const grupos: { fecha: string; citas: CitaConPaciente[] }[] = []
  for (const cita of citas) {
    const fecha = cita.horario?.fecha ?? ''
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.fecha === fecha) ultimo.citas.push(cita)
    else grupos.push({ fecha, citas: [cita] })
  }
  return grupos
}

type Tab = 'hoy' | 'semana' | 'historial'

export function MedicoDashboard() {
  const { medico } = useAuth()
  const [tab, setTab] = useState<Tab>('hoy')
  const [pacienteFicha, setPacienteFicha] = useState<Paciente | null>(null)

  const { data: citas, loading, error, marcarEstado } = useMedicoCitas(medico?.id ?? null, tab)

  if (!medico) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card">
          <ErrorMessage message="No se pudo cargar el perfil del médico. Intenta cerrar sesión y entrar de nuevo." />
        </div>
      </div>
    )
  }

  // Render de una tarjeta de cita (reutilizado por la vista plana y la de semana).
  const renderCita = (cita: CitaConPaciente) => (
    <CitaCardMedico
      cita={cita}
      modoHistorial={tab === 'historial'}
      onMarcarEstado={(nuevoEstado) => marcarEstado(cita.id, nuevoEstado)}
      onVerFicha={() => {
        if (cita.paciente) setPacienteFicha(cita.paciente)
      }}
    />
  )

  return (
    <div className="mx-auto max-w-3xl">
      <header className="card mb-6">
        <h1 className="text-2xl font-bold text-helios-deep">{medico.nombre}</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          {medico.especialidad?.nombre ?? 'Sin especialidad asignada'}
          {medico.sede?.nombre && ` · ${medico.sede.nombre}`}
        </p>
      </header>

      <div className="mb-4 flex gap-2 border-b border-helios-ink/10">
        <button
          type="button"
          onClick={() => setTab('hoy')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === 'hoy'
              ? 'border-helios-primary text-helios-primary'
              : 'border-transparent text-helios-ink/60 hover:text-helios-ink'
          }`}
        >
          Agenda de hoy
        </button>
        <button
          type="button"
          onClick={() => setTab('semana')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === 'semana'
              ? 'border-helios-primary text-helios-primary'
              : 'border-transparent text-helios-ink/60 hover:text-helios-ink'
          }`}
        >
          Esta semana
        </button>
        <button
          type="button"
          onClick={() => setTab('historial')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === 'historial'
              ? 'border-helios-primary text-helios-primary'
              : 'border-transparent text-helios-ink/60 hover:text-helios-ink'
          }`}
        >
          Historial
        </button>
      </div>

      {loading && (
        <div className="flex min-h-[20vh] items-center justify-center">
          <LoadingSpinner label="Cargando agenda…" />
        </div>
      )}
      {error && <ErrorMessage message={`No se pudo cargar la agenda: ${error}`} />}
      {!loading && !error && citas.length === 0 && (
        <div className="card text-center text-helios-ink/60">
          {tab === 'hoy'
            ? 'No tienes citas asignadas para hoy.'
            : tab === 'semana'
            ? 'No tienes citas en los próximos 7 días.'
            : 'No tienes citas anteriores registradas.'}
        </div>
      )}
      {!loading && !error && citas.length > 0 && (
        tab === 'semana' ? (
          // Vista de semana: agrupada por día, con un encabezado de fecha por bloque.
          <div className="space-y-6">
            {agruparPorFecha(citas).map((grupo) => (
              <section key={grupo.fecha}>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-helios-primary">
                  {formatFechaLarga(grupo.fecha)}
                </h2>
                <ul className="space-y-3">
                  {grupo.citas.map((cita) => (
                    <li key={cita.id}>{renderCita(cita)}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {citas.map((cita) => (
              <li key={cita.id}>{renderCita(cita)}</li>
            ))}
          </ul>
        )
      )}

      {pacienteFicha && (
        <FichaPaciente paciente={pacienteFicha} onClose={() => setPacienteFicha(null)} />
      )}
    </div>
  )
}
