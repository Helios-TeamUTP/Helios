import { useActualizarNombreEntidad } from './useActualizarNombreEntidad'

/**
 * Módulo 05 — Perfil (paciente), Acción 1: cambiar nombre.
 * Lógica compartida con médico en useActualizarNombreEntidad.
 */
export function useActualizarNombre() {
  return useActualizarNombreEntidad('pacientes')
}
