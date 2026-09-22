import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Notificacion } from '../../lib/types'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

const { useNotificacionesMock, marcarLeidaMock, marcarTodasLeidasMock } = vi.hoisted(() => ({
  useNotificacionesMock: vi.fn(),
  marcarLeidaMock: vi.fn(),
  marcarTodasLeidasMock: vi.fn(),
}))
vi.mock('../../hooks/useNotificaciones', () => ({
  useNotificaciones: (...args: unknown[]) => useNotificacionesMock(...args),
}))

import { CampanaNotificaciones } from './CampanaNotificaciones'

function notifMock(over: Partial<Notificacion> = {}): Notificacion {
  return {
    id: 'n1',
    paciente_id: 'pac-1',
    medico_id: null,
    cita_id: 'cita-1',
    destinatario: 'paciente',
    tipo: 'creada',
    titulo: 'Cita confirmada',
    mensaje: 'Tu cita quedó agendada para el 24/08/2026',
    leida: false,
    canal: 'in_app',
    estado: 'no_aplica',
    enviado_at: null,
    created_at: '2026-08-24T00:00:00Z',
    ...over,
  }
}

describe('<CampanaNotificaciones />', () => {
  beforeEachSetup()

  function beforeEachSetup() {
    beforeEach(() => {
      vi.clearAllMocks()
      useAuthMock.mockReturnValue({ paciente: { id: 'pac-1' }, medico: null })
      useNotificacionesMock.mockReturnValue({
        data: [],
        noLeidas: 0,
        marcarLeida: marcarLeidaMock,
        marcarTodasLeidas: marcarTodasLeidasMock,
      })
    })
  }

  it('renderiza el botón de campana sin badge cuando no hay notificaciones sin leer', () => {
    render(<CampanaNotificaciones />)
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument()
  })

  it('muestra el badge con el número exacto cuando hay pocas sin leer', () => {
    useNotificacionesMock.mockReturnValue({
      data: [],
      noLeidas: 3,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    render(<CampanaNotificaciones />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Notificaciones (3 sin leer)' }),
    ).toBeInTheDocument()
  })

  it('el badge se topa en "9+" cuando hay más de 9 sin leer', () => {
    useNotificacionesMock.mockReturnValue({
      data: [],
      noLeidas: 15,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    render(<CampanaNotificaciones />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('el panel está cerrado por defecto', () => {
    render(<CampanaNotificaciones />)
    expect(screen.queryByText('Notificaciones', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('abre el panel al hacer clic en la campana y muestra el estado vacío', async () => {
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))
    expect(screen.getByText('No tienes notificaciones todavía.')).toBeInTheDocument()
  })

  it('cierra el panel al volver a hacer clic en la campana', async () => {
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    const boton = screen.getByRole('button', { name: 'Notificaciones' })
    await user.click(boton)
    expect(screen.getByText('No tienes notificaciones todavía.')).toBeInTheDocument()
    await user.click(boton)
    expect(screen.queryByText('No tienes notificaciones todavía.')).not.toBeInTheDocument()
  })

  it('renderiza la lista de notificaciones con título y mensaje', async () => {
    useNotificacionesMock.mockReturnValue({
      data: [notifMock({ id: 'n1', titulo: 'Cita confirmada' }), notifMock({ id: 'n2', titulo: 'Cita cancelada', leida: true })],
      noLeidas: 1,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    await user.click(screen.getByRole('button', { name: /Notificaciones/ }))

    expect(screen.getByText('Cita confirmada')).toBeInTheDocument()
    expect(screen.getByText('Cita cancelada')).toBeInTheDocument()
  })

  it('llama a marcarLeida con el id correcto al hacer clic en una notificación', async () => {
    useNotificacionesMock.mockReturnValue({
      data: [notifMock({ id: 'n-especifica' })],
      noLeidas: 1,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    await user.click(screen.getByRole('button', { name: /Notificaciones/ }))
    await user.click(screen.getByText('Cita confirmada'))

    expect(marcarLeidaMock).toHaveBeenCalledWith('n-especifica')
  })

  it('muestra "Marcar todas" solo cuando hay no leídas, y la llama al hacer clic', async () => {
    useNotificacionesMock.mockReturnValue({
      data: [notifMock()],
      noLeidas: 1,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    await user.click(screen.getByRole('button', { name: /Notificaciones/ }))

    const marcarTodas = screen.getByRole('button', { name: 'Marcar todas' })
    await user.click(marcarTodas)
    expect(marcarTodasLeidasMock).toHaveBeenCalledTimes(1)
  })

  it('NO muestra "Marcar todas" cuando no hay notificaciones sin leer', async () => {
    useNotificacionesMock.mockReturnValue({
      data: [notifMock({ leida: true })],
      noLeidas: 0,
      marcarLeida: marcarLeidaMock,
      marcarTodasLeidas: marcarTodasLeidasMock,
    })
    const user = userEvent.setup()
    render(<CampanaNotificaciones />)
    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))
    expect(screen.queryByRole('button', { name: 'Marcar todas' })).not.toBeInTheDocument()
  })

  it('cierra el panel al hacer clic fuera del componente', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <CampanaNotificaciones />
        <button type="button">fuera</button>
      </div>,
    )
    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))
    expect(screen.getByText('No tienes notificaciones todavía.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'fuera' }))
    await waitFor(() =>
      expect(screen.queryByText('No tienes notificaciones todavía.')).not.toBeInTheDocument(),
    )
  })

  it('pasa el id de paciente y medico correctos al hook useNotificaciones', () => {
    useAuthMock.mockReturnValue({ paciente: null, medico: { id: 'med-9' } })
    render(<CampanaNotificaciones />)
    expect(useNotificacionesMock).toHaveBeenCalledWith(null, 'med-9')
  })
})
