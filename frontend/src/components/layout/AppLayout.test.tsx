import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

type Estado = {
  user: { email: string } | null
  paciente: { nombre: string } | null
  medico: { nombre: string } | null
  role: 'paciente' | 'medico' | null
  loading: boolean
}

const { authState, signOutMock } = vi.hoisted(() => ({
  authState: {
    user: null,
    paciente: null,
    medico: null,
    role: null,
    loading: false,
  } as Estado,
  signOutMock: vi.fn(),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ ...authState, signOut: signOutMock }),
}))

vi.mock('../notificaciones/CampanaNotificaciones', () => ({
  CampanaNotificaciones: () => <div>mock-campana</div>,
}))

import { AppLayout } from './AppLayout'

// `ui` es una FUNCION (no un elemento): con un `rerender(elemento)` sobre la misma
// referencia React hace bail-out y no vuelve a ejecutar useAuth, asi que cada
// re-render debe construir un elemento nuevo.
function renderEn(ruta = '/') {
  const ui = () => (
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="login" element={<div>pantalla-login</div>} />
          <Route path="*" element={<div>contenido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
  return { ...render(ui()), ui }
}

function sesion(cambios: Partial<Estado>) {
  Object.assign(authState, {
    user: { email: 'ana@correo.com' },
    paciente: null,
    medico: null,
    role: null,
    loading: false,
    ...cambios,
  })
}

const NAV = { name: 'Navegación principal' }

describe('<AppLayout /> — header con menú centrado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(authState, {
      user: null,
      paciente: null,
      medico: null,
      role: null,
      loading: false,
    })
    signOutMock.mockResolvedValue(undefined)
  })

  describe('sin sesión', () => {
    it('muestra Iniciar sesión y Registrarse, y no hay navegación principal', () => {
      renderEn()
      expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/registro')
      expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
      expect(screen.queryByText('mock-campana')).not.toBeInTheDocument()
    })

    it('renderiza el contenido de la ruta hija', () => {
      renderEn()
      expect(screen.getByText('contenido')).toBeInTheDocument()
    })
  })

  describe('paciente', () => {
    beforeEach(() => sesion({ role: 'paciente', paciente: { nombre: 'Ana Pérez' } }))

    it('muestra Agendar cita, Mis citas y Mi perfil, en ese orden y con sus rutas', () => {
      renderEn()
      const nav = screen.getByRole('navigation', NAV)
      const enlaces = within(nav).getAllByRole('link')
      expect(enlaces.map((a) => a.textContent)).toEqual(['Agendar cita', 'Mis citas', 'Mi perfil'])
      expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/agendar', '/mis-citas', '/perfil'])
    })

    it('centra los enlaces: columna central en md y fila propia centrada en móvil', () => {
      renderEn()
      const nav = screen.getByRole('navigation', NAV)
      expect(nav).toHaveClass('justify-center')
      expect(nav).toHaveClass('md:col-start-2')
      expect(nav).toHaveClass('col-span-2')
    })

    it('deja la campana, el rol, el nombre y Cerrar sesión fuera del menú central', () => {
      renderEn()
      const nav = screen.getByRole('navigation', NAV)
      expect(within(nav).queryByText('mock-campana')).not.toBeInTheDocument()
      expect(within(nav).queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
      expect(screen.getByText('mock-campana')).toBeInTheDocument()
      expect(screen.getByText('Paciente')).toBeInTheDocument()
      expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    })

    it('marca como activo solo el enlace de la ruta actual', () => {
      renderEn('/mis-citas')
      expect(screen.getByRole('link', { name: 'Mis citas' })).toHaveClass('bg-helios-primary/10')
      expect(screen.getByRole('link', { name: 'Agendar cita' })).not.toHaveClass('bg-helios-primary/10')
      expect(screen.getByRole('link', { name: 'Mi perfil' })).not.toHaveClass('bg-helios-primary/10')
    })

    it('marca Mi perfil como activo en /perfil', () => {
      renderEn('/perfil')
      expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveClass('bg-helios-primary/10')
    })

    it('Cerrar sesión llama a signOut y lleva a /login', async () => {
      const user = userEvent.setup()
      renderEn()
      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
      expect(signOutMock).toHaveBeenCalledTimes(1)
      expect(await screen.findByText('pantalla-login')).toBeInTheDocument()
    })
  })

  describe('médico', () => {
    beforeEach(() => sesion({ role: 'medico', medico: { nombre: 'Dra. Ruiz' } }))

    it('muestra Mi agenda y Mi perfil con sus rutas', () => {
      renderEn('/medico')
      const nav = screen.getByRole('navigation', NAV)
      const enlaces = within(nav).getAllByRole('link')
      expect(enlaces.map((a) => a.textContent)).toEqual(['Mi agenda', 'Mi perfil'])
      expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/medico', '/medico/perfil'])
      expect(screen.getByText('Médico')).toBeInTheDocument()
    })

    it('en /medico marca Mi agenda y no Mi perfil', () => {
      renderEn('/medico')
      expect(screen.getByRole('link', { name: 'Mi agenda' })).toHaveClass('bg-helios-primary/10')
      expect(screen.getByRole('link', { name: 'Mi perfil' })).not.toHaveClass('bg-helios-primary/10')
    })

    it('en /medico/perfil marca Mi perfil y NO Mi agenda (aunque /medico sea su prefijo)', () => {
      renderEn('/medico/perfil')
      expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveClass('bg-helios-primary/10')
      expect(screen.getByRole('link', { name: 'Mi agenda' })).not.toHaveClass('bg-helios-primary/10')
    })

    it('en /medico/pacientes sigue marcando Mi agenda (parte de la agenda)', () => {
      renderEn('/medico/pacientes')
      expect(screen.getByRole('link', { name: 'Mi agenda' })).toHaveClass('bg-helios-primary/10')
      expect(screen.getByRole('link', { name: 'Mi perfil' })).not.toHaveClass('bg-helios-primary/10')
    })

    it('B-13: el nombre del médico tiene precedencia sobre el del paciente', () => {
      sesion({
        role: 'medico',
        medico: { nombre: 'Dra. Ruiz' },
        paciente: { nombre: 'Otro Nombre' },
      })
      renderEn('/medico')
      expect(screen.getByText('Dra. Ruiz')).toBeInTheDocument()
      expect(screen.queryByText('Otro Nombre')).not.toBeInTheDocument()
    })
  })

  describe('B-16: estados transitorios', () => {
    it('durante loading no hay enlaces ni campana, pero sí "Cargando…" y Cerrar sesión', () => {
      sesion({ loading: true, role: null })
      renderEn('/medico')
      expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
      expect(screen.queryByText('mock-campana')).not.toBeInTheDocument()
      expect(screen.getByText('Cargando…')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    })

    it('con sesión pero rol aún sin resolver no muestra enlaces ni campana; usa el correo como nombre', () => {
      sesion({ loading: false, role: null })
      renderEn()
      expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
      expect(screen.queryByText('mock-campana')).not.toBeInTheDocument()
      expect(screen.getByText('ana@correo.com')).toBeInTheDocument()
    })

    it('si loading es true no muestra enlaces aunque el rol ya exista', () => {
      sesion({ loading: true, role: 'paciente', paciente: { nombre: 'Ana Pérez' } })
      renderEn()
      expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
    })
  })

  describe('re-render (ramas de memoización del React Compiler)', () => {
    it('mantiene el menú al re-renderizar con la misma sesión', () => {
      sesion({ role: 'paciente', paciente: { nombre: 'Ana Pérez' } })
      const { rerender, ui } = renderEn()
      rerender(ui())
      expect(within(screen.getByRole('navigation', NAV)).getAllByRole('link')).toHaveLength(3)
    })

    it('cambia el menú cuando la sesión pasa de paciente a médico', () => {
      sesion({ role: 'paciente', paciente: { nombre: 'Ana Pérez' } })
      const { rerender, ui } = renderEn()
      expect(screen.getByRole('link', { name: 'Agendar cita' })).toBeInTheDocument()

      sesion({ role: 'medico', medico: { nombre: 'Dra. Ruiz' } })
      rerender(ui())
      expect(screen.queryByRole('link', { name: 'Agendar cita' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Mi agenda' })).toBeInTheDocument()
    })

    it('al cerrar sesión (user null) desaparecen los enlaces y aparece Iniciar sesión', () => {
      sesion({ role: 'paciente', paciente: { nombre: 'Ana Pérez' } })
      const { rerender, ui } = renderEn()
      sesion({ user: null, role: null })
      rerender(ui())
      expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })
  })
})
