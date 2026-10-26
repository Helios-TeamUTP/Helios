import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../components/perfil/TarjetaNombreMedico', () => ({
  TarjetaNombreMedico: () => <div>mock-tarjeta-nombre-medico</div>,
}))
vi.mock('../components/perfil/TarjetaPassword', () => ({
  TarjetaPassword: () => <div>mock-tarjeta-password</div>,
}))

import { PerfilMedico } from './PerfilMedico'

describe('PerfilMedico (Módulo 05, extensión médico)', () => {
  it('renderiza la tarjeta de nombre', () => {
    render(<PerfilMedico />)
    expect(screen.getByText('mock-tarjeta-nombre-medico')).toBeInTheDocument()
  })

  it('renderiza la tarjeta de cambiar contraseña', () => {
    render(<PerfilMedico />)
    expect(screen.getByText('mock-tarjeta-password')).toBeInTheDocument()
  })

  it('tiene el encabezado "Mi perfil" y menciona nombre y contraseña', () => {
    render(<PerfilMedico />)
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByText(/actualiza tu nombre y cambia tu contraseña/i)).toBeInTheDocument()
  })
})
