import { TarjetaNombreMedico } from '../components/perfil/TarjetaNombreMedico'
import { TarjetaPassword } from '../components/perfil/TarjetaPassword'

/**
 * Extensión del Módulo 05 — Perfil, para médico.
 *
 * El médico edita su nombre y puede cambiar su contraseña (misma tarjeta y
 * misma reautenticación que el paciente). El correo no se edita aquí: es el
 * usuario con el que inicia sesión. Ver
 * docs/Obsidian/Modulos/Módulo 05 — Perfil.md, sección de extensión médico.
 */
export function PerfilMedico() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-helios-ink">Mi perfil</h1>
      <p className="mt-1 text-sm text-helios-ink/60">
        Actualiza tu nombre y cambia tu contraseña.
      </p>

      <div className="mt-6 space-y-6">
        <TarjetaNombreMedico />
        <TarjetaPassword />
      </div>
    </div>
  )
}
