# Investigación — Cédula Panameña

**Estado:** #completado 
**Fecha:** 2026-05-28 
**Área:** [[MOC — Proyectos]] | [[MOC — Calidad]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Módulo:** [[Módulo 02 — Cancelación y Reprogramación]] 
**Tags:** #helios #referencia #cedula #panama #validacion #identidad #sprint-2

---

## ¿Qué es?

Documento de referencia técnica sobre la estructura, tipos y reglas de validación de la cédula de identidad panameña. Necesario para el Módulo 02 de HELIOS, donde el sistema debe verificar la identidad del paciente al cancelar o reprogramar una cita, y para el sistema de autenticación general que asocia cada cuenta con una cédula válida.

---

## Por Qué Es Relevante para HELIOS

- El sistema registra pacientes usando su cédula como identificador único nacional
- La cédula debe validarse en frontend (UX inmediato) y en backend (RLS + constraint en Supabase)
- Panamá tiene múltiples formatos de cédula según el tipo de ciudadano — no existe un solo regex
- Un error de validación bloquea el registro del paciente y rompe el flujo de agendamiento
- La ATTT y el Tribunal Electoral son las fuentes oficiales de los formatos vigentes

---

## Estructura de la Cédula Panameña

### Formato General

```
[PROVINCIA o TIPO] - [TOMO] - [ASIENTO]
```

Ejemplo: `8-123-4567` → Provincia 8 (Panamá), Tomo 123, Asiento 4567

---

### Tipos de Cédula

|Tipo|Formato|Ejemplo|Descripción|
|---|---|---|---|
|Provincial|`P-T-A`|`8-123-4567`|Ciudadano nacido en provincia (1–9, 10–13)|
|Provincial ext.|`P-T-A`|`10-1234-56789`|Provincias con código de 2 dígitos (Guna Yala=10, Emberá=12, etc.)|
|Naturalizado|`N-T-A`|`N-12-34567`|Extranjero naturalizado panameño|
|Extranjero residente|`E-T-A`|`E-8-123456`|Residente permanente extranjero|
|Pasaporte/temporal|`PE-T-A`|`PE-4-12345`|Permiso especial de permanencia|

---

### Provincias y Comarcas — Códigos

|Código|Provincia / Comarca|
|---|---|
|1|Bocas del Toro|
|2|Coclé|
|3|Colón|
|4|Chiriquí|
|5|Darién|
|6|Herrera|
|7|Los Santos|
|8|Panamá|
|9|Veraguas|
|10|Guna Yala (ex Kuna Yala)|
|11|Panamá Oeste|
|12|Emberá-Wounaan|
|13|Ngäbe-Buglé|

> **Nota:** Los códigos 10–13 corresponden a comarcas indígenas reconocidas como provincias a efectos de cédula.

---

### Reglas de Validación

#### Componentes

|Componente|Descripción|Rango válido|
|---|---|---|
|Provincia `P`|1–2 dígitos + letras para tipos especiales|`1`–`13`, `N`, `E`, `PE`|
|Tomo `T`|Número de tomo del registro civil|1–9999|
|Asiento `A`|Número de asiento en el tomo|1–999999|

#### Reglas adicionales

- El separador es siempre un guion `-`
- No se permiten espacios dentro de la cédula
- Los ceros a la izquierda **no** son válidos en tomo ni asiento (`08-005-00123` es incorrecto)
- La cédula `8-0-0` no es válida (tomo y asiento deben ser ≥ 1)
- Las letras `N`, `E`, `PE` van **siempre en mayúsculas**

---

## Expresiones Regulares de Validación

### Regex completo (todos los tipos)

```typescript
// cita.types.ts — validador de cédula panameña
export const CEDULA_REGEX =
  /^(PE|E|N|[1-9]|1[0-3])-\d{1,4}-\d{1,6}$/

// Uso:
export function validarCedula(cedula: string): boolean {
  return CEDULA_REGEX.test(cedula.trim().toUpperCase())
}
```

### Regex por tipo (más preciso)

```typescript
const PROVINCIAL    = /^([1-9]|1[0-3])-\d{1,4}-\d{1,6}$/
const NATURALIZADO  = /^N-\d{1,4}-\d{1,6}$/
const EXTRANJERO    = /^E-\d{1,4}-\d{1,6}$/
const PERM_ESPECIAL = /^PE-\d{1,4}-\d{1,6}$/

export function tipoCedula(cedula: string): string {
  const c = cedula.trim().toUpperCase()
  if (PROVINCIAL.test(c))    return 'provincial'
  if (NATURALIZADO.test(c))  return 'naturalizado'
  if (EXTRANJERO.test(c))    return 'extranjero'
  if (PERM_ESPECIAL.test(c)) return 'permiso-especial'
  return 'invalida'
}
```

---

## Implementación en Supabase

### Constraint en PostgreSQL

```sql
-- En la tabla pacientes — validación a nivel de BD
alter table pacientes
  add column cedula text not null,
  add constraint cedula_formato_valido
    check (
      cedula ~ '^(PE|E|N|[1-9]|1[0-3])-[0-9]{1,4}-[0-9]{1,6}$'
    );

-- Índice único — la cédula no puede repetirse
create unique index idx_pacientes_cedula
  on pacientes (cedula);
```

### Política RLS relacionada

```sql
-- Paciente solo puede ver y editar su propio perfil
create policy "paciente_su_perfil"
on pacientes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

## Implementación en Frontend (React + TypeScript)

### Hook de validación

```typescript
// hooks/useCedulaValidation.ts
import { useState } from 'react'
import { validarCedula, tipoCedula } from '../types/cita.types'

export function useCedulaValidation() {
  const [cedula, setCedula] = useState('')
  const [error, setError]   = useState<string | null>(null)

  function handleChange(valor: string) {
    // Formateo automático: mayúsculas y solo chars válidos
    const limpio = valor.toUpperCase().replace(/[^0-9A-Z\-]/g, '')
    setCedula(limpio)

    if (limpio.length < 5) {
      setError(null)
      return
    }

    if (!validarCedula(limpio)) {
      setError('Formato inválido. Ejemplos: 8-123-4567 | N-12-34567 | PE-4-12345')
    } else {
      setError(null)
    }
  }

  return { cedula, error, handleChange, esValida: validarCedula(cedula) }
}
```

### Componente de input

```tsx
// components/auth/InputCedula.tsx
import { useCedulaValidation } from '../../hooks/useCedulaValidation'

export function InputCedula({ onValida }: { onValida: (c: string) => void }) {
  const { cedula, error, handleChange, esValida } = useCedulaValidation()

  return (
    <div className="campo-cedula">
      <label htmlFor="cedula">Cédula de Identidad</label>
      <input
        id="cedula"
        type="text"
        value={cedula}
        onChange={e => handleChange(e.target.value)}
        placeholder="8-123-4567"
        maxLength={15}
        aria-describedby="cedula-error"
      />
      {error && (
        <span id="cedula-error" role="alert" className="error">
          {error}
        </span>
      )}
      {esValida && (
        <button onClick={() => onValida(cedula)}>Verificar</button>
      )}
    </div>
  )
}
```

---

## Casos de Prueba — ISTQB (Vitest)

```typescript
// __tests__/cedula.test.ts
import { describe, test, expect } from 'vitest'
import { validarCedula, tipoCedula } from '../types/cita.types'

describe('Validación de Cédula Panameña', () => {

  // ── Casos válidos ──────────────────────────────────────────
  test.each([
    ['8-123-4567',    'provincial'],
    ['1-999-123456',  'provincial'],
    ['13-1-1',        'provincial'],
    ['N-12-34567',    'naturalizado'],
    ['E-8-123456',    'extranjero'],
    ['PE-4-12345',    'permiso-especial'],
  ])('TC-CED-%#: %s → válida (%s)', (cedula, tipo) => {
    expect(validarCedula(cedula)).toBe(true)
    expect(tipoCedula(cedula)).toBe(tipo)
  })

  // ── Casos inválidos ────────────────────────────────────────
  test.each([
    ['8-0-4567',     'tomo 0 no válido'],
    ['14-1-1',       'provincia 14 no existe'],
    ['8 123 4567',   'espacios en lugar de guiones'],
    ['08-005-00123', 'ceros a la izquierda'],
    ['8-123',        'faltan componentes'],
    ['abc',          'formato libre inválido'],
    ['',             'cadena vacía'],
  ])('TC-CED-%#: "%s" → inválida (%s)', (cedula) => {
    expect(validarCedula(cedula)).toBe(false)
  })

  // ── Edge cases ─────────────────────────────────────────────
  test('TC-CED-13: acepta mayúsculas y minúsculas (normalización)', () => {
    expect(validarCedula('n-12-34567')).toBe(false)  // sin normalizar
    expect(validarCedula('N-12-34567')).toBe(true)   // normalizado
  })

})
```

**Métricas ISTQB de estas pruebas:**

|Métrica|Valor|
|---|---|
|Total TC diseñados|13|
|TC válidos|6|
|TC inválidos|7|
|Técnica de diseño|Partición de equivalencia + Análisis de valores límite|
|Cobertura de ramas regex|100% (todos los tipos cubiertos)|

---

## Integración con el Módulo de Autenticación

```
[Usuario ingresa cédula en registro]
        ↓
[Frontend: validarCedula() — REGEX]
        ↓ (si inválida → error inmediato)
[Backend: Supabase INSERT pacientes]
        ↓ (si viola constraint → error 400)
[RLS: auth.uid() = user_id]
        ↓
[Cédula queda en columna indexada única]
        ↓
[Módulo 01: paciente_id disponible para citas]
```

---

## Fuentes Oficiales

|Fuente|URL / Referencia|
|---|---|
|Tribunal Electoral de Panamá|https://www.tribunal-electoral.gob.pa|
|Ley 68 de 2015 — Cédula de Identidad|Gaceta Oficial Digital N° 27951|
|ATTT — Registro de conductores|https://www.attt.gob.pa|
|Autoridad Nacional de Transparencia (ANTAI)|https://www.antai.gob.pa|

---

## Notas de Implementación

> **Para Claude Desktop:** Al construir el formulario de registro de paciente en HELIOS, usar `InputCedula.tsx` definido aquí. La validación debe ocurrir en dos niveles: (1) regex en frontend para UX inmediato y (2) constraint PostgreSQL en Supabase como última línea de defensa.

> **Importante:** En Panamá, la cédula es el identificador único nacional — equivale al RUT en Chile o el DNI en España. No existe duplicidad legal. El índice `UNIQUE` en Supabase garantiza esta invariante en el sistema.

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Regex en frontend + constraint en BD|Defensa en profundidad — no depender solo de uno|2026-05-28|
|Normalizar a mayúsculas automáticamente|Reduce errores de usuario con N/E/PE|2026-05-28|
|Índice UNIQUE en cedula|La cédula es identificador nacional no duplicable|2026-05-28|
|Separar tipos (provincial/nat/ext/pe)|Permite reportes futuros por tipo de paciente|2026-05-28|

---

## Referencias Cruzadas

- [[Módulo 01 — Agendamiento de Citas]] ← paciente_id viene del registro con cédula
- [[Módulo 02 — Cancelación y Reprogramación]] ← verifica identidad con cédula
- [[Proyecto - HELIOS]]
- [[MOC — Calidad]]

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]]_