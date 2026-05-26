import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('<LoadingSpinner />', () => {
  it('muestra el label por defecto', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })

  it('muestra el label personalizado cuando se pasa', () => {
    render(<LoadingSpinner label="Buscando médicos…" />)
    expect(screen.getByText('Buscando médicos…')).toBeInTheDocument()
  })
})
