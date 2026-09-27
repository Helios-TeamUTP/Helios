import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useAuthMock = vi.fn()
const actualizarNombreMedicoMock = vi.fn()
const refreshPerfilMock = vi.fn()
const setErrorMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('../../hooks/useActualizarNombreMedico', () => ({
  useActualizarNombreMedico: () => ({
    actualizarNombreMedico: actualizarNombreMedicoMock,
    loading: false,
    error: null,
    setError: setErrorMock,
  }),
}))

import { TarjetaNombreMedico } from './TarjetaNombreMedico'

describe('TarjetaNombreMedico (Módulo 05, extensión médico)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      medico: { id: 'm1', nombre: 'Dr. García', especialidad_id: 'e1', sede_id: 's1', correo: null, telefono: null, activo: true, created_at: '' },
      refreshPerfil: refreshPerfilMock,
    })
  })

  it('precarga el nombre actual del médico', () => {
    render(<TarjetaNombreMedico />)
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Dr. García')
  })

  it('el botón Guardar está deshabilitado si no hay cambios', () => {
    render(<TarjetaNombreMedico />)
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled()
  })

  it('al guardar con éxito, llama actualizarNombreMedico y refresca el perfil', async () => {
    actualizarNombreMedicoMock.mockResolvedValue(true)
    render(<TarjetaNombreMedico />)

    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Dr. García Nuevo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    await waitFor(() => {
      expect(actualizarNombreMedicoMock).toHaveBeenCalledWith('m1', 'Dr. García Nuevo')
    })
    expect(refreshPerfilMock).toHaveBeenCalled()
    expect(await screen.findByText('Nombre actualizado ✓')).toBeInTheDocument()
  })

  it('rechaza un nombre inválido antes de llamar a Supabase', async () => {
    render(<TarjetaNombreMedico />)

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Dr123' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    await waitFor(() => {
      expect(setErrorMock).toHaveBeenCalledWith(expect.stringMatching(/nombre válido/))
    })
    expect(actualizarNombreMedicoMock).not.toHaveBeenCalled()
  })
})
