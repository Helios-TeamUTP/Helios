import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMedicoCitas } from '../hooks/useMedicoCitas'
import { useHistorialClinico } from '../hooks/useHistorialClinico'
import { useIsMobile } from '../hooks/useIsMobile'
import { FichaPaciente } from '../components/medico/FichaPaciente'
import { ModalCompletarCita } from '../components/medico/ModalCompletarCita'
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

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Formatea 'YYYY-MM-DD' a 'Lunes 18 de junio'. Local-safe (parsea los
 * componentes a mano, sin pasar por Date/UTC) para evitar el desfase de
 * timezone en Panamá (mismo criterio que el fix B-21).
 */
function formatFechaLarga(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number)
  if (!y || !m || !d) return fechaIso
  const fecha = new Date(y, m - 1, d)
  return `${DIAS[fecha.getDay()]} ${d} de ${MESES[fecha.getMonth()]}`
}

/** Agrupa citas (ya vienen ordenadas por fecha+hora del hook) en bloques por día. */
function agruparPorFecha(
  citas: CitaConPaciente[],
): { fecha: string; citas: CitaConPaciente[] }[] {
  const grupos: { fecha: string; citas: CitaConPaciente[] }[] = []
  for (const cita of citas) {
    const fecha = (cita as CitaConPaciente & { horario?: { fecha?: string } }).horario?.fecha ?? ''
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.fecha === fecha) ultimo.citas.push(cita)
    else grupos.push({ fecha, citas: [cita] })
  }
  return grupos
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

/** Fila de encabezado de día — solo se usa en la vista "Esta semana". */
function FilaDia({ fecha }: { fecha: string }) {
  return (
    <tr>
      <td colSpan={6} className="bg-helios-mist px-5 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-helios-primary">
          {formatFechaLarga(fecha)}
        </span>
      </td>
    </tr>
  )
}

interface AccionesCitaProps {
  cita: CitaConPaciente
  onVerFicha: () => void
  onIniciarCompletar: () => void
  onMarcarNoAsistio: () => Promise<void>
  soloLectura: boolean
}

/** Botones de una cita (ficha / completada / no asistió). Compartido por tabla y tarjetas. */
function AccionesCita({
  cita,
  onVerFicha,
  onIniciarCompletar,
  onMarcarNoAsistio,
  soloLectura,
}: Readonly<AccionesCitaProps>) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleNoAsistio = async () => {
    setWorking(true)
    setErr(null)
    try {
      await onMarcarNoAsistio()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {err && <span className="text-xs text-rose-500">{err}</span>}
      <button type="button" onClick={onVerFicha} className="btn-ghost py-1.5 text-xs">
        Ver ficha
      </button>
      {!soloLectura && cita.estado === 'confirmada' && (
        <>
          <button
            type="button"
            disabled={working}
            onClick={onIniciarCompletar}
            className="btn-primary py-1.5 text-xs"
          >
            ✓ Completada
          </button>
          <button
            type="button"
            disabled={working}
            onClick={handleNoAsistio}
            className="btn-secondary py-1.5 text-xs"
          >
            {working ? '…' : '✗ No asistió'}
          </button>
        </>
      )}
    </div>
  )
}

interface FilaCitaProps extends AccionesCitaProps {
  /** Sede donde atiende el médico (CU-05 2.1.2: la agenda muestra la sede de cada cita). */
  sede: string
}
function FilaCita({ sede, ...acciones }: Readonly<FilaCitaProps>) {
  const { cita } = acciones
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

      {/* Sede */}
      <td className="px-3 py-3.5 text-sm text-helios-ink/70">{sede}</td>

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
        <AccionesCita {...acciones} />
      </td>
    </tr>
  )
}

/** Tarjeta de una cita para pantallas < 768 px (lista agrupada por día). */
function TarjetaCita({ sede, ...acciones }: Readonly<FilaCitaProps>) {
  const { cita } = acciones
  const meta = ESTADO_META[cita.estado]
  const hora = cita.horario?.hora_inicio?.slice(0, 5) ?? '—:—'
  const pac = cita.paciente
  return (
    <li className="space-y-2 border-b border-helios-ink/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold tabular-nums text-helios-ink">{hora}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-helios-ink">
        {pac?.nombre ?? 'Paciente sin datos'}
      </p>
      <p className="text-xs text-helios-ink/50">
        {sede}
        {pac?.cedula ? ` · Cédula ${pac.cedula}` : ''}
      </p>
      <AccionesCita {...acciones} />
    </li>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

type Tab = 'hoy' | 'semana' | 'historial' | 'fecha'

const TAB_LABELS: Record<Tab, string> = {
  hoy: 'Agenda de hoy',
  semana: 'Esta semana',
  historial: 'Historial de citas',
  fecha: 'Agenda por fecha',
}

// CU-05 flujo 2.3.1: texto exacto del documento de casos de uso.
const SIN_CITAS_DIA = 'No tienes citas programadas para este día.'
const TAB_VACIO: Record<Tab, string> = {
  hoy: SIN_CITAS_DIA,
  semana: 'No tienes citas en los próximos 7 días.',
  historial: 'No hay citas anteriores registradas.',
  fecha: SIN_CITAS_DIA,
}

const ETIQUETA_TOTAL: Record<Tab, string> = {
  hoy: 'Citas de hoy',
  semana: 'Citas esta semana',
  historial: 'Citas de hoy',
  fecha: 'Citas del día',
}

/** Título de la tarjeta de agenda: con fecha elegida muestra "Agenda del Sábado 4 de julio". */
function tituloAgenda(tab: Tab, fechaSel: string): string {
  return tab === 'fecha' && fechaSel ? `Agenda del ${formatFechaLarga(fechaSel)}` : TAB_LABELS[tab]
}

export function MedicoDashboardV2() {
  const { medico } = useAuth()
  const [tab, setTab] = useState<Tab>('hoy')
  // Fecha elegida en el filtro de agenda (CU-05 2.1.3), YYYY-MM-DD.
  const [fechaSel, setFechaSel] = useState('')
  const esMovil = useIsMobile()
  const [pacienteFicha, setPacienteFicha] = useState<Paciente | null>(null)
  const [citaParaCompletar, setCitaParaCompletar] = useState<CitaConPaciente | null>(null)

  const {
    data: citas,
    loading,
    error,
    marcarNoAsistio,
    reflejarEstado,
  } = useMedicoCitas(medico?.id ?? null, tab, fechaSel || null)

  const { completarCita } = useHistorialClinico()

  if (!medico) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card">
          <ErrorMessage message="No se pudo cargar el perfil del médico. Cierra sesión e intenta de nuevo." />
        </div>
      </div>
    )
  }

  // ── métricas: validas para 'hoy' y 'semana' (snapshot en vivo); 'historial' no aplica ──
  const statsAplican = tab !== 'historial'
  const total = citas.length
  const completadas = citas.filter((c) => c.estado === 'completada').length
  const enEspera = citas.filter((c) => c.estado === 'confirmada').length
  const noAsistio = citas.filter((c) => c.estado === 'no_asistio').length

  // ── nombre corto para el saludo ──────────────────────────────────────────
  const nombreCorto = medico.nombre.split(' ')[0]

  // ── hora actual para saludo ───────────────────────────────────────────────
  const hora = new Date().getHours()
  const saludo =
    hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  /**
   * Completa la cita y guarda su informacion clinica en UNA operacion atomica
   * (RPC `completar_cita_con_historial`): o se guarda todo (historial + nota +
   * estado "completada") o no se guarda nada. Si falla, la excepcion llega al
   * modal, que muestra el mensaje y deja la cita sin cambios.
   */
  const handleGuardarCompletar = async (input: {
    dolenciaPrincipal: string
    receta: string | null
    notasClinicas: string | null
  }) => {
    if (!citaParaCompletar) return
    await completarCita({
      citaId: citaParaCompletar.id,
      dolenciaPrincipal: input.dolenciaPrincipal,
      receta: input.receta,
      notasClinicas: input.notasClinicas,
    })
    // La BD ya confirmo (historial + estado en una transaccion): reflejarlo sin spinner.
    reflejarEstado(citaParaCompletar.id, 'completada')
    setCitaParaCompletar(null)
  }

  // ── filas de la tabla (desktop) o tarjetas (< 768 px), agrupadas por día ──
  const sedeNombre = medico.sede?.nombre ?? '—'
  const propsCita = (cita: CitaConPaciente) => ({
    cita,
    sede: sedeNombre,
    soloLectura: tab === 'historial',
    onIniciarCompletar: () => setCitaParaCompletar(cita),
    onMarcarNoAsistio: () => marcarNoAsistio(cita.id),
    onVerFicha: () => {
      if (cita.paciente) setPacienteFicha(cita.paciente)
    },
  })

  const filas =
    tab === 'semana'
      ? agruparPorFecha(citas).flatMap((grupo) => [
          <FilaDia key={`dia-${grupo.fecha}`} fecha={grupo.fecha} />,
          ...grupo.citas.map((cita) => <FilaCita key={cita.id} {...propsCita(cita)} />),
        ])
      : citas.map((cita) => <FilaCita key={cita.id} {...propsCita(cita)} />)

  const tarjetas = agruparPorFecha(citas).map((grupo) => (
    <section key={`dia-${grupo.fecha}`}>
      <h3 className="bg-helios-mist px-4 py-2 text-xs font-bold uppercase tracking-wide text-helios-primary">
        {formatFechaLarga(grupo.fecha)}
      </h3>
      <ul>
        {grupo.citas.map((cita) => (
          <TarjetaCita key={cita.id} {...propsCita(cita)} />
        ))}
      </ul>
    </section>
  ))

  // CU-05 flujo 2.3.2: si el paciente cancela la cita mientras el médico la tiene
  // abierta para completarla, la agenda (Realtime) la quita de la lista. Se avisa
  // en vez de dejar abierto un formulario que la BD va a rechazar.
  const citaCancelada =
    citaParaCompletar !== null &&
    !loading &&
    !citas.some((c) => c.id === citaParaCompletar.id)

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
          label={ETIQUETA_TOTAL[tab]}
          value={statsAplican ? total : '—'}
          sub={!statsAplican ? 'Ver pestaña Hoy' : undefined}
          color="bg-helios-primary/10 text-helios-primary"
        />
        <StatCard
          icon={<CheckIcon />}
          label="Completadas"
          value={statsAplican ? completadas : '—'}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<ClockIcon />}
          label="En espera"
          value={statsAplican ? enEspera : '—'}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<XIcon />}
          label="No asistió"
          value={statsAplican ? noAsistio : '—'}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── Tabla de citas ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">

        {/* cabecera de la card */}
        <div className="flex flex-col gap-3 border-b border-helios-ink/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-helios-ink">{tituloAgenda(tab, fechaSel)}</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* filtro de agenda por fecha (CU-05 2.1.3) */}
            <label className="flex items-center gap-2 text-xs text-helios-ink/60">
              <span>Fecha</span>
              <input
                type="date"
                value={fechaSel}
                onChange={(e) => {
                  setFechaSel(e.target.value)
                  // Al borrar la fecha se vuelve a la agenda de hoy.
                  setTab(e.target.value ? 'fecha' : 'hoy')
                }}
                className="input py-1 text-sm"
              />
            </label>

            {/* tabs */}
            <div className="flex rounded-lg border border-helios-ink/10 bg-helios-mist p-0.5 text-sm">
              {(['hoy', 'semana', 'historial'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFechaSel('')
                    setTab(t)
                  }}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    tab === t
                      ? 'bg-white text-helios-ink shadow-sm'
                      : 'text-helios-ink/50 hover:text-helios-ink'
                  }`}
                >
                  {t === 'hoy' ? 'Hoy' : t === 'semana' ? 'Esta semana' : 'Historial'}
                </button>
              ))}
            </div>
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
            <p className="text-sm">{TAB_VACIO[tab]}</p>
          </div>
        )}

        {/* aviso: el paciente canceló la cita que el médico iba a completar (CU-05 2.3.2) */}
        {citaCancelada && (
          <div className="p-5">
            <ErrorMessage message="Esta cita fue cancelada por el paciente. Actualiza la agenda." />
            <button
              type="button"
              onClick={() => setCitaParaCompletar(null)}
              className="btn-secondary mt-3 py-1.5 text-xs"
            >
              Entendido
            </button>
          </div>
        )}

        {/* tabla (desktop) / lista agrupada por día (< 768 px) */}
        {!loading && !error && citas.length > 0 && !esMovil && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-helios-ink/5 text-xs font-medium text-helios-ink/40">
                <th className="py-3 pl-5 pr-3">Hora</th>
                <th className="px-3 py-3">Paciente</th>
                <th className="px-3 py-3">Sede</th>
                <th className="px-3 py-3">Estado</th>
                <th className="hidden px-3 py-3 sm:table-cell">Teléfono</th>
                <th className="py-3 pl-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>{filas}</tbody>
          </table>
        )}
        {!loading && !error && citas.length > 0 && esMovil && <div>{tarjetas}</div>}
      </div>

      {/* ── Modal ficha paciente ────────────────────────────────────────── */}
      {pacienteFicha && (
        <FichaPaciente
          paciente={pacienteFicha}
          onClose={() => setPacienteFicha(null)}
          generadoPor={medico.nombre}
        />
      )}

      {/* ── Modal completar cita (dolencia + receta) ───────────────────── */}
      {citaParaCompletar && !citaCancelada && (
        <ModalCompletarCita
          cita={citaParaCompletar}
          onClose={() => setCitaParaCompletar(null)}
          onGuardar={handleGuardarCompletar}
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
