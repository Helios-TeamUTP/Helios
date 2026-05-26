import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorMessage } from './ErrorMessage'

describe('<ErrorMessage />', () => {
  it('renderiza el mensaje con rol alert para a11y', () => {
    render(<ErrorMessage message="No se pudo cargar la lista" />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('No se pudo cargar la lista')
  })
})
