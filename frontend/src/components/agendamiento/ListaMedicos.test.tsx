import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../hooks/useMedicos', () => ({
  useMedicos: () => ({
    data: [
      {
        id: 'med-1',
        nombre: 'Ana López',
        especialidad_id: 'esp-1',
        sede_id: 'sede-1',
        correo: null,
        telefono: null,
        activo: true,
        created_at: '',
        especialidad: { id: 'esp-1', nombre: 'Cardiología', descripcion: null, created_at: '' },
        sede: {
          id: 'sede-1',
          nombre: 'Policlínica Central',
          ciudad: 'Panamá',
          direccion: null,
          capacidad_diaria: 0,
          activo: true,
          created_at: '',
        },
      },
    ],
    loading: false,
    error: null,
  }),
}))

import { ListaMedicos } from './ListaMedicos'

describe('<ListaMedicos />', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra los médicos disponibles', () => {
    render(<ListaMedicos sedeId="sede-1" especialidadId="esp-1" value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Dr(a). Ana López')).toBeInTheDocument()
    expect(screen.getByText(/Cardiología/)).toBeInTheDocument()
  })

  it('llama a onChange con id y nombre al seleccionar', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ListaMedicos sedeId="sede-1" especialidadId="esp-1" value={null} onChange={onChange} />)
    await user.click(screen.getByText('Dr(a). Ana López'))
    expect(onChange).toHaveBeenCalledWith('med-1', 'Ana López')
  })
})
