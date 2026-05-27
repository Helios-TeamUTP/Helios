import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AppLayout() {
  const { user, paciente, medico, role, signOut } = useAuth()
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-helios-primary text-white">
              <SunIcon />
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-helios-ink">HELIOS</div>
              <div className="text-xs text-helios-ink/50">Citas médicas unificadas</div>
            </div>
          </Link>
          <nav className="relative z-10 flex items-center gap-1">
            {user ? (
              <>
                {/* Bug B-13: nav segun rol. Medico ve "Mi agenda", paciente ve "Agendar"+"Mis citas". */}
                {role === 'medico' && <NavItem to="/medico">Mi agenda</NavItem>}
                {role === 'paciente' && (
                  <>
                    <NavItem to="/agendar">Agendar cita</NavItem>
                    <NavItem to="/mis-citas">Mis citas</NavItem>
                  </>
                )}
                {role === null && <NavItem to="/registro">Completa tu perfil</NavItem>}
                <div className="mx-2 hidden text-sm text-helios-ink/60 sm:block">
                  {nombreUsuario}
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
      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-4 text-center text-xs text-helios-ink/40">
        HELIOS · Sprint 1 · UTP Calidad de Software 2026
      </footer>
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

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}
