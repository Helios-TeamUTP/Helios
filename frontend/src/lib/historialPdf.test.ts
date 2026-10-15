import { describe, it, expect } from 'vitest'
import {
  construirPdfHistorial,
  formatearFecha,
  nombreArchivoHistorial,
  ordenarEntradas,
  type EntradaHistorial,
} from './historialPdf'

/** Texto del PDF ya decodificado (Latin-1) y con los escapes de paréntesis deshechos. */
function textoPdf(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes).replace(/\\([()\\])/g, '$1')
}

const AHORA = new Date(2026, 9, 15, 14, 5) // 15/10/2026 14:05 (hora local)

const paciente = {
  nombre: 'Juan Pérez',
  cedula: '8-123-4567',
  telefono: '6000-1234',
  correo: 'juan@example.com',
  fecha_nacimiento: '1990-05-10',
}

const entrada = (over: Partial<EntradaHistorial> = {}): EntradaHistorial => ({
  fecha: '2026-08-24',
  hora: '09:00:00',
  medico: 'Dra. García',
  especialidad: 'Cardiología',
  sede: 'Policlínica Central',
  dolencia: 'Gripe estacional',
  receta: 'Paracetamol 500 mg',
  notaPaciente: null,
  ...over,
})

describe('formatearFecha', () => {
  it('YYYY-MM-DD → DD/MM/YYYY sin pasar por Date (sin desfase de zona horaria)', () => {
    expect(formatearFecha('2026-08-24')).toBe('24/08/2026')
    expect(formatearFecha('2026-01-01')).toBe('01/01/2026')
  })
  it('valores vacíos o inválidos → guion', () => {
    expect(formatearFecha(null)).toBe('—')
    expect(formatearFecha('')).toBe('—')
    expect(formatearFecha('no-es-fecha')).toBe('—')
  })
})

describe('nombreArchivoHistorial', () => {
  it('quita acentos y caracteres raros, y agrega la fecha local', () => {
    expect(nombreArchivoHistorial('José Núñez', AHORA)).toBe(
      'historial-clinico-jose-nunez-2026-10-15.pdf',
    )
    expect(nombreArchivoHistorial('  Ana  María / López ', AHORA)).toBe(
      'historial-clinico-ana-maria-lopez-2026-10-15.pdf',
    )
  })
  it('nombre vacío → "paciente"', () => {
    expect(nombreArchivoHistorial('???', AHORA)).toBe('historial-clinico-paciente-2026-10-15.pdf')
  })
})

describe('ordenarEntradas', () => {
  it('más reciente primero (fecha y hora) y las entradas sin fecha al final', () => {
    const orden = ordenarEntradas([
      entrada({ dolencia: 'vieja', fecha: '2026-01-10', hora: '08:00:00' }),
      entrada({ dolencia: 'sin fecha', fecha: null }),
      entrada({ dolencia: 'nueva tarde', fecha: '2026-09-01', hora: '15:00:00' }),
      entrada({ dolencia: 'nueva mañana', fecha: '2026-09-01', hora: '09:00:00' }),
    ]).map((e) => e.dolencia)
    expect(orden).toEqual(['nueva tarde', 'nueva mañana', 'vieja', 'sin fecha'])
  })
  it('no modifica el arreglo original', () => {
    const original = [entrada({ fecha: '2026-01-01' }), entrada({ fecha: '2026-02-01' })]
    ordenarEntradas(original)
    expect(original[0].fecha).toBe('2026-01-01')
  })
})

describe('construirPdfHistorial — modo médico', () => {
  const pdf = (entradas: EntradaHistorial[], generadoPor: string | null = 'Dra. García') =>
    textoPdf(construirPdfHistorial({ paciente, entradas, modo: 'medico', generadoPor, ahora: AHORA }))

  it('incluye datos de contacto, fecha formateada, sede, dolencia y receta', () => {
    const t = pdf([entrada()])
    expect(t).toContain('HELIOS - Historial clínico')
    expect(t).toContain('Generado el 15/10/2026 14:05')
    expect(t).toContain('Nombre: Juan Pérez')
    expect(t).toContain('Cédula: 8-123-4567')
    expect(t).toContain('Fecha de nacimiento: 10/05/1990')
    expect(t).toContain('Teléfono: 6000-1234')
    expect(t).toContain('Correo: juan@example.com')
    expect(t).toContain('24/08/2026 · 09:00')
    expect(t).toContain('Sede: Policlínica Central')
    expect(t).toContain('Dolencia principal: Gripe estacional')
    expect(t).toContain('Receta: Paracetamol 500 mg')
  })

  it('aclara que solo incluye lo registrado por ese médico y que no lleva notas privadas', () => {
    const t = pdf([entrada()])
    expect(t).toContain('1 en total. Incluye únicamente las atenciones registradas por Dra. García.')
    expect(t).toContain('No incluye las notas privadas del médico ni del paciente.')
  })

  it('PRIVACIDAD (CA-03-05): aunque llegue la nota del paciente, NO sale en el PDF del médico', () => {
    const t = pdf([entrada({ notaPaciente: 'MI NOTA SECRETA DE PACIENTE' })])
    expect(t).not.toContain('MI NOTA SECRETA DE PACIENTE')
    expect(t).not.toContain('Mi nota')
  })

  it('receta vacía o solo espacios → "Sin receta"', () => {
    expect(pdf([entrada({ receta: null })])).toContain('Receta: Sin receta')
    expect(pdf([entrada({ receta: '   ' })])).toContain('Receta: Sin receta')
  })

  it('contacto faltante → "No registrado"', () => {
    const t = textoPdf(
      construirPdfHistorial({
        paciente: { ...paciente, telefono: null, correo: null, fecha_nacimiento: null },
        entradas: [entrada()],
        modo: 'medico',
        ahora: AHORA,
      }),
    )
    expect(t).toContain('Teléfono: No registrado')
    expect(t).toContain('Correo: No registrado')
    expect(t).not.toContain('Fecha de nacimiento')
    expect(t).toContain('el médico que genera este documento')
  })

  it('con muchas atenciones genera varias páginas y sigue siendo un PDF válido', () => {
    const muchas = Array.from({ length: 40 }, (_, i) =>
      entrada({ dolencia: `Dolencia número ${i}`, fecha: `2026-07-${String((i % 28) + 1).padStart(2, '0')}` }),
    )
    const bytes = construirPdfHistorial({ paciente, entradas: muchas, modo: 'medico', ahora: AHORA })
    const t = new TextDecoder('latin1').decode(bytes)
    expect((t.match(/\/Type \/Page /g) ?? []).length).toBeGreaterThan(1)
    expect(t.trimEnd().endsWith('%%EOF')).toBe(true)
  })
})

describe('construirPdfHistorial — modo paciente', () => {
  const pdf = (entradas: EntradaHistorial[]) =>
    textoPdf(construirPdfHistorial({ paciente, entradas, modo: 'paciente', ahora: AHORA }))

  it('muestra el médico con su especialidad y la sede, y la nota del propio paciente (CA-04-02)', () => {
    const t = pdf([entrada({ notaPaciente: 'Me dolía la garganta' })])
    expect(t).toContain('Dra. García (Cardiología) - Policlínica Central')
    expect(t).toContain('Mi nota (privada): Me dolía la garganta')
    expect(t).toContain('Incluye las atenciones registradas por todos tus médicos en HELIOS.')
  })

  it('sin nota del paciente no inventa la línea', () => {
    expect(pdf([entrada({ notaPaciente: null })])).not.toContain('Mi nota')
  })

  it('no repite los datos de contacto del paciente (él ya los conoce)', () => {
    const t = pdf([entrada()])
    expect(t).not.toContain('Teléfono:')
    expect(t).not.toContain('Correo:')
  })

  it('médico desconocido → texto neutro', () => {
    expect(pdf([entrada({ medico: null, especialidad: null, sede: null })])).toContain(
      'Médico no disponible',
    )
  })
})
