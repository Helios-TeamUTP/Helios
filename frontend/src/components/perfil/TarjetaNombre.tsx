import { useAuth } from '../../hooks/useAuth'
import { useActualizarNombre } from '../../hooks/useActualizarNombre'
import { TarjetaNombreBase } from './TarjetaNombreBase'

/**
 * Módulo 05 — Perfil, Acción 1: cambiar nombre (paciente).
 * UI compartida con médico en TarjetaNombreBase.
 */
export function TarjetaNombre() {
  const { paciente, refreshPerfil } = useAuth()
  const { actualizarNombre, loading, error, setError } = useActualizarNombre()

  return (
    <TarjetaNombreBase
      inputId="perfil-nombre"
      subtitulo="Tu nombre tal como aparecerá para el equipo médico."
      valorActual={paciente?.nombre ?? ''}
      entidadId={paciente?.id}
      actualizarNombre={actualizarNombre}
      loading={loading}
      error={error}
      setError={setError}
      onGuardado={refreshPerfil}
    />
  )
}
