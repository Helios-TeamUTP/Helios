# Casos de Prueba — Regresión Bugs Sprint 1 y 2

**Estado:** #activo
**Fecha:** 2026-06-10
**Proyecto:** [[Proyecto - HELIOS]]
**Referencia:** [[Reporte de Bugs — Sprint 1 y 2]]
**Tags:** #helios #istqb #test-cases #regresion #qa #parcial-2

---

## Propósito

Casos de prueba diseñados para verificar que los bugs documentados en [[Reporte de Bugs — Sprint 1 y 2]] estén corregidos, y para prevenir regresiones en sprints futuros. Cada TC mapea directamente a un bug.

**Técnicas ISTQB aplicadas:** Partición de equivalencia · Análisis de valores límite · Transición de estados · Cobertura de requisitos

---

## TC-REG-01 — Validación de cédula rechaza formatos inválidos

**Bug referenciado:** [[Reporte de Bugs — Sprint 1 y 2#BUG-01 — Validador de cédula acepta valores inválidos|BUG-01]]
**Archivo bajo prueba:** `frontend/src/lib/cedula.ts` → `isValidCedulaPanama()`
**Técnica:** Partición de equivalencia + Análisis de valores límite
**Tipo:** Unitaria (Vitest)

### Particiones de equivalencia

| Clase | Descripción | Ejemplo |
|-------|-------------|---------|
| Válida provincial | Provincia 1-9, tomo y asiento correctos | `8-123-4567` |
| Válida comarca | Provincia 10-13 | `10-1-12345` |
| Válida naturalizado | Prefijo N | `N-12-34567` |
| Válida extranjero | Prefijo E | `E-8-123456` |
| Válida PE | Prefijo PE | `PE-4-12345` |
| Inválida — solo dígitos | Sin guiones ni estructura | `12345` |
| Inválida — provincia 0 | Provincia fuera de rango | `0-1-1` |
| Inválida — provincia 14 | Provincia no existe | `14-1-1` |
| Inválida — vacía | String vacío | `""` |
| Inválida — espacios | Espacios en lugar de guiones | `8 123 4567` |

### Casos de prueba

```typescript
// __tests__/cedula.test.ts
import { describe, test, expect } from 'vitest'
import { isValidCedulaPanama } from '../lib/cedula'

describe('TC-REG-01: isValidCedulaPanama — casos válidos', () => {
  test.each([
    ['8-123-4567',   'provincial estándar'],
    ['1-999-123456', 'provincia 1 con asiento máximo'],
    ['9-1-1',        'valores mínimos válidos'],
    ['13-1-1',       'comarca Ngäbe-Buglé (código máximo)'],
    ['N-12-34567',   'naturalizado'],
    ['E-8-123456',   'extranjero residente'],
    ['PE-4-12345',   'permiso especial'],
  ])('acepta "%s" (%s)', (cedula) => {
    expect(isValidCedulaPanama(cedula)).toBe(true)
  })
})

describe('TC-REG-01: isValidCedulaPanama — casos inválidos', () => {
  test.each([
    ['12345',         'solo dígitos sin estructura — BUG-01 original'],
    ['00000',         'ceros sin guiones'],
    ['14-1-1',        'provincia 14 no existe'],
    ['0-1-1',         'provincia 0 no existe'],
    ['8 123 4567',    'espacios en lugar de guiones'],
    ['8-0-4567',      'tomo cero'],
    ['',              'cadena vacía'],
    ['abc',           'texto libre'],
    ['999999999999',  '12 dígitos sin formato — BUG-01 original'],
  ])('rechaza "%s" (%s)', (cedula) => {
    expect(isValidCedulaPanama(cedula)).toBe(false)
  })
})
```

### Criterio de aceptación

- Todos los casos de clase inválida retornan `false`
- Todos los casos de clase válida retornan `true`
- El caso `"12345"` específicamente retorna `false` (regresión de BUG-01)

---

## TC-REG-02 — Registro no deja cuentas auth huérfanas

**Bug referenciado:** [[Reporte de Bugs — Sprint 1 y 2#BUG-02 — Race condition en registro — cuenta auth huérfana|BUG-02]]
**Archivo bajo prueba:** `frontend/src/pages/Register.tsx`
**Técnica:** Prueba de condición de carrera / Prueba de error
**Tipo:** Integración (Vitest + Supabase test env)

### Pasos para reproducir y verificar corrección

```typescript
// __tests__/register.test.tsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

describe('TC-REG-02: registro — manejo de fallo en paso de paciente', () => {

  test('si INSERT pacientes falla, no queda usuario en auth.users', async () => {
    // Arrange: simular que INSERT en pacientes falla
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-uid-123', email: 'test@test.com' } },
      error: null,
    })
    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    })
    // Mock supabase...

    // Act: intentar registrar con cédula que ya existe
    // Assert: el usuario NO debe quedar en auth sin paciente
    // Verificar que se llamó a signOut o deleteUser después del fallo
    expect(mockSignUp).not.toHaveBeenCalled()
    // O si se llamó, verificar rollback:
    // expect(mockSignOut).toHaveBeenCalled()
  })

  test('si el email ya existe en auth, muestra error claro sin crear nada', async () => {
    // Verificar que el sistema detecta el email duplicado ANTES de intentar signUp
    // o que maneja el error de auth sin dejar estado inconsistente
  })

})
```

### Verificación manual (hasta tener test automatizado)

**Pasos:**
1. Completar un registro exitoso con `test1@helios.com` y cédula `8-100-1000`
2. Abrir una ventana nueva de incógnito
3. Intentar registrarse con el mismo email `test1@helios.com` pero cédula diferente `8-100-1001`
4. El sistema debe mostrar error antes de crear cualquier registro en auth
5. Verificar en Supabase Dashboard → Authentication que NO hay un segundo usuario huérfano

**Criterio de aceptación:** Ningún email queda bloqueado en Supabase Auth sin tener una fila correspondiente en `auth_paciente_link`.

---

## TC-REG-03 — Usuario sin perfil es redirigido automáticamente

**Bug referenciado:** [[Reporte de Bugs — Sprint 1 y 2#BUG-03 — ProtectedRoute no valida perfil de paciente completo|BUG-03]]
**Archivo bajo prueba:** `frontend/src/components/auth/ProtectedRoute.tsx`
**Técnica:** Prueba de transición de estados
**Tipo:** Integración (Vitest + RTL)

### Diagrama de estados

```
[Sin sesión] → /login → [Con sesión, sin paciente] → /registro → [Completo] → /agendar
                                    ↓ NO debe pasar ProtectedRoute
                              [/mis-citas bloqueada]
```

### Casos de prueba

```typescript
// __tests__/protectedRoute.test.tsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

describe('TC-REG-03: ProtectedRoute', () => {

  test('usuario sin sesión es redirigido a /login', () => {
    // Mock useAuth: user=null, paciente=null, loading=false
    // Navegar a /mis-citas
    // Expect: redirige a /login
  })

  test('usuario con auth pero SIN paciente es redirigido a /registro', () => {
    // Mock useAuth: user={ id: 'uid' }, paciente=null, loading=false
    // Navegar a /mis-citas
    // Expect: redirige a /registro — NO muestra contenido de MisCitas
    // Este es el caso de BUG-03
  })

  test('usuario completo (auth + paciente) accede a ruta protegida', () => {
    // Mock useAuth: user={ id: 'uid' }, paciente={ id: 'pid', nombre: 'Test' }
    // Navegar a /mis-citas
    // Expect: muestra contenido de MisCitas sin redirigir
  })

  test('MisCitas redirige automáticamente si paciente es null', () => {
    // Verificar que /mis-citas hace <Navigate> y no solo muestra texto estático
    // Expect: el componente retorna un Navigate, no un div con "Necesitas registrarte"
  })

})
```

**Criterio de aceptación:** Un usuario con `user !== null` y `paciente === null` que navega a `/mis-citas` es redirigido automáticamente a `/registro` sin necesidad de hacer clic en ningún enlace.

---

## TC-REG-04 — Horarios pasados del día no aparecen disponibles

**Bug referenciado:** [[Reporte de Bugs — Sprint 1 y 2#BUG-04 — Horarios pasados del día actual son visibles y seleccionables|BUG-04]]
**Archivo bajo prueba:** `frontend/src/hooks/useHorarios.ts`
**Técnica:** Análisis de valores límite (límite temporal)
**Tipo:** Unitaria + Integración

### Valores límite críticos

| Caso | Horario | Hora actual | Debe aparecer |
|------|---------|-------------|---------------|
| Límite exacto | Hoy 14:00 | 14:00 | ❌ No (es el momento exacto) |
| 1 minuto antes | Hoy 14:00 | 13:59 | ✅ Sí |
| 1 minuto después | Hoy 14:00 | 14:01 | ❌ No |
| Ayer | Ayer 10:00 | Cualquiera | ❌ No |
| Mañana | Mañana 09:00 | Cualquiera | ✅ Sí |

### Casos de prueba

```typescript
// __tests__/useHorarios.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHorarios } from '../hooks/useHorarios'

describe('TC-REG-04: useHorarios — filtro temporal', () => {

  beforeEach(() => {
    // Fijar la hora actual a las 14:00 del 2026-06-10
    vi.setSystemTime(new Date('2026-06-10T14:00:00'))
  })

  test('no muestra horario de hoy a las 13:00 si son las 14:00', async () => {
    // Mock supabase con horario: fecha=2026-06-10, hora_inicio=13:00
    // Expect: el horario NO aparece en data
  })

  test('sí muestra horario de hoy a las 15:00 si son las 14:00', async () => {
    // Mock supabase con horario: fecha=2026-06-10, hora_inicio=15:00
    // Expect: el horario SÍ aparece en data
  })

  test('la RPC crear_cita_atomica rechaza horario en el pasado', async () => {
    // Llamar supabase.rpc('crear_cita_atomica') con horario_id de un slot pasado
    // Expect: error con mensaje 'No se puede agendar en un horario pasado'
  })

})
```

**Criterio de aceptación:** Si son las 14:00, ningún horario del mismo día con `hora_inicio <= 14:00` aparece en el calendario de selección.

---

## TC-REG-05 — MisCitas se actualiza en tiempo real

**Bug referenciado:** [[Reporte de Bugs — Sprint 1 y 2#BUG-05 — MisCitas no tiene Realtime — la agenda no se actualiza|BUG-05]]
**Archivo bajo prueba:** `frontend/src/hooks/useCitas.ts`
**Técnica:** Cobertura de requisitos
**Tipo:** Integración

### Casos de prueba

```typescript
// __tests__/useCitas.test.ts
import { describe, test, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

describe('TC-REG-05: useCitas — suscripción Realtime', () => {

  test('el hook suscribe un canal de Realtime al montar', async () => {
    const mockChannel = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
    // Verificar que supabase.channel() fue llamado con el pacienteId
    expect(mockChannel).toHaveBeenCalledWith(`citas-paciente-${pacienteId}`)
  })

  test('el hook desuscribe el canal al desmontar (no memory leak)', async () => {
    const mockRemoveChannel = vi.fn()
    // Renderizar y desmontar el hook
    const { unmount } = renderHook(() => useCitas('paciente-123'))
    unmount()
    // Verificar que se llamó removeChannel
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  test('cuando llega un evento postgres_changes, se hace refetch', async () => {
    // Simular que Supabase emite un evento INSERT en tabla citas
    // Verificar que data se actualiza sin recargar la página
  })

})
```

### Verificación manual

**Pasos:**
1. Autenticarse y abrir `/mis-citas` en la pestaña A
2. Agendar una nueva cita en la pestaña B (mismo usuario)
3. Volver a la pestaña A
4. **Sin recargar**, verificar que la nueva cita aparece en menos de 5 segundos

**Criterio de aceptación:** La lista de citas en `/mis-citas` refleja cambios en la tabla `citas` en menos de 5 segundos sin intervención del usuario.

---

## Resumen de Cobertura

| TC | Bug | Tipo | Automatizable | Estado |
|----|-----|------|---------------|--------|
| TC-REG-01 | BUG-01 cédula | Unitaria | ✅ Inmediato | Pendiente |
| TC-REG-02 | BUG-02 huérfana | Integración | ⚠️ Requiere mock auth | Pendiente |
| TC-REG-03 | BUG-03 guard | Integración | ✅ Con RTL | Pendiente |
| TC-REG-04 | BUG-04 horarios | Unitaria + Integración | ✅ Con vi.setSystemTime | Pendiente |
| TC-REG-05 | BUG-05 realtime | Integración | ✅ Con mock Supabase | Pendiente |

### Métricas objetivo post-corrección

| Métrica | Valor actual | Objetivo |
|---------|-------------|---------|
| TC de regresión automatizados | 0 | 5 |
| Cobertura de los 5 bugs | 0% | 100% |
| Tiempo de detección de regresión | Manual | < 2 min (CI) |

---

## Referencias

- [[Reporte de Bugs — Sprint 1 y 2]] — descripción completa de cada bug
- [[Referencias ISTQB]] — técnicas de diseño aplicadas
- [[Módulo 01 — Agendamiento de Citas]] — HU afectadas

---

_← [[Reporte de Bugs — Sprint 1 y 2]] | [[Proyecto - HELIOS]] | [[Referencias ISTQB]]_
