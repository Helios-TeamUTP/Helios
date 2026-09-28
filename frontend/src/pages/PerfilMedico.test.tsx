import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../components/perfil/TarjetaNombreMedico', () => ({
  TarjetaNombreMedico: () => <div>mock-tarjeta-nombre-medico</div>,
}))

import { PerfilMedico } from './PerfilMedico'

describe('PerfilMedico (Módulo 05, extensión médico)', () => {
  it('renderiza la tarjeta de nombre', () => {
    render(<PerfilMedico />)
    expect(screen.getByText('mock-tarjeta-nombre-medico')).toBeInTheDocument()
  })

  it('tiene el encabezado "Mi perfil" y el aviso de alcance mínimo', () => {
    render(<PerfilMedico />)
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByText(/solo puedes actualizar tu nombre/i)).toBeInTheDocument()
  })
})
