import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useAuthMock = vi.fn()
const actualizarNombreMock = vi.fn()
const refreshPerfilMock = vi.fn()
const setErrorMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../../hooks/useActualizarNombre', () => ({
  useActualizarNombre: () => ({
    actualizarNombre: actualizarNombreMock,
    loading: false,
    error: null,
    setError: setErrorMock,
  }),
}))

import { TarjetaNombre } from './TarjetaNombre'

describe('TarjetaNombre (Módulo 05, HU Acción 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      paciente: { id: 'p1', nombre: 'Juan Pérez', cedula: '8-123-456', telefono: null, correo: 'juan@mail.com', fecha_nacimiento: null, created_at: '' },
      refreshPerfil: refreshPerfilMock,
    })
  })

  it('precarga el nombre actual del paciente', () => {
    render(<TarjetaNombre />)
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
  })

  it('el botón Guardar está deshabilitado si no hay cambios', () => {
    render(<TarjetaNombre />)
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled()
  })

  it('al guardar con éxito, llama actualizarNombre con solo id+nombre y refresca el perfil', async () => {
    actualizarNombreMock.mockResolvedValue(true)
    render(<TarjetaNombre />)

    const input = screen.getByLabelText('Nombre completo')
    fireEvent.change(input, { target: { value: 'Juan Pérez Nuevo' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    await waitFor(() => {
      expect(actualizarNombreMock).toHaveBeenCalledWith('p1', 'Juan Pérez Nuevo')
    })
    expect(refreshPerfilMock).toHaveBeenCalled()
    expect(await screen.findByText('Nombre actualizado ✓')).toBeInTheDocument()
  })

  it('rechaza un nombre inválido ANTES de llamar a Supabase (dígitos no permitidos)', async () => {
    render(<TarjetaNombre />)

    const input = screen.getByLabelText('Nombre completo')
    fireEvent.change(input, { target: { value: 'Juan123' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    await waitFor(() => {
      expect(setErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(/nombre válido/),
      )
    })
    expect(actualizarNombreMock).not.toHaveBeenCalled()
  })
})
