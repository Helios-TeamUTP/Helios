import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isValidCedulaPanama, normalizeCedula } from '../lib/cedula'
import { ErrorMessage } from '../components/shared/ErrorMessage'

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    correo: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const cedulaNorm = normalizeCedula(form.cedula)
    if (!isValidCedulaPanama(cedulaNorm)) {
      setError('Cédula panameña inválida. Usa solo dígitos (8-10) o formato 8-123-4567.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSubmitting(true)

    const { data: existing } = await supabase
      .from('pacientes')
      .select('id')
      .eq('cedula', cedulaNorm)
      .maybeSingle()
    if (existing) {
      setSubmitting(false)
      setError('Ya existe un paciente con esa cédula. Inicia sesión.')
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.correo,
      password: form.password,
    })
    if (authError || !authData.user) {
      setSubmitting(false)
      setError(authError?.message ?? 'No se pudo crear la cuenta.')
      return
    }

    const { data: pac, error: pacError } = await supabase
      .from('pacientes')
      .insert({
        nombre: form.nombre.trim(),
        cedula: cedulaNorm,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim().toLowerCase(),
      })
      .select()
      .single()
    if (pacError || !pac) {
      setSubmitting(false)
      setError(pacError?.message ?? 'No se pudo crear el paciente.')
      return
    }

    const { error: linkError } = await supabase
      .from('auth_paciente_link')
      .insert({ auth_uid: authData.user.id, paciente_id: pac.id })
    if (linkError) {
      setSubmitting(false)
      setError(linkError.message)
      return
    }

    setSubmitting(false)
    navigate('/agendar', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        <h1 className="text-2xl font-bold text-helios-ink">Crear cuenta</h1>
        <p className="mt-1 text-sm text-helios-ink/60">
          Solo necesitamos tus datos básicos para registrarte como paciente HELIOS.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="label">
              Nombre completo
            </label>
            <input id="nombre" required value={form.nombre} onChange={update('nombre')} className="input" />
          </div>
          <div>
            <label htmlFor="cedula" className="label">
              Cédula
            </label>
            <input
              id="cedula"
              required
              value={form.cedula}
              onChange={update('cedula')}
              className="input"
              placeholder="8-123-4567"
            />
          </div>
          <div>
            <label htmlFor="telefono" className="label">
              Teléfono
            </label>
            <input
              id="telefono"
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
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-helios-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
