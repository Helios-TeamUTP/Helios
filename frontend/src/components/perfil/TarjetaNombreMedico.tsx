import { useAuth } from '../../hooks/useAuth'
import { useActualizarNombreMedico } from '../../hooks/useActualizarNombreMedico'
import { TarjetaNombreBase } from './TarjetaNombreBase'

/**
 * Extensión del Módulo 05 — Perfil, para médico. Alcance mínimo: solo
 * nombre. UI compartida con paciente en TarjetaNombreBase.
 */
export function TarjetaNombreMedico() {
  const { medico, refreshPerfil } = useAuth()
  const { actualizarNombreMedico, loading, error, setError } = useActualizarNombreMedico()

  return (
    <TarjetaNombreBase
      inputId="perfil-medico-nombre"
      subtitulo="Tu nombre tal como aparece para tus pacientes."
      valorActual={medico?.nombre ?? ''}
      entidadId={medico?.id}
      actualizarNombre={actualizarNombreMedico}
      loading={loading}
      error={error}
      setError={setError}
      onGuardado={refreshPerfil}
    />
  )
}
