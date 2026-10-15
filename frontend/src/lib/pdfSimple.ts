/**
 * Generador mínimo de PDF de solo texto (sin dependencias).
 *
 * Por qué existe: el historial clínico se descarga como PDF, pero agregar una
 * librería (jsPDF, pdf-lib…) mete código y dependencias transitivas al
 * lockfile, y el proyecto ya tuvo el Quality Gate bloqueado por vulnerabilidades
 * de dependencias (B-28). Para un documento de texto con títulos y párrafos
 * alcanza con las fuentes estándar del PDF (Helvetica), que no se incrustan.
 *
 * Alcance: A4, texto con 4 estilos, ajuste de línea, salto de página. No
 * soporta imágenes ni tablas. Los caracteres fuera de Latin-1 se sustituyen
 * (ver `aLatin1`), así que los acentos y la ñ del español salen bien.
 */

export type EstiloPdf = 'titulo' | 'subtitulo' | 'normal' | 'pequeno'

export interface LineaPdf {
  /** Puede traer saltos de línea (\n): cada uno inicia un renglón nuevo. */
  texto: string
  estilo?: EstiloPdf
  /** Espacio extra (en puntos) ANTES de esta línea. */
  separacion?: number
}

const ANCHO = 595.28
const ALTO = 841.89
const MARGEN = 50

const ESTILOS: Record<EstiloPdf, { fuente: 'F1' | 'F2'; tam: number; interlineado: number }> = {
  titulo: { fuente: 'F2', tam: 16, interlineado: 22 },
  subtitulo: { fuente: 'F2', tam: 12, interlineado: 17 },
  normal: { fuente: 'F1', tam: 10, interlineado: 14 },
  pequeno: { fuente: 'F1', tam: 8, interlineado: 11 },
}

/** Sustituciones para caracteres que Latin-1 no tiene. */
const SUSTITUCIONES: Record<string, string> = {
  '–': '-',
  '—': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  '•': '*',
}

/**
 * Convierte a Latin-1 (1 carácter = 1 byte), que coincide con WinAnsiEncoding
 * para á é í ó ú ñ ü ¿ ¡ etc. Lo que no existe se reemplaza por "?".
 */
export function aLatin1(texto: string): string {
  let salida = ''
  for (const ch of texto.normalize('NFC')) {
    // Saltos de línea: se conservan (los usa `envolver`); \r se ignora y \t se vuelve espacio.
    if (ch === '\n') {
      salida += ch
      continue
    }
    if (ch === '\r') continue
    if (ch === '\t') {
      salida += ' '
      continue
    }
    const sustituto = SUSTITUCIONES[ch]
    if (sustituto !== undefined) {
      salida += sustituto
      continue
    }
    const code = ch.codePointAt(0) ?? 63
    // 0x80-0x9F son controles en Latin-1 (no son los mismos glifos en WinAnsi).
    salida += code >= 32 && code <= 255 && !(code >= 0x7f && code <= 0x9f) ? ch : '?'
  }
  return salida
}

function escaparPdf(texto: string): string {
  return texto.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

/** Ancho aproximado de un carácter de Helvetica, en unidades de 1 em. */
function anchoCaracter(ch: string): number {
  if ('iljt.,;:\'!|() '.includes(ch)) return 0.3
  if ('fIr[]-"'.includes(ch)) return 0.37
  if ('mwMW@%'.includes(ch)) return 0.8
  if (ch >= 'A' && ch <= 'Z') return 0.68
  return 0.54
}

function anchoTexto(texto: string, tam: number, negrita: boolean): number {
  let em = 0
  for (const ch of texto) em += anchoCaracter(ch)
  return em * tam * (negrita ? 1.06 : 1)
}

/** Ajuste de línea voraz por palabras; parte palabras más anchas que la línea. */
function envolver(texto: string, tam: number, negrita: boolean): string[] {
  const maxAncho = ANCHO - 2 * MARGEN
  const lineas: string[] = []
  for (const parrafo of texto.split('\n')) {
    let actual = ''
    for (const palabra of parrafo.split(' ')) {
      const candidata = actual ? `${actual} ${palabra}` : palabra
      if (anchoTexto(candidata, tam, negrita) <= maxAncho) {
        actual = candidata
        continue
      }
      if (actual) lineas.push(actual)
      // palabra sin espacios más ancha que la línea: se corta por caracteres
      let trozo = ''
      for (const ch of palabra) {
        if (anchoTexto(trozo + ch, tam, negrita) > maxAncho) {
          lineas.push(trozo)
          trozo = ''
        }
        trozo += ch
      }
      actual = trozo
    }
    lineas.push(actual)
  }
  return lineas
}

/** Genera el PDF. Devuelve los bytes listos para guardar como `application/pdf`. */
export function generarPdf(lineas: LineaPdf[]): Uint8Array<ArrayBuffer> {
  // ── 1) maquetar: una lista de operaciones de contenido por página ──
  const paginas: string[][] = [[]]
  let y = ALTO - MARGEN
  for (const linea of lineas) {
    const estilo = ESTILOS[linea.estilo ?? 'normal']
    const negrita = estilo.fuente === 'F2'
    y -= linea.separacion ?? 0
    for (const renglon of envolver(aLatin1(linea.texto), estilo.tam, negrita)) {
      if (y - estilo.interlineado < MARGEN) {
        paginas.push([])
        y = ALTO - MARGEN
      }
      y -= estilo.interlineado
      if (renglon) {
        paginas[paginas.length - 1].push(
          `BT /${estilo.fuente} ${estilo.tam} Tf 1 0 0 1 ${MARGEN} ${y.toFixed(2)} Tm (${escaparPdf(renglon)}) Tj ET`,
        )
      }
    }
  }

  // ── 2) objetos del PDF ──
  // 1 catálogo · 2 páginas · 3 Helvetica · 4 Helvetica-Bold · luego (página, contenido) por cada página
  const objetos: string[] = []
  const idPagina = (i: number) => 5 + 2 * i
  objetos.push('<< /Type /Catalog /Pages 2 0 R >>')
  objetos.push(
    `<< /Type /Pages /Kids [${paginas.map((_, i) => `${idPagina(i)} 0 R`).join(' ')}] /Count ${paginas.length} >>`,
  )
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  paginas.forEach((ops, i) => {
    const flujo = ops.join('\n')
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idPagina(i) + 1} 0 R >>`,
    )
    objetos.push(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`)
  })

  // ── 3) ensamblar con tabla xref (todo es Latin-1: 1 carácter = 1 byte) ──
  let doc = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n'
  const offsets: number[] = []
  objetos.forEach((cuerpo, i) => {
    offsets.push(doc.length)
    doc += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`
  })
  const inicioXref = doc.length
  doc += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) doc += `${String(off).padStart(10, '0')} 00000 n \n`
  doc += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`

  const bytes = new Uint8Array(doc.length)
  for (let i = 0; i < doc.length; i++) bytes[i] = doc.charCodeAt(i) & 0xff
  return bytes
}
