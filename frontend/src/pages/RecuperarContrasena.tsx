import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { AUTH_TIMEOUT_MS, TimeoutError, withTimeout } from '../lib/withTimeout'
import { validarEmail } from '../lib/validaciones'

/** Segundos de espera entre solicitudes (Supabase limita 1 correo por minuto por usuario). */
const ESPERA_SEGUNDOS = 60

/**
 * RF-04 — Recuperacion de contrasena (paso 1: pedir el enlace).
 *
 * Seguridad: el mensaje de exito es SIEMPRE el mismo, exista o no el correo,
 * para no revelar que cuentas existen (enumeracion de usuarios).
 */
export function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [espera, setEspera] = useState(0)

  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const correo = email.trim()
    if (!validarEmail(correo)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    setSubmitting(true)
    try {
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(correo, {
          redirectTo: `${window.location.origin}/restablecer`,
        }),
        AUTH_TIMEOUT_MS,
      )
      if (resetError) {
        if (resetError.status === 429 || /security purposes|rate limit/i.test(resetError.message)) {
          setError('Por seguridad, espera un minuto antes de pedir otro enlace.')
          setEspera(ESPERA_SEGUNDOS)
        } else {
          console.error('[RecuperarContrasena] resetPasswordForEmail:', resetError.message)
          setError('No pudimos enviar el enlace. Intenta de nuevo en unos minutos.')
        }
        return
      }
      setEnviado(true)
      setEspera(ESPERA_SEGUNDOS)
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.')
      } else {
        console.error('[RecuperarContrasena] unexpected:', err)
        setError('Ocurrió un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const textoBoton = submitting
    ? 'Enviando…'
    : espera > 0
      ? `Reenviar en ${espera} s`
      : enviado
        ? 'Reenviar enlace'
        : 'Enviar enlace'

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
        </p>

        {enviado && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-helios-primary/30 bg-helios-primary/10 px-4 py-3 text-sm text-helios-deep"
          >
            <strong>Revisa tu correo.</strong> Si hay una cuenta con ese correo, recibirás un
            enlace en unos minutos. Si no lo ves, revisa la carpeta de spam.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={submitting || espera > 0} className="btn-primary w-full">
            {textoBoton}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-helios-ink/60">
          <Link to="/login" className="font-semibold text-helios-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
