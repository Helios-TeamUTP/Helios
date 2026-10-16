import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Pantalla para una sesion valida SIN perfil de paciente ni de medico.
 *
 * Ya no existe el paso "Completa tu perfil": al crear la cuenta, un trigger de
 * la base crea el paciente automaticamente con los datos del registro. Esta
 * pantalla solo aparece si una cuenta quedo sin perfil (caso excepcional), y
 * ofrece una salida (cerrar sesion) en lugar de un formulario que repite datos.
 */
export function CuentaIncompleta() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const salir = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <h2 className="text-lg font-bold text-helios-ink">No encontramos tu perfil</h2>
        <p className="mt-2 text-sm text-helios-ink/70">
          La cuenta <strong>{user?.email}</strong> no tiene un perfil de paciente asociado.
          Cierra sesión e inténtalo de nuevo; si el problema continúa, contacta al equipo
          HELIOS.
        </p>
        <button type="button" onClick={() => void salir()} className="btn-primary mt-4">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
