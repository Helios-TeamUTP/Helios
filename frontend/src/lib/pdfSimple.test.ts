import { describe, it, expect } from 'vitest'
import { aLatin1, generarPdf } from './pdfSimple'

const comoTexto = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes)

describe('aLatin1', () => {
  it('conserva los acentos y la ñ del español', () => {
    expect(aLatin1('Médico: José Núñez ¿qué? ¡hola!')).toBe('Médico: José Núñez ¿qué? ¡hola!')
  })

  it('sustituye lo que Latin-1 no tiene (guiones largos, comillas curvas, emoji)', () => {
    expect(aLatin1('a—b “c” ‘d’ …')).toBe('a-b "c" \'d\' ...')
    expect(aLatin1('x😀y')).toBe('x?y')
  })
})

describe('generarPdf', () => {
  it('produce un PDF válido: cabecera, EOF y bytes (no texto UTF-8)', () => {
    const bytes = generarPdf([{ texto: 'Hola', estilo: 'titulo' }])
    expect(bytes).toBeInstanceOf(Uint8Array)
    const txt = comoTexto(bytes)
    expect(txt.startsWith('%PDF-1.4')).toBe(true)
    expect(txt.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(txt).toContain('(Hola) Tj')
  })

  it('codifica los acentos como UN byte Latin-1 (á = 0xE1), no como UTF-8 de 2 bytes', () => {
    const bytes = generarPdf([{ texto: 'á' }])
    expect(bytes).toContain(0xe1)
    expect(bytes).not.toContain(0xc3) // prefijo UTF-8 de "á"
  })

  it('escapa paréntesis y barras invertidas', () => {
    const txt = comoTexto(generarPdf([{ texto: 'dosis (2x) a\\b' }]))
    expect(txt).toContain('(dosis \\(2x\\) a\\\\b) Tj')
  })

  it('la tabla xref apunta exactamente al inicio de cada objeto', () => {
    const bytes = generarPdf([{ texto: 'Uno' }, { texto: 'Dos', estilo: 'subtitulo' }])
    const txt = comoTexto(bytes)

    const inicioXref = Number(/startxref\n(\d+)\n/.exec(txt)?.[1])
    expect(txt.slice(inicioXref, inicioXref + 4)).toBe('xref')

    const entradas = [...txt.slice(inicioXref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
      Number(m[1]),
    )
    expect(entradas.length).toBeGreaterThanOrEqual(6) // catálogo, páginas, 2 fuentes, página, contenido
    entradas.forEach((offset, i) => {
      expect(txt.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
    })
  })

  it('/Length de cada stream coincide con su contenido real', () => {
    const txt = comoTexto(generarPdf([{ texto: 'Contenido de prueba con tilde: ñ' }]))
    const m = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(txt)
    expect(m).not.toBeNull()
    expect(Number(m?.[1])).toBe(m?.[2].length)
  })

  it('cada \\n inicia un renglón nuevo', () => {
    const txt = comoTexto(generarPdf([{ texto: 'a\nb\nc' }]))
    expect(txt.match(/\) Tj/g)).toHaveLength(3)
  })

  it('ajusta las líneas largas en varios renglones', () => {
    const largo = 'palabra '.repeat(80).trim()
    const txt = comoTexto(generarPdf([{ texto: largo }]))
    expect((txt.match(/\) Tj/g) ?? []).length).toBeGreaterThan(3)
  })

  it('parte una palabra más ancha que la página sin romperse', () => {
    const txt = comoTexto(generarPdf([{ texto: 'x'.repeat(600) }]))
    expect((txt.match(/\) Tj/g) ?? []).length).toBeGreaterThan(1)
  })

  it('pasa a una página nueva cuando se llena (y /Count lo refleja)', () => {
    const muchas = Array.from({ length: 200 }, (_, i) => ({ texto: `Renglón ${i}` }))
    const txt = comoTexto(generarPdf(muchas))
    const paginas = txt.match(/\/Type \/Page /g) ?? []
    expect(paginas.length).toBeGreaterThan(1)
    expect(txt).toContain(`/Count ${paginas.length}`)
  })

  it('un documento vacío sigue siendo un PDF válido de una página', () => {
    const txt = comoTexto(generarPdf([]))
    expect(txt).toContain('/Count 1')
    expect(txt.trimEnd().endsWith('%%EOF')).toBe(true)
  })
})
