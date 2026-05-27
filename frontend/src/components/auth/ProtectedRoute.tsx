import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import type { Role } from '../../lib/types'

interface ProtectedRouteProps {
  /**
   * Bug B-13: rol requerido para acceder a la ruta.
   * - Sin prop: cualquier autenticado entra (compat con rutas existentes /agendar y /mis-citas)
   * - 'paciente': solo pacientes; medico redirect a /medico
   * - 'medico': solo medicos; paciente redirect a /agendar
   * - null (sin perfil): redirect a /registro
   */
  requireRole?: Role
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps = {}) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Verificando sesión…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Bug B-13: si la ruta pide un rol específico y el del usuario no coincide,
  // redirigimos a la pantalla principal del rol del usuario.
  if (requireRole && role !== requireRole) {
    if (role === 'medico') return <Navigate to="/medico" replace />
    if (role === 'paciente') return <Navigate to="/agendar" replace />
    // role === null: usuario auth sin perfil → completar registro
    return <Navigate to="/registro" replace />
  }

  return <Outlet />
}
