import { useActualizarNombreEntidad } from './useActualizarNombreEntidad'

/**
 * Extensión del Módulo 05 — Perfil, para médico. Alcance mínimo: solo
 * nombre. Lógica compartida con paciente en useActualizarNombreEntidad.
 */
export function useActualizarNombreMedico() {
  const { actualizarNombre, ...resto } = useActualizarNombreEntidad('medicos')
  return { actualizarNombreMedico: actualizarNombre, ...resto }
}
