import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { useAuthMock, signOutMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  signOutMock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

import { ProtectedRoute } from './ProtectedRoute'

function renderRuta() {
  return render(
    <MemoryRouter initialEntries={['/agendar']}>
      <Routes>
        <Route path="/login" element={<div>PANTALLA LOGIN</div>} />
        <Route path="/registro" element={<div>PANTALLA REGISTRO</div>} />
        <Route path="/medico" element={<div>PANTALLA MEDICO</div>} />
        <Route element={<ProtectedRoute requireRole="paciente" />}>
          <Route path="/agendar" element={<div>PANTALLA AGENDAR</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const base = {
  user: { id: 'u1', email: 'a@test.com' },
  role: null,
  loading: false,
  loadPerfilFailed: false,
  refreshPerfil: vi.fn(),
  signOut: signOutMock,
}

describe('<ProtectedRoute />', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sin sesión redirige a /login', () => {
    useAuthMock.mockReturnValue({ ...base, user: null })
    renderRuta()
    expect(screen.getByText('PANTALLA LOGIN')).toBeInTheDocument()
  })

  it('paciente entra a la ruta', () => {
    useAuthMock.mockReturnValue({ ...base, role: 'paciente' })
    renderRuta()
    expect(screen.getByText('PANTALLA AGENDAR')).toBeInTheDocument()
  })

  it('médico en ruta de paciente va a /medico', () => {
    useAuthMock.mockReturnValue({ ...base, role: 'medico' })
    renderRuta()
    expect(screen.getByText('PANTALLA MEDICO')).toBeInTheDocument()
  })

  it('sesión sin perfil NO redirige a /registro: muestra "No encontramos tu perfil"', () => {
    useAuthMock.mockReturnValue({ ...base, role: null })
    renderRuta()
    expect(screen.getByText('No encontramos tu perfil')).toBeInTheDocument()
    expect(screen.queryByText('PANTALLA REGISTRO')).not.toBeInTheDocument()
  })

  it('si loadPerfil falló muestra "Reintentar" y no asume cuenta sin perfil', () => {
    useAuthMock.mockReturnValue({ ...base, loadPerfilFailed: true })
    renderRuta()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText('No encontramos tu perfil')).not.toBeInTheDocument()
  })
})
