import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Las tarjetas ya tienen su propia suite de tests — aquí solo verificamos
// que Perfil.tsx las junta todas, sin duplicar su lógica interna.
vi.mock('../components/perfil/TarjetaNombre', () => ({
  TarjetaNombre: () => <div>mock-tarjeta-nombre</div>,
}))
vi.mock('../components/perfil/TarjetaCorreo', () => ({
  TarjetaCorreo: () => <div>mock-tarjeta-correo</div>,
}))
vi.mock('../components/perfil/TarjetaPassword', () => ({
  TarjetaPassword: () => <div>mock-tarjeta-password</div>,
}))

import { Perfil } from './Perfil'

describe('Perfil (Módulo 05, página paciente)', () => {
  it('renderiza las 3 tarjetas: nombre, correo y contraseña', () => {
    render(<Perfil />)
    expect(screen.getByText('mock-tarjeta-nombre')).toBeInTheDocument()
    expect(screen.getByText('mock-tarjeta-correo')).toBeInTheDocument()
    expect(screen.getByText('mock-tarjeta-password')).toBeInTheDocument()
  })

  it('tiene el encabezado "Mi perfil"', () => {
    render(<Perfil />)
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
  })
})
