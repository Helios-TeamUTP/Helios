import { useAuth } from '../../hooks/useAuth'

/**
 * Módulo 05 — Perfil, Acción 2: correo electrónico.
 *
 * NO editable en esta versión. El correo alimenta el worker de
 * notificaciones (email-worker/, sprint4b_cola_email.sql) — cambiarlo sin
 * también actualizar auth.users (o sin verificar el nuevo correo) puede
 * desincronizar a dónde llegan los recordatorios de citas vs. con qué
 * correo el paciente inicia sesión. Se deja de solo lectura hasta diseñar
 * ese flujo (ver docs/Obsidian/Modulos/Módulo 05 — Perfil.md).
 */
export function TarjetaCorreo() {
  const { paciente } = useAuth()

  return (
    <div className="card">
      <h2 className="text-base font-bold text-helios-ink">Correo electrónico</h2>
      <p className="mt-1 text-sm text-helios-ink/60">
        Por ahora no se puede editar desde aquí.
      </p>

      <div className="mt-4">
        <label htmlFor="perfil-correo" className="label">
          Correo
        </label>
        <input
          id="perfil-correo"
          type="email"
          className="input cursor-not-allowed bg-helios-mist text-helios-ink/60"
          value={paciente?.correo ?? ''}
          readOnly
          disabled
        />
      </div>
    </div>
  )
}
