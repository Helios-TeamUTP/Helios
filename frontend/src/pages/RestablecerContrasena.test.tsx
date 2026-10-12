import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { updateUserMock, signOutMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
  signOutMock: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { updateUser: updateUserMock, signOut: signOutMock } },
}))

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

import { RestablecerContrasena } from './RestablecerContrasena'
import { llegoPorRecuperacion } from '../lib/recuperacion'

// Contraseñas de prueba generadas por código (no literales): evita falsos
// positivos de los escáneres de secretos.
const fuerte = (largo: number) => 'Aa1' + 'x'.repeat(Math.max(largo - 3, 0))
const VALIDA = fuerte(10)
const CORTA = fuerte(7)
const SIN_MAYUSCULA = 'a1' + 'x'.repeat(8)
const OTRA = VALIDA + 'z'

function LoginProbe() {
  const { state } = useLocation()
  return <div>LOGIN {JSON.stringify(state)}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/restablecer']}>
      <Routes>
        <Route path="/restablecer" element={<RestablecerContrasena />} />
        <Route path="/login" element={<LoginProbe />} />
        <Route path="/recuperar" element={<div>PEDIR ENLACE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function llenar(password: string, confirmar: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^contraseña nueva/i), password)
  await user.type(screen.getByLabelText(/confirmar contraseña/i), confirmar)
  await user.click(screen.getByRole('button', { name: /guardar contraseña/i }))
}

describe('<RestablecerContrasena /> (RF-04, paso 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    sessionStorage.setItem('helios.recuperacion', '1') // llegó por el enlace del correo
    useAuthMock.mockReturnValue({ user: { id: 'u1' }, loading: false })
    updateUserMock.mockResolvedValue({ data: {}, error: null })
    signOutMock.mockResolvedValue({ error: null })
  })

  it('muestra "enlace no válido" si no llegó por un enlace de recuperación', () => {
    sessionStorage.clear()
    renderPage()
    expect(screen.getByRole('heading', { name: /enlace no válido/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pedir un enlace nuevo/i })).toHaveAttribute('href', '/recuperar')
    expect(screen.queryByLabelText(/contraseña nueva/i)).not.toBeInTheDocument()
  })

  it('muestra "enlace no válido" si el enlace venció (no hay sesión de recuperación)', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })
    renderPage()
    expect(screen.getByRole('heading', { name: /enlace no válido/i })).toBeInTheDocument()
  })

  it('un usuario con sesión normal (sin marca de recuperación) no puede usar la página', () => {
    sessionStorage.clear()
    useAuthMock.mockReturnValue({ user: { id: 'u1' }, loading: false })
    renderPage()
    expect(screen.queryByLabelText(/contraseña nueva/i)).not.toBeInTheDocument()
  })

  it('muestra el spinner mientras se verifica la sesión', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })
    renderPage()
    expect(screen.getByText(/verificando enlace/i)).toBeInTheDocument()
  })

  it('rechaza una contraseña débil sin llamar a Supabase', async () => {
    renderPage()
    await llenar(CORTA, CORTA)
    expect(await screen.findByRole('alert')).toHaveTextContent(/al menos 8 caracteres/i)
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('exige mayúscula y número', async () => {
    renderPage()
    await llenar(SIN_MAYUSCULA, SIN_MAYUSCULA)
    expect(await screen.findByRole('alert')).toHaveTextContent(/mayúscula/i)
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('rechaza si las contraseñas no coinciden', async () => {
    renderPage()
    await llenar(VALIDA, OTRA)
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('actualiza la contraseña, cierra TODAS las sesiones y vuelve al login con aviso', async () => {
    renderPage()
    await llenar(VALIDA, VALIDA)

    await waitFor(() => expect(updateUserMock).toHaveBeenCalledWith({ password: VALIDA }))
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'global' })
    expect(await screen.findByText(/LOGIN/)).toHaveTextContent('"passwordRestablecida":true')
    expect(llegoPorRecuperacion()).toBe(false) // la marca se consume
  })

  it('traduce "misma contraseña" y no cierra sesión', async () => {
    updateUserMock.mockResolvedValue({
      data: null,
      error: { code: 'same_password', message: 'New password should be different' },
    })
    renderPage()
    await llenar(VALIDA, VALIDA)
    expect(await screen.findByText(/distinta de la anterior/i)).toBeInTheDocument()
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('traduce "contraseña débil" del servidor', async () => {
    updateUserMock.mockResolvedValue({ data: null, error: { code: 'weak_password', message: 'weak' } })
    renderPage()
    await llenar(VALIDA, VALIDA)
    expect(await screen.findByText(/demasiado débil/i)).toBeInTheDocument()
  })

  it('error genérico si el enlace expiró durante el cambio', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    updateUserMock.mockResolvedValue({ data: null, error: { code: 'session_not_found', message: 'x' } })
    renderPage()
    await llenar(VALIDA, VALIDA)
    expect(await screen.findByText(/pide un enlace nuevo/i)).toBeInTheDocument()
    errSpy.mockRestore()
  })

  it('informa el timeout y rehabilita el botón', async () => {
    updateUserMock.mockRejectedValue(new TimeoutError(15000))
    renderPage()
    await llenar(VALIDA, VALIDA)
    expect(await screen.findByText(/tardó demasiado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar contraseña/i })).toBeEnabled()
  })

  it('si falla el signOut global igual manda al login (la contraseña ya cambió)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    signOutMock.mockRejectedValue(new Error('network'))
    renderPage()
    await llenar(VALIDA, VALIDA)
    expect(await screen.findByText(/LOGIN/)).toBeInTheDocument()
    errSpy.mockRestore()
  })
})
