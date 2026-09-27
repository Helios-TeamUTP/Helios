import { TarjetaNombreMedico } from '../components/perfil/TarjetaNombreMedico'

/**
 * Extensión del Módulo 05 — Perfil, para médico.
 *
 * Alcance intencionalmente mínimo: SOLO el nombre es editable. Sin correo,
 * sin contraseña — a diferencia de la versión de paciente. Ver
 * docs/Obsidian/Modulos/Módulo 05 — Perfil.md, sección de extensión médico.
 */
export function PerfilMedico() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-helios-ink">Mi perfil</h1>
      <p className="mt-1 text-sm text-helios-ink/60">
        Por ahora solo puedes actualizar tu nombre.
      </p>

      <div className="mt-6">
        <TarjetaNombreMedico />
      </div>
    </div>
  )
}
