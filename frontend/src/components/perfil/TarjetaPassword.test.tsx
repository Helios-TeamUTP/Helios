import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useAuthMock = vi.fn()
const cambiarPasswordMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../../hooks/useCambiarPassword', () => ({
  useCambiarPassword: () => ({
    cambiarPassword: cambiarPasswordMock,
    loading: false,
    error: null,
    setError: vi.fn(),
  }),
}))

import { TarjetaPassword } from './TarjetaPassword'

describe('TarjetaPassword (Módulo 05, HU Acción 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { email: 'juan@mail.com' } })
  })

  const llenar = (actual: string, nueva: string, confirmar: string) => {
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } })
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: nueva } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña nueva'), {
      target: { value: confirmar },
    })
  }

  it('deshabilita el botón si la confirmación no coincide', () => {
    render(<TarjetaPassword />)
    llenar('actual123', 'NuevaClave123', 'OtraCosa123')

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cambiar contraseña/i })).toBeDisabled()
    expect(cambiarPasswordMock).not.toHaveBeenCalled()
  })

  it('deshabilita el botón si la nueva contraseña es muy corta', () => {
    render(<TarjetaPassword />)
    llenar('actual123', 'corta', 'corta')

    expect(screen.getByRole('button', { name: /Cambiar contraseña/i })).toBeDisabled()
  })

  it('llama cambiarPassword con el correo de auth cuando todo es válido', async () => {
    cambiarPasswordMock.mockResolvedValue(true)
    render(<TarjetaPassword />)
    llenar('actual123', 'NuevaClave123', 'NuevaClave123')

    fireEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/i }))

    await waitFor(() => {
      expect(cambiarPasswordMock).toHaveBeenCalledWith(
        'juan@mail.com',
        'actual123',
        'NuevaClave123',
      )
    })
    expect(await screen.findByText('Contraseña actualizada ✓')).toBeInTheDocument()
  })
})
