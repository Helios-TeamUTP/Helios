import { describe, expect, it } from 'vitest'
import { avatarColor } from './avatarColor'

describe('avatarColor', () => {
  it('es determinista: el mismo nombre da siempre el mismo color', () => {
    expect(avatarColor('Juan Pérez')).toBe(avatarColor('Juan Pérez'))
  })

  it('valor conocido (Ana -> hash 436 -> indice 4)', () => {
    expect(avatarColor('Ana')).toBe('bg-amber-100 text-amber-700')
  })

  it('nombre vacío usa el primer color de la paleta', () => {
    expect(avatarColor('')).toBe('bg-violet-100 text-violet-700')
  })

  it('siempre devuelve una clase de la paleta, incluso con emoji', () => {
    for (const n of ['Dra. Ruiz', 'Zoë', '👩‍⚕️ Dra', 'X']) {
      expect(avatarColor(n)).toMatch(/^bg-\w+-100 text-\w+-700$/)
    }
  })

  it('nombres distintos pueden producir colores distintos', () => {
    const colores = new Set(['Ana', 'Luis', 'Marta', 'Pedro', 'Sofía', 'Carlos'].map(avatarColor))
    expect(colores.size).toBeGreaterThan(1)
  })
})
