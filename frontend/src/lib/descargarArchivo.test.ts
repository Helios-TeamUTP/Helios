import { describe, it, expect, vi, afterEach } from 'vitest'
import { descargarBytes } from './descargarArchivo'

describe('descargarBytes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('crea un enlace con el nombre de archivo, lo clickea y libera la URL', () => {
    vi.useFakeTimers()
    const crear = vi.fn().mockReturnValue('blob:helios-1')
    const revocar = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: crear, revokeObjectURL: revocar })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const bytes = new Uint8Array([37, 80, 68, 70]) // "%PDF"
    descargarBytes(bytes, 'historial.pdf')

    // El Blob se creó con el tipo correcto y el contenido original.
    const blob = crear.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBe(4)

    expect(click).toHaveBeenCalledTimes(1)
    const enlace = click.mock.contexts[0] as HTMLAnchorElement
    expect(enlace.download).toBe('historial.pdf')
    expect(enlace.href).toContain('blob:helios-1')
    // El enlace temporal no queda colgado en el DOM.
    expect(document.querySelector('a[download="historial.pdf"]')).toBeNull()

    // La URL se libera en el siguiente ciclo, no antes de que el navegador la lea.
    expect(revocar).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revocar).toHaveBeenCalledWith('blob:helios-1')
    vi.unstubAllGlobals()
  })
})
