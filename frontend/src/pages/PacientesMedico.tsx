import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePacientesMedico } from '../hooks/usePacientesMedico'
import { FichaPaciente } from '../components/medico/FichaPaciente'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import type { Paciente } from '../lib/types'

// ─── helpers — mismos que MedicoDashboardV2 para consistencia visual ───────

function initials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

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

function formatFecha(fechaIso: string): string {
  try {
    return new Date(`${fechaIso}T00:00:00`).toLocaleDateString('es-PA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return fechaIso
  }
}

// ─── página ─────────────────────────────────────────────────────────────────

export function PacientesMedico() {
  const { medico } = useAuth()
  const { data: pacientes, loading, error } = usePacientesMedico(medico?.id ?? null)
  const [busqueda, setBusqueda] = useState('')
  const [pacienteFicha, setPacienteFicha] = useState<Paciente | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return pacientes
    return pacientes.filter(
      (p) =>
        p.paciente.nombre.toLowerCase().includes(q) ||
        p.paciente.cedula.toLowerCase().includes(q),
    )
  }, [pacientes, busqueda])

  if (!medico) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card">
          <ErrorMessage message="No se pudo cargar el perfil del médico. Cierra sesión e intenta de nuevo." />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/medico"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-helios-primary hover:underline"
          >
            ← Volver al resumen
          </Link>
          <h1 className="text-2xl font-bold text-helios-ink">Gestión de Pacientes</h1>
          <p className="mt-0.5 text-sm text-helios-ink/50">
            {pacientes.length} paciente{pacientes.length === 1 ? '' : 's'} atendido
            {pacientes.length === 1 ? '' : 's'} · Dr. {medico.nombre.split(' ')[0]}
          </p>
        </div>

        {/* búsqueda */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o cédula…"
            className="input pl-9"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-helios-ink/30"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* ── Card con la tabla ───────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {loading && (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner label="Cargando pacientes…" />
          </div>
        )}

        {!loading && error && (
          <div className="p-5">
            <ErrorMessage message={`No se pudo cargar la lista de pacientes: ${error}`} />
          </div>
        )}

        {!loading && !error && filtrados.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-helios-ink/40">
            <UsersIcon />
            <p className="text-sm">
              {busqueda
                ? 'Ningún paciente coincide con esa búsqueda.'
                : 'Aún no tienes citas completadas registradas.'}
            </p>
          </div>
        )}

        {!loading && !error && filtrados.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-helios-ink/5 text-xs font-medium text-helios-ink/40">
                <th className="py-3 pl-5 pr-3">Paciente</th>
                <th className="px-3 py-3">Dolencia principal</th>
                <th className="px-3 py-3">Última visita</th>
                <th className="px-3 py-3">Última receta</th>
                <th className="py-3 pl-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(({ paciente, dolencia_principal, receta, ultima_visita }) => {
                const col = avatarColor(paciente.nombre)
                return (
                  <tr
                    key={paciente.id}
                    className="group border-b border-helios-ink/5 transition hover:bg-helios-mist/60"
                  >
                    {/* Paciente */}
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${col}`}
                        >
                          {initials(paciente.nombre)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-helios-ink">
                            {paciente.nombre}
                          </p>
                          <p className="text-xs text-helios-ink/40">
                            Cédula {paciente.cedula}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Dolencia principal */}
                    <td className="max-w-xs px-3 py-3.5">
                      <p className="line-clamp-2 text-sm text-helios-ink/80">
                        {dolencia_principal}
                      </p>
                    </td>

                    {/* Última visita */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span className="text-sm text-helios-ink/70">
                        {formatFecha(ultima_visita)}
                      </span>
                    </td>

                    {/* Última receta */}
                    <td className="max-w-xs px-3 py-3.5">
                      {receta ? (
                        <p className="line-clamp-2 text-sm text-helios-ink/80">{receta}</p>
                      ) : (
                        <span className="text-xs italic text-helios-ink/30">
                          Sin receta registrada
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => setPacienteFicha(paciente)}
                        className="btn-ghost py-1.5 text-xs"
                      >
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ficha paciente ────────────────────────────────────────── */}
      {pacienteFicha && (
        <FichaPaciente paciente={pacienteFicha} onClose={() => setPacienteFicha(null)} />
      )}
    </div>
  )
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
