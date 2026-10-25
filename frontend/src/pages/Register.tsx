import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { normalizeCedula, detectarTipoCedula } from '../lib/cedula'
import { validarRegistro, EJEMPLOS_TEXTO } from '../lib/validarRegistro'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'
import { traducirErrorAuth } from '../lib/erroresAuth'
import { CuentaIncompleta } from '../components/auth/CuentaIncompleta'

// CU-01 flujo 2.3.6: mensaje genérico cuando el registro falla o no responde.
const MSG_REGISTRO_FALLIDO = 'No se pudo completar el registro. Intenta nuevamente.'

export function Register() {
  const navigate = useNavigate()
  const { user, paciente, role, loading, loadPerfilFailed, refreshPerfil } = useAuth()
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    cedulaConfirm: '', // B-23: doble confirmación de cédula
    telefono: '',
    correo: '',
    password: '',
    passwordConfirm: '', // B-23: doble confirmación de contraseña
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Caso 1: aun cargando sesion -> mostrar spinner
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  // Caso 2: usuario con cuenta y perfil de paciente -> ir a agendar. Tambien es
  // el destino tras registrarse: el trigger de la base ya creo el paciente, asi
  // que en cuanto useAuth carga el perfil este redirect lleva a /agendar.
  if (user && paciente) {
    return <Navigate to="/agendar" replace />
  }

  // Bug B-16: si el user es medico (no paciente), redirigir a /medico.
  if (user && role === 'medico') {
    return <Navigate to="/medico" replace />
  }

  /**
   * Bug B-17: si loadPerfil fallo (timeout, error de red, RLS rota), NO
   * asumir nada sobre el perfil. Mostrar mensaje de error claro con boton
   * reintentar.
   */
  if (user && loadPerfilFailed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <h2 className="text-lg font-bold text-helios-ink">
            No pudimos cargar tu perfil
          </h2>
          <p className="mt-2 text-sm text-helios-ink/70">
            Hubo un problema al verificar tu cuenta. Esto puede ser por una
            conexión lenta. Intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshPerfil()
            }}
            className="btn-primary mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Sesion activa sin perfil de paciente ni de medico (caso excepcional). Ya no
  // hay formulario "Completa tu perfil": el perfil se crea al registrarse.
  if (user) {
    return <CuentaIncompleta />
  }

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // B-22: tipo de cédula detectado en vivo (ayuda visual mientras escribe).
  const tipoCedula = form.cedula.trim() ? detectarTipoCedula(form.cedula) : null

  /**
   * Bug B-10 fix: try/catch/finally + withTimeout en TODAS las llamadas a
   * Supabase garantiza que el spinner nunca quede eterno si Supabase tarda.
   */
  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)

    // Validación del formulario (CU-01 / B-22 / B-23 / B-24). El form usa
    // noValidate para mostrar el mensaje del documento en vez del globo nativo.
    const mensajeError = validarRegistro(form)
    if (mensajeError) {
      setError(mensajeError)
      return
    }
    const cedulaNorm = normalizeCedula(form.cedula)

    setSubmitting(true)
    // true cuando el registro quedo con sesion: el boton sigue ocupado hasta que
    // useAuth cargue el perfil y este componente redirija (nunca se vuelve a ver
    // el formulario: ver los early returns de arriba).
    let esperandoPerfil = false
    try {
      // Verificar si la cédula ya está en uso por otro paciente.
      // CU-01 (CA-01-04): este chequeo corre SIN sesión, y la lectura pública de
      // `pacientes` está cerrada por RLS (un SELECT directo siempre devolvía
      // vacío y el chequeo nunca detectaba nada). Se usa el RPC anónimo
      // `cedula_ya_registrada`, que solo devuelve true/false, nunca datos.
      const { data: yaRegistrada } = await withTimeout(
        supabase.rpc('cedula_ya_registrada', { p_cedula: cedulaNorm }),
        AUTH_TIMEOUT_MS,
      )
      if (yaRegistrada) {
        setError('Ya existe un paciente con esa cédula. Inicia sesión.')
        return
      }

      // Bug B-02: verificar el CORREO antes de crear la cuenta auth (igual que
      // la cédula). Mismo motivo: RPC anónimo `correo_ya_registrado` (boolean).
      const correoNorm = form.correo.trim().toLowerCase()
      const { data: correoYaRegistrado } = await withTimeout(
        supabase.rpc('correo_ya_registrado', { p_correo: correoNorm }),
        AUTH_TIMEOUT_MS,
      )
      if (correoYaRegistrado) {
        setError('Ya existe una cuenta con este correo. Inicia sesión.')
        return
      }

      /**
       * Registro = cuenta + paciente, en un solo paso. Los datos del paciente
       * viajan en `options.data` (raw_user_meta_data) y un trigger de la base
       * (`crear_paciente_desde_signup`) crea el paciente y su vinculo en la
       * MISMA transaccion que la cuenta. Reemplaza el flujo anterior (B-20.x:
       * sessionStorage + insert desde el cliente tras el login), que dependia
       * de la sesion y de RLS del lado del cliente.
       */
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: correoNorm,
          password: form.password,
          options: {
            data: {
              nombre: form.nombre.trim(),
              cedula: cedulaNorm,
              telefono: form.telefono.trim() || null,
            },
          },
        }),
        AUTH_TIMEOUT_MS,
      )
      if (authError || !authData.user) {
        setError(traducirErrorAuth(authError ?? {}, MSG_REGISTRO_FALLIDO))
        return
      }

      // Sin sesion (p. ej. si se activa la confirmacion de correo): la cuenta y
      // el paciente ya existen; al iniciar sesion podra agendar de inmediato.
      if (!authData.session) {
        navigate('/login', {
          replace: true,
          state: { registroExitoso: true, email: correoNorm },
        })
        return
      }

      // Con sesion: useAuth (onAuthStateChange) carga el perfil y el redirect
      // "user && paciente" de arriba lleva a /agendar.
      esperandoPerfil = true
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError(`${MSG_REGISTRO_FALLIDO} El servidor tardó demasiado en responder.`)
      } else {
        console.error('[Register] handleSubmit unexpected:', err)
        setError(MSG_REGISTRO_FALLIDO)
      }
    } finally {
      if (!esperandoPerfil) setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Crear cuenta</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Solo necesitamos tus datos básicos para registrarte como paciente HELIOS.
        </p>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="label">
              Nombre completo
            </label>
            <input
              id="nombre"
              required
              autoComplete="name"
              value={form.nombre}
              onChange={update('nombre')}
              className="input"
              placeholder="Ej: Ana López"
            />
          </div>

          {/* B-22: cédula con ejemplos de los tipos que el sistema conoce
              + tipo detectado en vivo para reducir errores. */}
          <div className="sm:col-span-2">
            <label htmlFor="cedula" className="label">
              Cédula
            </label>
            <input
              id="cedula"
              required
              inputMode="text"
              value={form.cedula}
              onChange={update('cedula')}
              className="input"
              placeholder="8-123-4567"
            />
            <p className="mt-1 text-xs text-helios-ink/50">
              Ejemplos válidos: {EJEMPLOS_TEXTO}
            </p>
            {tipoCedula && (
              <p
                className={`mt-1 text-xs ${
                  tipoCedula.tipo === 'desconocido' ? 'text-amber-600' : 'text-helios-primary'
                }`}
              >
                {tipoCedula.tipo === 'desconocido'
                  ? 'Formato no reconocido todavía.'
                  : `Tipo detectado: ${tipoCedula.etiqueta}`}
              </p>
            )}
          </div>

          {/* B-23: confirmación de cédula (debe coincidir). */}
          <div className="sm:col-span-2">
            <label htmlFor="cedulaConfirm" className="label">
              Confirmar cédula
            </label>
            <input
              id="cedulaConfirm"
              required
              inputMode="text"
              value={form.cedulaConfirm}
              onChange={update('cedulaConfirm')}
              className="input"
              placeholder="Escribe tu cédula de nuevo"
              onPaste={(e) => e.preventDefault()}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="telefono" className="label">
              Teléfono <span className="text-helios-ink/40">(opcional)</span>
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.telefono}
              onChange={update('telefono')}
              className="input"
              placeholder="6000-0000"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="correo" className="label">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              required
              autoComplete="email"
              value={form.correo}
              onChange={update('correo')}
              className="input"
              placeholder="nombre@correo.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              className="input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {/* B-23: confirmación de contraseña (debe coincidir). */}
          <div className="sm:col-span-2">
            <label htmlFor="passwordConfirm" className="label">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              className="input"
              placeholder="Escribe la contraseña de nuevo"
            />
          </div>
          {error && (
            <div className="sm:col-span-2">
              <ErrorMessage message={error} />
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-helios-ink/60">
          <Link to="/login" className="font-semibold text-helios-primary hover:underline">
            Ya tengo cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
