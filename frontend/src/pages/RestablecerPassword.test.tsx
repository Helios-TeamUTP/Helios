import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

const { updateUserMock, signOutMock, useAuthMock, signOutContextMock, leerEstadoMock, limpiarMock } =
  vi.hoisted(() => ({
    updateUserMock: vi.fn(),
    signOutMock: vi.fn(),
    useAuthMock: vi.fn(),
    signOutContextMock: vi.fn(),
    leerEstadoMock: vi.fn(),
    limpiarMock: vi.fn(),
  }))

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { updateUser: updateUserMock, signOut: signOutMock } },
}))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../lib/recuperacionPassword', () => ({
  leerEstadoRecuperacion: leerEstadoMock,
  limpiarEstadoRecuperacion: limpiarMock,
}))

import { RestablecerPassword } from './RestablecerPassword'

/** Destino falso de /login que expone el state de navegación. */
function LoginStub() {
  const state = useLocation().state as { passwordRestablecida?: boolean } | null
  return <div>LOGIN {state?.passwordRestablecida ? 'con-banner' : 'sin-banner'}</div>
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/restablecer-password']}>
      <Routes>
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function llenar(user: ReturnType<typeof userEvent.setup>, nueva: string, confirmar: string) {
  await user.type(screen.getByLabelText('Contraseña nueva'), nueva)
  await user.type(screen.getByLabelText('Confirmar contraseña nueva'), confirmar)
  await user.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }))
}

// Contraseña de prueba generada por código (no literal): evita falsos positivos
// de los escáneres de secretos (GitGuardian) en el PR.
const CLAVE_NUEVA = 'Cn1' + 'x'.repeat(9)

describe('<RestablecerPassword />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    leerEstadoMock.mockReturnValue('valido')
    useAuthMock.mockReturnValue({
      session: { user: { id: 'u1' } },
      loading: false,
      signOut: signOutContextMock,
    })
    updateUserMock.mockResolvedValue({ data: {}, error: null })
    signOutMock.mockResolvedValue({ error: null })
    signOutContextMock.mockResolvedValue(undefined)
  })

  it('muestra el spinner mientras se verifica la sesión', () => {
    useAuthMock.mockReturnValue({ session: null, loading: true, signOut: signOutContextMock })
    renderPagina()
    expect(screen.getByText('Verificando enlace…')).toBeInTheDocument()
  })

  it('sin enlace de recuperación válido → "Enlace inválido o expirado" con link para pedir otro', () => {
    leerEstadoMock.mockReturnValue(null)
    renderPagina()
    expect(screen.getByText('Enlace inválido o expirado')).toBeInTheDocument()
    expect(screen.getByText('Pedir un enlace nuevo')).toHaveAttribute('href', '/recuperar-password')
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })

  it('enlace marcado como expirado → mismo mensaje', () => {
    leerEstadoMock.mockReturnValue('expirado')
    renderPagina()
    expect(screen.getByText('Enlace inválido o expirado')).toBeInTheDocument()
  })

  it('enlace válido pero sin sesión (Supabase no pudo crearla) → enlace inválido', () => {
    useAuthMock.mockReturnValue({ session: null, loading: false, signOut: signOutContextMock })
    renderPagina()
    expect(screen.getByText('Enlace inválido o expirado')).toBeInTheDocument()
  })

  it('rechaza contraseñas de menos de 6 caracteres sin llamar a Supabase', async () => {
    const user = userEvent.setup()
    renderPagina()
    await llenar(user, 'corta', 'corta')
    expect(await screen.findByRole('alert')).toHaveTextContent(/al menos 6 caracteres/)
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('rechaza si la confirmación no coincide', async () => {
    const user = userEvent.setup()
    renderPagina()
    await llenar(user, CLAVE_NUEVA, CLAVE_NUEVA + 'z')
    expect(await screen.findByRole('alert')).toHaveTextContent(/no coinciden/)
    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('happy path: actualiza, cierra todas las sesiones, limpia estado y va a /login con banner', async () => {
    const user = userEvent.setup()
    renderPagina()
    await llenar(user, CLAVE_NUEVA, CLAVE_NUEVA)

    expect(await screen.findByText('LOGIN con-banner')).toBeInTheDocument()
    expect(updateUserMock).toHaveBeenCalledWith({ password: CLAVE_NUEVA })
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'global' })
    expect(signOutContextMock).toHaveBeenCalled()
    expect(limpiarMock).toHaveBeenCalled()
  })

  it('si updateUser falla muestra el error, NO cierra sesión y rehabilita el botón', async () => {
    updateUserMock.mockResolvedValue({ data: null, error: { code: 'same_password', message: 'x' } })
    const user = userEvent.setup()
    renderPagina()
    await llenar(user, CLAVE_NUEVA, CLAVE_NUEVA)

    expect(await screen.findByRole('alert')).toHaveTextContent(/distinta a la anterior/)
    expect(signOutMock).not.toHaveBeenCalled()
    expect(limpiarMock).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar contraseña nueva' })).not.toBeDisabled(),
    )
  })
})
