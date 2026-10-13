import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { resetMock } = vi.hoisted(() => ({ resetMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: resetMock } },
}))

import { RecuperarPassword } from './RecuperarPassword'

function renderPagina() {
  return render(
    <MemoryRouter>
      <RecuperarPassword />
    </MemoryRouter>,
  )
}

describe('<RecuperarPassword />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    resetMock.mockResolvedValue({ data: {}, error: null })
  })

  it('renderiza el campo de correo y el enlace de volver al login', () => {
    renderPagina()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByText('Iniciar sesión')).toHaveAttribute('href', '/login')
  })

  it('rechaza un correo con formato inválido sin llamar a Supabase', async () => {
    const user = userEvent.setup()
    renderPagina()
    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Correo electrónico inválido/)
    expect(resetMock).not.toHaveBeenCalled()
  })

  it('envía el enlace y muestra confirmación genérica (no revela si el correo existe)', async () => {
    const user = userEvent.setup()
    renderPagina()
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(resetMock).toHaveBeenCalledWith('ana@test.com', {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/Si ese correo está registrado/)
  })

  it('"Usar otro correo" vuelve al formulario vacío', async () => {
    const user = userEvent.setup()
    renderPagina()
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    await user.click(await screen.findByRole('button', { name: 'Usar otro correo' }))

    expect((screen.getByLabelText('Correo electrónico') as HTMLInputElement).value).toBe('')
  })

  it('muestra el error del hook y rehabilita el botón si falla el envío', async () => {
    resetMock.mockResolvedValue({ data: null, error: { status: 429, message: 'rate limit' } })
    const user = userEvent.setup()
    renderPagina()
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Demasiados intentos/)
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).not.toBeDisabled()
  })
})
