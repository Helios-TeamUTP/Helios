import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TimeoutError } from '../lib/withTimeout'

const { resetMock } = vi.hoisted(() => ({ resetMock: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: resetMock } },
}))

import { RecuperarContrasena } from './RecuperarContrasena'

function renderPage() {
  return render(
    <MemoryRouter>
      <RecuperarContrasena />
    </MemoryRouter>,
  )
}

async function pedirEnlace(correo: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/correo electrónico/i), correo)
  await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
}

describe('<RecuperarContrasena /> (RF-04, paso 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMock.mockResolvedValue({ data: {}, error: null })
  })

  it('pide el enlace con el correo y la redirección a /restablecer', async () => {
    renderPage()
    await pedirEnlace('  ana@ejemplo.com ')

    await waitFor(() => expect(resetMock).toHaveBeenCalledTimes(1))
    expect(resetMock).toHaveBeenCalledWith('ana@ejemplo.com', {
      redirectTo: `${window.location.origin}/restablecer`,
    })
  })

  it('muestra un mensaje genérico de éxito (no revela si el correo existe)', async () => {
    renderPage()
    await pedirEnlace('ana@ejemplo.com')

    const aviso = await screen.findByRole('status')
    expect(aviso).toHaveTextContent(/si hay una cuenta con ese correo/i)
    expect(aviso).not.toHaveTextContent(/no existe|no está registrado/i)
  })

  it('deshabilita el reenvío durante la espera de 60 s', async () => {
    renderPage()
    await pedirEnlace('ana@ejemplo.com')

    const boton = await screen.findByRole('button', { name: /reenviar en \d+ s/i })
    expect(boton).toBeDisabled()
  })

  it('rechaza un correo inválido sin llamar a Supabase', async () => {
    renderPage()
    await pedirEnlace('esto-no-es-un-correo')

    expect(await screen.findByText(/correo electrónico válido/i)).toBeInTheDocument()
    expect(resetMock).not.toHaveBeenCalled()
  })

  it('traduce el límite de frecuencia (429) y bloquea el botón', async () => {
    resetMock.mockResolvedValue({
      data: null,
      error: { status: 429, message: 'For security purposes, you can only request this after 60 seconds.' },
    })
    renderPage()
    await pedirEnlace('ana@ejemplo.com')

    expect(await screen.findByText(/espera un minuto/i)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reenviar en \d+ s/i })).toBeDisabled()
  })

  it('muestra un error genérico si Supabase falla y deja reintentar', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    resetMock.mockResolvedValue({ data: null, error: { status: 500, message: 'boom' } })
    renderPage()
    await pedirEnlace('ana@ejemplo.com')

    expect(await screen.findByText(/no pudimos enviar el enlace/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeEnabled()
    errSpy.mockRestore()
  })

  it('informa el timeout y rehabilita el botón', async () => {
    resetMock.mockRejectedValue(new TimeoutError(15000))
    renderPage()
    await pedirEnlace('ana@ejemplo.com')

    expect(await screen.findByText(/tardó demasiado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeEnabled()
  })

  it('ofrece volver al login', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /volver a iniciar sesión/i })).toHaveAttribute('href', '/login')
  })
})
