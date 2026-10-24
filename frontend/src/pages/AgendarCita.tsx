import { useReducer, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SelectorEspecialidad } from '../components/agendamiento/SelectorEspecialidad'
import { SelectorSede } from '../components/agendamiento/SelectorSede'
import { ListaMedicos } from '../components/agendamiento/ListaMedicos'
import { CalendarioCitas } from '../components/agendamiento/CalendarioCitas'
import { ResumenCita } from '../components/agendamiento/ResumenCita'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { traducirErrorCita } from '../lib/erroresCita'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'
import type { Horario } from '../lib/types'

interface WizardState {
  paso: number
  especialidadId: string | null
  especialidadNombre: string
  sedeId: string | null
  sedeNombre: string
  medicoId: string | null
  medicoNombre: string
  horario: Horario | null
  notas: string
}

type WizardAction =
  | { type: 'SET_ESPECIALIDAD'; id: string; nombre: string }
  | { type: 'SET_SEDE'; id: string; nombre: string }
  | { type: 'SET_MEDICO'; id: string; nombre: string }
  | { type: 'SET_HORARIO'; horario: Horario }
  | { type: 'SET_NOTAS'; notas: string }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'RESET' }

const initial: WizardState = {
  paso: 1,
  especialidadId: null,
  especialidadNombre: '',
  sedeId: null,
  sedeNombre: '',
  medicoId: null,
  medicoNombre: '',
  horario: null,
  notas: '',
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_ESPECIALIDAD':
      return { ...state, especialidadId: action.id, especialidadNombre: action.nombre }
    case 'SET_SEDE':
      return { ...state, sedeId: action.id, sedeNombre: action.nombre }
    case 'SET_MEDICO':
      return { ...state, medicoId: action.id, medicoNombre: action.nombre, horario: null }
    case 'SET_HORARIO':
      return { ...state, horario: action.horario }
    case 'SET_NOTAS':
      return { ...state, notas: action.notas }
    case 'NEXT':
      return { ...state, paso: Math.min(state.paso + 1, 4) }
    case 'BACK':
      return { ...state, paso: Math.max(state.paso - 1, 1) }
    case 'RESET':
      return initial
  }
}

export function AgendarCita() {
  const { paciente, loading: authLoading } = useAuth()
  const [state, dispatch] = useReducer(reducer, initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ codigo: string } | null>(null)

  if (!authLoading && !paciente) {
    return <Navigate to="/registro" replace />
  }

  const puedeAvanzar = () => {
    if (state.paso === 1) return !!state.especialidadId && !!state.sedeId
    if (state.paso === 2) return !!state.medicoId
    if (state.paso === 3) return !!state.horario
    return false
  }

  const confirmar = async () => {
    if (!paciente || !state.horario || !state.medicoId || !state.sedeId) return
    setSubmitting(true)
    setError(null)

    // CU-03 2.3.5: si la operación no responde (timeout o fallo de red) se informa
    // el error y el botón se rehabilita; nunca queda en "Confirmando…" para siempre.
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('crear_cita_atomica', {
          p_paciente_id: paciente.id,
          p_medico_id: state.medicoId,
          p_horario_id: state.horario.id,
          p_sede_id: state.sedeId,
          p_notas: state.notas || null,
        }),
        AUTH_TIMEOUT_MS,
      )

      if (error) {
        setError(traducirErrorCita(error.message))
        return
      }
      const fila = Array.isArray(data) ? data[0] : data
      if (!fila?.codigo) {
        setError('No se obtuvo el código de confirmación.')
        return
      }
      setExito({ codigo: fila.codigo })
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Intenta de nuevo.')
      } else {
        console.error('[AgendarCita] confirmar:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (exito && state.horario) {
    return (
      <ResumenCita
        codigoConfirmacion={exito.codigo}
        medicoNombre={state.medicoNombre}
        especialidadNombre={state.especialidadNombre}
        sedeNombre={state.sedeNombre}
        fecha={state.horario.fecha}
        horaInicio={state.horario.hora_inicio}
        onAgendarOtra={() => {
          setExito(null)
          dispatch({ type: 'RESET' })
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <span className="inline-flex items-center rounded-full bg-helios-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-helios-primary">
          Wizard de agendamiento
        </span>
        <h1 className="text-3xl font-bold text-helios-ink">Agendar una nueva cita</h1>
        {/* CU-03 flujo alterno 2.2.1: salir sin guardar nada. */}
        <Link to="/" className="inline-block text-sm font-semibold text-helios-primary hover:underline">
          ← Regresar al menú principal
        </Link>
      </header>

      <Stepper paso={state.paso} />

      <div className="card space-y-6">
        {state.paso === 1 && (
          <>
            <SelectorEspecialidad
              value={state.especialidadId}
              onChange={(id, nombre) => dispatch({ type: 'SET_ESPECIALIDAD', id, nombre })}
            />
            <SelectorSede
              value={state.sedeId}
              onChange={(id, nombre) => dispatch({ type: 'SET_SEDE', id, nombre })}
            />
          </>
        )}

        {state.paso === 2 && state.sedeId && state.especialidadId && (
          <ListaMedicos
            sedeId={state.sedeId}
            especialidadId={state.especialidadId}
            value={state.medicoId}
            onChange={(id, nombre) => dispatch({ type: 'SET_MEDICO', id, nombre })}
          />
        )}

        {state.paso === 3 && state.medicoId && (
          <CalendarioCitas
            medicoId={state.medicoId}
            value={state.horario}
            onChange={(h) => dispatch({ type: 'SET_HORARIO', horario: h })}
          />
        )}

        {state.paso === 4 && state.horario && (
          <ResumenPaso4
            paciente={paciente?.nombre ?? ''}
            cedula={paciente?.cedula ?? ''}
            telefono={paciente?.telefono ?? ''}
            correo={paciente?.correo ?? ''}
            medicoNombre={state.medicoNombre}
            especialidadNombre={state.especialidadNombre}
            sedeNombre={state.sedeNombre}
            fecha={state.horario.fecha}
            hora={state.horario.hora_inicio}
            notas={state.notas}
            onNotasChange={(notas) => dispatch({ type: 'SET_NOTAS', notas })}
          />
        )}

        {error && <ErrorMessage message={error} />}

        {/*
          Barra de acciones. En móvil queda STICKY al fondo de la pantalla
          (sticky bottom-0 + fondo blanco), así el botón "Confirmar cita" / "Siguiente"
          siempre se ve sin tener que scrollear hasta abajo (confunde a personas
          mayores). En desktop (sm:) vuelve a su posición normal al pie del card.
        */}
        <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex items-center justify-between gap-3 rounded-b-2xl border-t border-helios-ink/10 bg-white px-6 py-4 shadow-[0_-6px_16px_-8px_rgba(15,42,54,0.18)] sm:static sm:mx-0 sm:mb-0 sm:rounded-none sm:border-helios-ink/5 sm:bg-transparent sm:px-0 sm:py-0 sm:pt-5 sm:shadow-none">
          <button
            onClick={() => dispatch({ type: 'BACK' })}
            disabled={state.paso === 1 || submitting}
            className="btn-ghost"
          >
            ← Atrás
          </button>
          {state.paso < 4 ? (
            <button
              onClick={() => dispatch({ type: 'NEXT' })}
              disabled={!puedeAvanzar()}
              className="btn-primary"
            >
              Siguiente →
            </button>
          ) : (
            <button onClick={confirmar} disabled={submitting} className="btn-primary">
              {submitting ? 'Confirmando…' : 'Confirmar cita'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function clasePasoCirculo(activo: boolean, completo: boolean): string {
  const base = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
  if (activo) return `${base} bg-helios-primary text-white`
  if (completo) return `${base} bg-helios-accent/30 text-helios-primary`
  return `${base} bg-helios-ink/10 text-helios-ink/40`
}

function Stepper({ paso }: Readonly<{ paso: number }>) {
  const pasos = ['Especialidad y sede', 'Médico', 'Horario', 'Confirmar']
  return (
    <ol className="flex items-center justify-between gap-2 text-xs sm:text-sm">
      {pasos.map((titulo, idx) => {
        const num = idx + 1
        const activo = paso === num
        const completo = paso > num
        return (
          <li key={titulo} className="flex flex-1 items-center gap-2">
            <span className={clasePasoCirculo(activo, completo)}>
              {completo ? '✓' : num}
            </span>
            <span
              className={`hidden sm:inline ${activo ? 'font-semibold text-helios-ink' : 'text-helios-ink/50'}`}
            >
              {titulo}
            </span>
            {num < pasos.length && <span className="ml-2 flex-1 border-t border-dashed border-helios-ink/10" />}
          </li>
        )
      })}
    </ol>
  )
}

function ResumenPaso4(props: Readonly<{
  paciente: string
  cedula: string
  telefono: string
  correo: string
  medicoNombre: string
  especialidadNombre: string
  sedeNombre: string
  fecha: string
  hora: string
  notas: string
  onNotasChange: (notas: string) => void
}>) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-helios-ink">Revisa los datos antes de confirmar</h2>
        <p className="mt-1 text-sm text-helios-ink/60">
          Verifica que toda la información sea correcta. Una vez confirmada, recibirás el código de
          cita.
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Item label="Paciente" value={props.paciente} />
        <Item label="Cédula" value={props.cedula} />
        <Item label="Teléfono" value={props.telefono || '—'} />
        <Item label="Correo" value={props.correo || '—'} />
        <Item label="Médico" value={`Dr(a). ${props.medicoNombre}`} />
        <Item label="Especialidad" value={props.especialidadNombre} />
        <Item label="Sede" value={props.sedeNombre} />
        <Item label="Fecha y hora" value={`${props.fecha} ${props.hora.slice(0, 5)}`} />
      </dl>
      <div>
        <label htmlFor="notas" className="label">
          Notas sobre esta cita (opcional)
        </label>
        <p className="mb-1 text-xs text-helios-ink/60">
          Es una nota personal: solo tú la verás, el médico no tiene acceso a ella.
        </p>
        <textarea
          id="notas"
          rows={3}
          value={props.notas}
          onChange={(e) => props.onNotasChange(e.target.value)}
          className="input"
          placeholder="Ej.: Recordar llevar exámenes recientes, primera consulta…"
        />
      </div>
    </div>
  )
}

function Item({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg bg-helios-mist px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-helios-ink/40">{label}</dt>
      <dd className="mt-0.5 font-semibold text-helios-ink">{value}</dd>
    </div>
  )
}
