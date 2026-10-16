import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { SuccessMessage } from '../components/shared/SuccessMessage'
import { useSolicitarRecuperacion } from '../hooks/useSolicitarRecuperacion'
import { validarEmail } from '../lib/validaciones'

/**
 * Recuperar contraseña, paso 1 (ruta pública /recuperar-password).
 * El mensaje de éxito es genérico a propósito: no confirma si el correo
 * existe, para no filtrar qué personas son pacientes/médicos de HELIOS.
 */
export function RecuperarPassword() {
  const { solicitar, loading, error, setError } = useSolicitarRecuperacion()
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    if (!validarEmail(correo)) {
      setError('Correo electrónico inválido. Revisa el formato (ej: nombre@correo.com).')
      return
    }
    if (await solicitar(correo)) setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-helios-ink">Revisa tu correo</h1>
          <div className="mt-4">
            <SuccessMessage message="Si ese correo está registrado en HELIOS, te enviamos un enlace para crear una contraseña nueva." />
          </div>
          <p className="mt-4 text-sm text-helios-ink/60">
            El enlace vence pronto y solo se puede usar una vez. Si no lo ves en unos minutos,
            revisa la carpeta de spam.
          </p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setEnviado(false)
                setCorreo('')
              }}
              className="font-semibold text-helios-primary hover:underline"
            >
              Usar otro correo
            </button>
            <Link to="/login" className="font-semibold text-helios-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="recuperar-email" className="label">
              Correo electrónico
            </label>
            <input
              id="recuperar-email"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="input"
              placeholder="tucorreo@ejemplo.com"
              disabled={loading}
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-helios-ink/60">
          ¿Ya la recordaste?{' '}
          <Link to="/login" className="font-semibold text-helios-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
