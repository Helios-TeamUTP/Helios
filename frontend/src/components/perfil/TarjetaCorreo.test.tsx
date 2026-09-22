import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useAuthMock = vi.fn()
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

import { TarjetaCorreo } from './TarjetaCorreo'

describe('TarjetaCorreo (Módulo 05, HU Acción 2 — solo lectura)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      paciente: { id: 'p1', nombre: 'Juan Pérez', correo: 'juan@mail.com' },
    })
  })

  it('muestra el correo actual pero el campo está deshabilitado', () => {
    render(<TarjetaCorreo />)
    const input = screen.getByLabelText('Correo') as HTMLInputElement
    expect(input.value).toBe('juan@mail.com')
    expect(input).toBeDisabled()
  })
})
