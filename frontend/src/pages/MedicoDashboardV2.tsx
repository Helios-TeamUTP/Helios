import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMedicoCitas } from '../hooks/useMedicoCitas'
import { FichaPaciente } from '../components/medico/FichaPaciente'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import type { CitaConPaciente, EstadoCita, Paciente } from '../lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

const ESTADO_META: Record<EstadoCita, { label: string; dot: string; badge: string }> = {
  confirmada: {
    label: 'En espera',
    dot: 'bg-blue-400',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  completada: {
    label: 'Completada',
    dot: 'bg-helios-primary',
    badge: 'bg-green-50 text-green-700 ring-green-200',
  },
  no_asistio: {
    label: 'No asistió',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  cancelada: {
    label: 'Cancelada',
    dot: 'bg-rose-400',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
}

/** Iniciales para avatar — máx 2 letras */
function initials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/** Color de avatar determinista por nombre */
const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
]
function avatarColor(nombre: string): string {
  let hash = 0
  for (const ch of nombre) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ─── sub-componentes ─────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
}
function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-helios-ink/50">{label}</p>
        <p className="text-2xl font-bold text-helios-ink">{value}</p>
        {sub && <p className="text-xs text-helios-ink/40">{sub}</p>}
      </div>
    </div>
  )
}

interface FilaCitaProps {
  cita: CitaConPaciente
  onVerFicha: () => void
  onMarcar: (estado: EstadoCita) => Promise<void>
  modoHistorial: boolean
}
function FilaCita({ cita, onVerFicha, onMarcar, modoHistorial }: FilaCitaProps) {
  const [working, setWorking] = useState<EstadoCita | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const handleMarcar = async (estado: EstadoCita) => {
    setWorking(estado)
    setErr(null)
    try {
      await onMarcar(estado)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
    } finally {
      setWorking(null)
    }
  }

  const meta = ESTADO_META[cita.estado]
  const hora = cita.horario?.hora_inicio?.slice(0, 5) ?? '—:—'
  const pac = cita.paciente
  const nombre = pac?.nombre ?? 'Paciente sin datos'
  const col = avatarColor(nombre)

  return (
    <tr className="group border-b border-helios-ink/5 transition hover:bg-helios-mist/60">
      {/* Hora */}
      <td className="py-3.5 pl-5 pr-3 tabular-nums">
        <span className="text-sm font-semibold text-helios-ink">{hora}</span>
      </td>

      {/* Paciente */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${col}`}
          >
            {initials(nombre)}
          </span>
          <div>
            <p className="text-sm font-semibold text-helios-ink">{nombre}</p>
            {pac?.cedula && (
              <p className="text-xs text-helios-ink/40">Cédula {pac.cedula}</p>
            )}
          </div>
        </div>
      </td>

      {/* Estado */}
      <td className="px-3 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </td>

      {/* Teléfono */}
      <td className="hidden px-3 py-3.5 sm:table-cell">
        {pac?.telefono ? (
          <a
            href={`tel:${pac.telefono}`}
            className="text-sm text-helios-primary hover:underline"
          >
            {pac.telefono}
          </a>
        ) : (
          <span className="text-xs text-helios-ink/30">—</span>
        )}
      </td>

      {/* Acciones */}
      <td className="py-3.5 pl-3 pr-5">
        <div className="flex items-center justify-end gap-2">
          {err && <span className="text-xs text-rose-500">{err}</span>}
          <button
            type="button"
            onClick={onVerFicha}
            className="btn-ghost py-1.5 text-xs"
          >
            Ver ficha
          </button>
          {!modoHistorial && cita.estado === 'confirmada' && (
            <>
              <button
                type="button"
                disabled={working !== null}
                onClick={() => handleMarcar('completada')}
                className="btn-primary py-1.5 text-xs"
              >
                {working === 'completada' ? '…' : '✓ Completada'}
              </button>
              <button
                type="button"
                disabled={working !== null}
                onClick={() => handleMarcar('no_asistio')}
                className="btn-secondary py-1.5 text-xs"
              >
                {working === 'no_asistio' ? '…' : '✗ No asistió'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

type Tab = 'hoy' | 'historial'

export function MedicoDashboardV2() {
  const { medico } = useAuth()
  const [tab, setTab] = useState<Tab>('hoy')
  const [pacienteFicha, setPacienteFicha] = useState<Paciente | null>(null)

  const {
    data: citas,
    loading,
    error,
    marcarEstado,
  } = useMedicoCitas(medico?.id ?? null, tab)

  if (!medico) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card">
          <ErrorMessage message="No se pudo cargar el perfil del médico. Cierra sesión e intenta de nuevo." />
        </div>
      </div>
    )
  }

  // ── métricas derivadas de las citas del día ──────────────────────────────
  const totalHoy = citas.length
  const completadas = citas.filter((c) => c.estado === 'completada').length
  const enEspera = citas.filter((c) => c.estado === 'confirmada').length
  const noAsistio = citas.filter((c) => c.estado === 'no_asistio').length

  // ── nombre corto para el saludo ──────────────────────────────────────────
  const nombreCorto = medico.nombre.split(' ')[0]

  // ── hora actual para saludo ───────────────────────────────────────────────
  const hora = new Date().getHours()
  const saludo =
    hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-helios-ink/50">{saludo},</p>
          <h1 className="text-2xl font-bold text-helios-ink">
            Dr. {nombreCorto}
          </h1>
          <p className="mt-0.5 text-sm text-helios-ink/50">
            {medico.especialidad?.nombre ?? 'Sin especialidad'}
            {medico.sede?.nombre ? ` · ${medico.sede.nombre}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-sm text-helios-ink/40">
            {new Date().toLocaleDateString('es-PA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <Link to="/medico/pacientes" className="btn-secondary py-1.5 text-xs">
            Gestión de Pacientes →
          </Link>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<CalendarIcon />}
          label="Citas de hoy"
          value={tab === 'hoy' ? totalHoy : '—'}
          sub={tab === 'historial' ? 'Ver pestaña Hoy' : undefined}
          color="bg-helios-primary/10 text-helios-primary"
        />
        <StatCard
          icon={<CheckIcon />}
          label="Completadas"
          value={tab === 'hoy' ? completadas : '—'}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<ClockIcon />}
          label="En espera"
          value={tab === 'hoy' ? enEspera : '—'}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<XIcon />}
          label="No asistió"
          value={tab === 'hoy' ? noAsistio : '—'}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── Tabla de citas ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">

        {/* cabecera de la card */}
        <div className="flex items-center justify-between border-b border-helios-ink/5 px-5 py-4">
          <h2 className="font-semibold text-helios-ink">
            {tab === 'hoy' ? 'Agenda de hoy' : 'Historial de citas'}
          </h2>

          {/* tabs */}
          <div className="flex rounded-lg border border-helios-ink/10 bg-helios-mist p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setTab('hoy')}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                tab === 'hoy'
                  ? 'bg-white text-helios-ink shadow-sm'
                  : 'text-helios-ink/50 hover:text-helios-ink'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setTab('historial')}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                tab === 'historial'
                  ? 'bg-white text-helios-ink shadow-sm'
                  : 'text-helios-ink/50 hover:text-helios-ink'
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {/* estados de carga / error / vacío */}
        {loading && (
          <div className="flex min-h-[180px] items-center justify-center">
            <LoadingSpinner label="Cargando agenda…" />
          </div>
        )}
        {!loading && error && (
          <div className="p-5">
            <ErrorMessage message={`No se pudo cargar la agenda: ${error}`} />
          </div>
        )}
        {!loading && !error && citas.length === 0 && (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-helios-ink/40">
            <CalendarIcon />
            <p className="text-sm">
              {tab === 'hoy'
                ? 'No tienes citas asignadas para hoy.'
                : 'No hay citas anteriores registradas.'}
            </p>
          </div>
        )}

        {/* tabla */}
        {!loading && !error && citas.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-helios-ink/5 text-xs font-medium text-helios-ink/40">
                <th className="py-3 pl-5 pr-3">Hora</th>
                <th className="px-3 py-3">Paciente</th>
                <th className="px-3 py-3">Estado</th>
                <th className="hidden px-3 py-3 sm:table-cell">Teléfono</th>
                <th className="py-3 pl-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <FilaCita
                  key={cita.id}
                  cita={cita}
                  modoHistorial={tab === 'historial'}
                  onMarcar={(estado) => marcarEstado(cita.id, estado)}
                  onVerFicha={() => {
                    if (cita.paciente) setPacienteFicha(cita.paciente)
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ficha paciente ────────────────────────────────────────── */}
      {pacienteFicha && (
        <FichaPaciente
          paciente={pacienteFicha}
          onClose={() => setPacienteFicha(null)}
        />
      )}
    </div>
  )
}

// ─── iconos SVG inline (sin dependencias extra) ───────────────────────────────

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
