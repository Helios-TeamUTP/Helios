import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CampanaNotificaciones } from '../notificaciones/CampanaNotificaciones'

export function AppLayout() {
  const { user, paciente, medico, role, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Bug B-13: nombre visible segun rol (medico tiene precedencia sobre paciente).
  const nombreUsuario = medico?.nombre ?? paciente?.nombre ?? user?.email

  // Bug B-16: durante loading (role transitorio = null) NO se muestran los
  // enlaces por rol — evita un flash de navegacion incorrecta al refrescar
  // /medico. Solo hay enlaces cuando hay sesion, no se esta cargando y el rol
  // ya se resolvio.
  const mostrarEnlaces = Boolean(user) && !loading && role !== null

  return (
    <div className="min-h-screen bg-helios-mist">
      {/* Bug fix: sticky + z-50 garantiza que el toolbar siempre esté arriba
          de cualquier overlay (FullCalendar, modales, etc.) y los clicks
          lleguen a los NavLinks.
          Layout en 3 zonas: logo | enlaces (centrados) | acciones de usuario.
          En pantallas md+ van en una sola fila; en movil los enlaces bajan a
          una segunda fila centrada para que no se desborde el header. */}
      <header className="sticky top-0 z-50 border-b border-helios-ink/5 bg-white shadow-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-6 py-4 md:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="relative z-10 col-start-1 row-start-1 flex items-center gap-2">
            {/* Parcial 2: nuevo logo de marca (cruz roja). El simbolo es un PNG
                transparente en /public; reemplaza el icono de sol teal. */}
            <img
              src="/helios-symbol.png"
              alt="HELIOS"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div>
              <div className="text-base font-bold leading-tight text-helios-logo">HELIOS</div>
              <div className="text-xs text-helios-ink/50">Citas médicas unificadas</div>
            </div>
          </Link>

          {mostrarEnlaces && (
            <nav
              aria-label="Navegación principal"
              className="relative z-10 col-span-2 row-start-2 flex items-center justify-center gap-1 md:col-span-1 md:col-start-2 md:row-start-1"
            >
              {role === 'medico' && (
                <>
                  <NavItem to="/medico" noActivoEn="/medico/perfil">
                    Mi agenda
                  </NavItem>
                  <NavItem to="/medico/perfil">Mi perfil</NavItem>
                </>
              )}
              {role === 'paciente' && (
                <>
                  <NavItem to="/agendar">Agendar cita</NavItem>
                  <NavItem to="/mis-citas">Mis citas</NavItem>
                  <NavItem to="/perfil">Mi perfil</NavItem>
                </>
              )}
            </nav>
          )}

          <div className="relative z-10 col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-start-3">
            {user ? (
              <>
                {/* Sprint 4: campanita de notificaciones (solo con rol resuelto,
                    para no mostrarla durante el loading transitorio — B-16). */}
                {!loading && role !== null && <CampanaNotificaciones />}
                {/* Rol + nombre del usuario. La etiqueta de rol (Médico/Paciente)
                    deja claro con qué tipo de cuenta se está navegando. */}
                <div className="mx-2 hidden items-center gap-2 text-sm sm:flex">
                  {loading ? (
                    <span className="text-helios-ink/60">Cargando…</span>
                  ) : (
                    <>
                      {role === 'medico' && (
                        <span className="rounded-full bg-helios-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-helios-primary">
                          Médico
                        </span>
                      )}
                      {role === 'paciente' && (
                        <span className="rounded-full bg-helios-deep/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-helios-deep">
                          Paciente
                        </span>
                      )}
                      <span className="font-medium text-helios-ink/70">{nombreUsuario}</span>
                    </>
                  )}
                </div>
                <button onClick={handleSignOut} className="btn-ghost">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavItem to="/login">Iniciar sesión</NavItem>
                <Link to="/registro" className="btn-primary">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

/**
 * Enlace de navegacion. `noActivoEn`: NavLink compara por prefijo, asi que
 * "Mi agenda" (/medico) se marcaria activo tambien en /medico/perfil; con
 * `noActivoEn` se excluye esa ruta hermana sin cambiar el resto (por ejemplo
 * /medico/pacientes sigue contando como parte de la agenda).
 */
function NavItem({
  to,
  children,
  noActivoEn,
}: Readonly<{ to: string; children: React.ReactNode; noActivoEn?: string }>) {
  const { pathname } = useLocation()
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const activo = isActive && !(noActivoEn && pathname.startsWith(noActivoEn))
        return `btn-ghost ${activo ? 'bg-helios-primary/10 text-helios-primary' : ''}`
      }}
    >
      {children}
    </NavLink>
  )
}
