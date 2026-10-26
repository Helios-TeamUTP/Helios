import { TarjetaNombre } from '../components/perfil/TarjetaNombre'
import { TarjetaCorreo } from '../components/perfil/TarjetaCorreo'
import { TarjetaPassword } from '../components/perfil/TarjetaPassword'

/**
 * Módulo 05 — Perfil (solo paciente).
 *
 * 3 tarjetas independientes en vez de un formulario único: un error en un
 * campo no bloquea guardar los otros. Ver
 * docs/Obsidian/Modulos/Módulo 05 — Perfil.md para el caso de uso completo.
 *
 * Fuera de alcance a propósito: cédula, teléfono y perfil de clínica. Ninguno
 * se toca desde esta pantalla. El perfil de médico está en PerfilMedico.
 */
export function Perfil() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-helios-ink">Mi perfil</h1>
      <p className="mt-1 text-sm text-helios-ink/60">
        Actualiza tu información personal y tu contraseña.
      </p>

      <div className="mt-6 space-y-6">
        <TarjetaNombre />
        <TarjetaCorreo />
        <TarjetaPassword />
      </div>
    </div>
  )
}
