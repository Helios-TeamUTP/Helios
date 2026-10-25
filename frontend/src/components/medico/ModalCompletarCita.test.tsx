import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalCompletarCita } from './ModalCompletarCita'
import type { CitaConPaciente } from '../../lib/types'

function citaMock(over: Partial<CitaConPaciente> = {}): CitaConPaciente {
  return {
    id: 'cita-1',
    paciente_id: 'pac-1',
    medico_id: 'med-1',
    horario_id: 'hor-1',
    sede_id: 'sede-1',
    estado: 'confirmada',
    codigo_confirmacion: 'ABC123',
    created_at: '2026-08-24T00:00:00Z',
    paciente: {
      id: 'pac-1',
      nombre: 'Juan Pérez',
      cedula: '8-123-4567',
      telefono: null,
      correo: null,
      fecha_nacimiento: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    ...over,
  }
}

describe('<ModalCompletarCita />', () => {
  it('renderiza el nombre del paciente y los tres campos del formulario', () => {
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={vi.fn()} />)
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Dolencia principal/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Receta/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Notas clínicas/)).toBeInTheDocument()
  })

  it('usa "este paciente" como fallback si la cita no trae paciente', () => {
    render(
      <ModalCompletarCita
        cita={citaMock({ paciente: null })}
        onClose={vi.fn()}
        onGuardar={vi.fn()}
      />,
    )
    expect(screen.getByText(/este paciente/)).toBeInTheDocument()
  })

  it('muestra error de validación si la dolencia es solo espacios en blanco', async () => {
    // El textarea tiene `required` de HTML5, que bloquea el submit nativo
    // si esta vacio de verdad. Usamos solo espacios para pasar esa validacion
    // nativa y ejercitar el chequeo .trim() propio del componente.
    const onGuardar = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), '   ')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /La dolencia principal es obligatoria/,
    )
    expect(onGuardar).not.toHaveBeenCalled()
  })

  it('llama a onGuardar con dolencia obligatoria y receta/notas null si están vacías', async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(
      screen.getByLabelText(/Dolencia principal/),
      '  Dolor abdominal difuso  ',
    )
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        dolenciaPrincipal: 'Dolor abdominal difuso', // trim aplicado
        receta: null,
        notasClinicas: null,
      }),
    )
  })

  it('envía receta y notas con trim cuando sí se llenan', async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), 'Gripe')
    await user.type(screen.getByLabelText(/^Receta/), '  Acetaminofén 500mg  ')
    await user.type(screen.getByLabelText(/Notas clínicas/), '  Control en 48h  ')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        dolenciaPrincipal: 'Gripe',
        receta: 'Acetaminofén 500mg',
        notasClinicas: 'Control en 48h',
      }),
    )
  })

  it('muestra "Guardando…" y deshabilita los botones mientras envía', async () => {
    let resolver: () => void = () => {}
    const onGuardar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve
        }),
    )
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), 'Gripe')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    expect(await screen.findByRole('button', { name: /Guardando…/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeDisabled()

    resolver()
  })

  it('muestra el mensaje de error y reactiva el botón si onGuardar rechaza', async () => {
    const onGuardar = vi.fn().mockRejectedValue(new Error('Fallo de red'))
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), 'Gripe')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo de red')
    expect(screen.getByRole('button', { name: /Guardar y completar/ })).not.toBeDisabled()
  })

  it('muestra un mensaje genérico si el error no es una instancia de Error', async () => {
    const onGuardar = vi.fn().mockRejectedValue('string de error raro')
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={vi.fn()} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), 'Gripe')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo guardar/)
  })

  it('llama a onClose al hacer clic en Cancelar', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al hacer clic en el botón X', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al hacer clic en el fondo (backdrop)', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar al hacer clic fuera' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('mientras guarda, ni Escape ni el fondo cierran el modal', async () => {
    let resolver: () => void = () => {}
    const onGuardar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve
        }),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/Dolencia principal/), 'Gripe')
    await user.click(screen.getByRole('button', { name: /Guardar y completar/ }))
    await screen.findByRole('button', { name: /Guardando…/ })

    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Cerrar al hacer clic fuera' })).toBeDisabled()
    expect(onClose).not.toHaveBeenCalled()

    resolver()
  })

  it('cierra con Escape cuando el foco está dentro del modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={vi.fn()} />)

    await user.click(screen.getByLabelText(/Dolencia principal/))
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('NO cierra al hacer clic dentro del formulario (stopPropagation)', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalCompletarCita cita={citaMock()} onClose={onClose} onGuardar={vi.fn()} />)

    await user.click(screen.getByLabelText(/Dolencia principal/))
    expect(onClose).not.toHaveBeenCalled()
  })
})
