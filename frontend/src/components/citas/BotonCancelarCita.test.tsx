import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: rpcMock } }))

import { BotonCancelarCita } from './BotonCancelarCita'

describe('<BotonCancelarCita /> (ST-37)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('abre el modal de confirmación al hacer clic en Cancelar', async () => {
    const user = userEvent.setup()
    render(<BotonCancelarCita citaId="c1" onCancelada={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('¿Cancelar esta cita?')).toBeInTheDocument()
  })

  it('confirma: llama la RPC y onCancelada al éxito', async () => {
    rpcMock.mockResolvedValue({ data: [{}], error: null })
    const onCancelada = vi.fn()
    const user = userEvent.setup()
    render(<BotonCancelarCita citaId="c1" onCancelada={onCancelada} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: /Sí, cancelar cita/ }))

    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith('cancelar_cita_atomica', { p_cita_id: 'c1' })
      expect(onCancelada).toHaveBeenCalled()
    })
  })

  it('muestra el error si la RPC falla y NO llama onCancelada', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'No autorizado: la cita no pertenece al usuario actual' },
    })
    const onCancelada = vi.fn()
    const user = userEvent.setup()
    render(<BotonCancelarCita citaId="c1" onCancelada={onCancelada} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: /Sí, cancelar cita/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/No autorizado/)
    expect(onCancelada).not.toHaveBeenCalled()
  })
})
