import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isValidCedulaPanama, normalizeCedula } from '../lib/cedula'
import { ErrorMessage } from '../components/shared/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'

export function Register() {
  const navigate = useNavigate()
  const { user, paciente, loading, refreshPaciente } = useAuth()
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    correo: '',
    password: '',
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

  // Caso 2: usuario completamente registrado (auth + paciente) -> ir a agendar
  if (user && paciente) {
    return <Navigate to="/agendar" replace />
  }

  // Caso 3: tiene auth pero NO tiene paciente -> completar perfil
  const isCompletingProfile = !!user && !paciente

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
    if (!isCompletingProfile && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSubmitting(true)

    // Verificar si la cédula ya está en uso por otro paciente
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

    // Determinar auth_uid + email a usar
    let authUid: string | null = null
    let correoFinal: string

    if (isCompletingProfile && user) {
      // Ya hay sesion - reutilizar auth.users existente
      authUid = user.id
      correoFinal = user.email ?? form.correo.trim().toLowerCase()
    } else {
      // Nuevo registro completo - crear auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.correo,
        password: form.password,
      })
      if (authError || !authData.user) {
        setSubmitting(false)
        setError(authError?.message ?? 'No se pudo crear la cuenta.')
        return
      }
      authUid = authData.user.id
      correoFinal = form.correo.trim().toLowerCase()
    }

    // Crear paciente
    const { data: pac, error: pacError } = await supabase
      .from('pacientes')
      .insert({
        nombre: form.nombre.trim(),
        cedula: cedulaNorm,
        telefono: form.telefono.trim() || null,
        correo: correoFinal,
      })
      .select()
      .single()
    if (pacError || !pac) {
      setSubmitting(false)
      setError(pacError?.message ?? 'No se pudo crear el paciente.')
      return
    }

    // Vincular auth con paciente (upsert por si ya existe)
    const { error: linkError } = await supabase
      .from('auth_paciente_link')
      .upsert({ auth_uid: authUid, paciente_id: pac.id }, { onConflict: 'auth_uid' })
    if (linkError) {
      setSubmitting(false)
      setError(linkError.message)
      return
    }

    // Refrescar contexto de auth para que paciente quede disponible
    await refreshPaciente()
    setSubmitting(false)
    navigate('/agendar', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        {isCompletingProfile ? (
          <>
            <h1 className="text-2xl font-bold text-helios-ink">Completa tu perfil de paciente</h1>
            <p className="mt-1 text-sm text-helios-ink/60">
              Detectamos que tu cuenta <strong>{user?.email}</strong> no tiene perfil de paciente.
              Solo necesitamos tu nombre y cédula para terminar el registro.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-helios-ink">Crear cuenta</h1>
            <p className="mt-1 text-sm text-helios-ink/60">
              Solo necesitamos tus datos básicos para registrarte como paciente HELIOS.
            </p>
          </>
        )}
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
          {!isCompletingProfile && (
            <>
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
            </>
          )}
          {error && (
            <div className="sm:col-span-2">
              <ErrorMessage message={error} />
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting
                ? isCompletingProfile
                  ? 'Guardando…'
                  : 'Creando cuenta…'
                : isCompletingProfile
                  ? 'Completar perfil'
                  : 'Crear cuenta'}
            </button>
          </div>
        </form>
        {!isCompletingProfile && (
          <p className="mt-4 text-center text-sm text-helios-ink/60">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-helios-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
