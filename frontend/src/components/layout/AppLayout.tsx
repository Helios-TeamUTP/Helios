import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
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

  return (
    <div className="min-h-screen bg-helios-mist">
      {/* Bug fix: sticky + z-50 garantiza que el toolbar siempre esté arriba
          de cualquier overlay (FullCalendar, modales, etc.) y los clicks
          lleguen a los NavLinks. */}
      <header className="sticky top-0 z-50 border-b border-helios-ink/5 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="relative z-10 flex items-center gap-2">
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
          <nav className="relative z-10 flex items-center gap-1">
            {user ? (
              <>
                {/* Bug B-16: durante loading (role transitorio = null), NO mostrar
                    los NavItems por rol — evita un flash de navegacion incorrecta
                    al refrescar /medico. Mostramos solo
                    Cerrar sesion + email para que el usuario sepa que sigue
                    logueado y pueda salir si quiere. */}
                {!loading && (
                  <>
                    {role === 'medico' && <NavItem to="/medico">Mi agenda</NavItem>}
                    {role === 'paciente' && (
                      <>
                        <NavItem to="/agendar">Agendar cita</NavItem>
                        <NavItem to="/mis-citas">Mis citas</NavItem>
                      </>
                    )}
                  </>
                )}
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `btn-ghost ${isActive ? 'bg-helios-primary/10 text-helios-primary' : ''}`
      }
    >
      {children}
    </NavLink>
  )
}
