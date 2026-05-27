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
  const { user, role, loading, loadPerfilFailed, refreshPerfil } = useAuth()
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

  /**
   * Bug B-17: si loadPerfil termino con error (timeout, RLS, red), NO
   * redirigir ciegamente a /registro como si fuera un paciente nuevo.
   * Mostrar mensaje claro con boton "Reintentar" para que el usuario
   * (especialmente medicos) no caiga en el form "Completa tu perfil".
   */
  if (loadPerfilFailed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <h2 className="text-lg font-bold text-helios-ink">
            No pudimos cargar tu perfil
          </h2>
          <p className="mt-2 text-sm text-helios-ink/70">
            Hubo un problema al verificar tu sesión. Esto puede ser por una
            conexión lenta o un problema temporal del servidor.
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshPerfil()
            }}
            className="btn-primary mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
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
