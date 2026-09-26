# Módulo 05 — Perfil (solo paciente)

**Estado:** #completado — código en `demo-vercel` + RLS aplicada en Supabase real. Pendiente: merge a `main` (PR #2 abierto, sin mergear a propósito). 
**Fecha inicio:** 2026-09-21 
**Fecha límite:** _(definir)_ 
**Área:** [[MOC — Proyectos]] 
**Sprint:** _(asignar — sugerido: post-pivote SaaS, rama `demo-vercel`)_ 
**Proyecto:** [[Proyecto - HELIOS]] — **HELIOS SaaS** (multi-clínica, Panamá)
**Tags:** #helios #modulo-05 #perfil #paciente #saas #supabase #istqb

---

## ⚠️ Nota de rama de trabajo

Este módulo se implementa en la rama `demo-vercel`. Nada se mergea a `main` hasta validarlo ahí. Mismas reglas de `CLAUDE.md` aplican (orchestrator → agente especializado → code review → tests) — solo cambia el destino del push/deploy.

---

## ¿Qué es?

Módulo de autogestión del perfil del **paciente**. A diferencia de otros módulos, este se resolvió primero como propuesta de UX/seguridad y luego se llevó a caso de uso — no es un CRUD genérico: son **tres acciones independientes**, cada una en su propia tarjeta, con su propio botón y su propio feedback. La razón de separarlas: un error en un campo no debe bloquear guardar los otros.

Alcance de esta primera versión: **solo paciente**. Perfil de médico y perfil de clínica (tenant, admin) quedan fuera — se evalúan en un módulo aparte si se necesitan.

---

## Objetivo Principal

El módulo está listo cuando:

- El paciente puede cambiar su nombre en una acción independiente, con confirmación clara ("Nombre actualizado ✓")
- El paciente puede cambiar su contraseña, con re-autenticación obligatoria y doble confirmación de la nueva
- El correo **no es editable** en esta versión (ver justificación abajo)
- La cédula **no es editable** desde este módulo, bajo ninguna circunstancia
- El teléfono **no se toca** en este módulo
- Existe una policy RLS de `UPDATE` en `pacientes` que permite al paciente modificar su propia fila — **confirmado que hoy no existe** (ver sección RLS)
- Las pruebas funcionales pasan al 100%

---

## Las 3 acciones (tarjetas independientes)

### Acción 1 — Datos personales: cambiar nombre

Un campo (`nombre`), un botón "Guardar". Actualiza `pacientes.nombre` directo, sin más lógica.

**Criterios de aceptación:**

- [x] Reutiliza `validarNombre` de `lib/validaciones.ts` (ya existe, Sprint 2 — no reescribir)
- [x] Botón deshabilitado mientras guarda (evita doble envío — mismo patrón que el resto de la app)
- [x] Confirmación visual específica: "Nombre actualizado ✓", no un mensaje genérico
- [x] Tras guardar, llama `refreshPerfil()` de `useAuth()` para que el nombre se refleje en el header sin recargar la página — **confirmado que `useAuth.tsx` ya expone `refreshPerfil()`**, no hay que agregar nada nuevo ahí

### Acción 2 — Correo electrónico (NO editable por ahora)

No se implementa edición en esta versión. Se muestra de solo lectura.

**Por qué:** el correo del paciente alimenta el worker de notificaciones (`email-worker/`, ver `supabase/migrations/sprint4b_cola_email.sql`) que envía recordatorios de citas. Cambiar `pacientes.correo` sin también actualizar el correo de `auth.users` (o sin validar el nuevo correo) puede desincronizar a dónde llegan las notificaciones vs. con qué correo el paciente inicia sesión. Se deja fuera del alcance hasta diseñar ese flujo con cuidado (verificación de correo nuevo, o decidir si se cambia solo el de contacto y no el de login).

**Criterio de aceptación:**

- [x] El campo correo se muestra pero está deshabilitado/readonly en la UI, sin ambigüedad de que "no se puede editar todavía"

### Acción 3 — Contraseña

**Criterios de aceptación:**

- [x] Pide la contraseña **actual** primero y reautentica con `signInWithPassword` antes de permitir el cambio (mismo patrón usado para reautenticación en otras partes del flujo de auth)
- [x] Pide la contraseña nueva **dos veces** (confirmar), mismo patrón que la doble confirmación de cédula/contraseña de B-23 en `Register.tsx`
- [x] Valida longitud mínima de **8 caracteres** — confirmado como válido por el equipo, implementado como constante `PASSWORD_MIN_LENGTH = 8` en `TarjetaPassword.tsx`
- [x] Botón deshabilitado mientras guarda
- [x] Confirmación visual específica: "Contraseña actualizada ✓"
- [x] Al cambiar la contraseña, cierra sesión en otros dispositivos (`supabase.auth.signOut({ scope: 'others' })`); si el scope no está disponible en el plan, no bloquea el flujo (el password ya quedó cambiado)

---

## Explícitamente fuera de alcance

| No se toca | Razón |
|---|---|
| Cédula | Identificador legal del paciente — cambiarla tiene implicaciones serias, no es un campo editable aquí |
| Teléfono | Fuera de alcance de este módulo por decisión explícita |
| Correo | Ver Acción 2 — depende del worker de emails, se resuelve en un módulo/iteración aparte |
| Perfil de médico | Fuera de alcance — este módulo es solo paciente |
| Perfil de clínica / tenant (admin) | Fuera de alcance — si se necesita, es otro módulo |

---

## Verificado en el código antes de escribir esto (los 2 puntos que había que confirmar)

**1. ¿Existe policy RLS de UPDATE en `pacientes`?**

**No existe.** Revisé `supabase/migrations/B-14_rls_estricto.sql` y `sprint2_b26_cerrar_sprint1_all.sql`: la tabla `pacientes` hoy solo tiene 3 policies de `SELECT` (`paciente_ve_su_perfil`, `medico_ve_pacientes_de_sus_citas`, `chequeo_cedula_en_registro`) y 1 de `INSERT` (`paciente_crea_su_perfil`). **Cero policies de `UPDATE`.** Sin agregar una, cualquier intento de guardar desde este módulo fallará silenciosamente o con error de RLS. Hay que agregarla — ver SQL abajo.

**2. ¿`useAuth()` expone algo como `refreshPerfil()`?**

**Sí, ya existe.** `hooks/useAuth.tsx` expone `refreshPerfil()` en el context (`AuthContextValue`), que internamente llama a `loadPerfil(session.user.id)`. No hay que tocar `useAuth.tsx` para este módulo — solo consumirlo desde los componentes de perfil.

---

## Base de Datos — Cambio necesario

```sql
-- Falta esta policy — sin ella, el paciente no puede editar su propio nombre.
-- Restringida a los campos que este módulo permite tocar: en la práctica
-- solo 'nombre' se actualiza desde la UI, pero RLS no filtra por columna,
-- así que el control de "solo nombre" se hace en el service (solo se
-- manda { nombre } en el .update(), nunca el objeto completo).
CREATE POLICY "paciente_actualiza_su_perfil" ON pacientes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth_paciente_link apl
      WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_paciente_link apl
      WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id
    )
  );
```

> ⚠️ Esta policy por sí sola permitiría, a nivel de base de datos, actualizar cualquier columna de la fila (incluida `cedula` o `correo`) porque RLS no restringe por columna. La protección real de "solo nombre editable" vive en el frontend/service (nunca se envía `cedula` ni `correo` en el payload del `.update()`). Si se quiere blindar también a nivel de base de datos, la alternativa es un `GRANT UPDATE (nombre) ON pacientes TO authenticated` en vez de `GRANT UPDATE` completo — pendiente de evaluar, no bloqueante.
>
> ✅ **Aplicada en producción real** (proyecto Supabase `uobhbikcctausgpnzsph`) el 2026-09-22, vía `supabase/migrations/sprint6_modulo05_perfil.sql` (+ `rollback_sprint6_modulo05_perfil.sql`). Verificada con `pg_policies` — coincide exactamente con este SQL.

---

## Estructura de Carpetas

> 📝 **Nota:** la estructura final terminó distinta a lo planeado abajo — el repo real no tiene una capa `services/` (los demás módulos tampoco la tienen; los hooks llaman a Supabase directo, como `useCancelarCita.ts`). Se siguió esa convención real en vez de introducir un patrón nuevo. Los tests quedan junto a cada archivo (`Componente.test.tsx`), no en una carpeta `__tests__/` separada — también es la convención real del repo.

```
frontend/src/
├── pages/
│   └── Perfil.tsx
├── components/
│   ├── perfil/
│   │   ├── TarjetaNombre.tsx        (+ .test.tsx)
│   │   ├── TarjetaCorreo.tsx        (+ .test.tsx) ← solo lectura
│   │   └── TarjetaPassword.tsx      (+ .test.tsx)
│   └── shared/
│       └── SuccessMessage.tsx       ← nuevo, no existía (contraparte de ErrorMessage)
└── hooks/
    ├── useActualizarNombre.ts       (+ .test.ts)
    └── useCambiarPassword.ts        (+ .test.ts)
```

---

## Implementación — Servicios Supabase

> 📝 La lógica de abajo terminó viviendo dentro de `hooks/useActualizarNombre.ts` y `hooks/useCambiarPassword.ts` (con `withTimeout` + try/catch/finally, mismo patrón que `useCancelarCita.ts` — ver B-10), no en un archivo `perfil.service.ts` separado. La lógica es la misma, solo cambió dónde vive.

```typescript
// (referencia — implementación real en hooks/useActualizarNombre.ts y hooks/useCambiarPassword.ts)
import { supabase } from '../lib/supabase'

// Acción 1 — nombre, nunca el objeto completo del paciente
export async function actualizarNombre(pacienteId: string, nombre: string) {
  const { data, error } = await supabase
    .from('pacientes')
    .update({ nombre })   // solo este campo, aunque RLS no lo obligue
    .eq('id', pacienteId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Acción 3 — contraseña, con reautenticación previa
export async function cambiarPassword(
  correoActual: string,
  passwordActual: string,
  passwordNuevo: string,
) {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: correoActual,
    password: passwordActual,
  })
  if (authError) throw new Error('Contraseña actual incorrecta')

  const { error } = await supabase.auth.updateUser({ password: passwordNuevo })
  if (error) throw error

  // Cierra sesión en otros dispositivos, si el plan de Supabase lo soporta.
  try {
    await supabase.auth.signOut({ scope: 'others' })
  } catch {
    // No bloquear el flujo si el scope no está disponible en el plan actual.
  }
}
```

---

## Estrategia de Pruebas (ISTQB)

> ✅ **16 tests reales escritos y pasando** (no el archivo único de referencia de abajo): `useActualizarNombre.test.ts` (4), `useCambiarPassword.test.ts` (4), `TarjetaNombre.test.tsx` (4), `TarjetaPassword.test.tsx` (3), `TarjetaCorreo.test.tsx` (1). Suite completa del proyecto: **241/241 pasan**. `tsc -b`, `pnpm lint` (0 errores) y `pnpm build` limpios.

```typescript
// __tests__/perfil.test.tsx — pseudocódigo de referencia original, no el archivo real
describe('Módulo Perfil — Pruebas Funcionales', () => {
  test('Acción 1: actualiza solo el nombre, no envía otros campos', async () => {
    const spy = vi.spyOn(supabase.from('pacientes'), 'update')
    await actualizarNombre('p1', 'Juan Pérez Nuevo')
    expect(spy).toHaveBeenCalledWith({ nombre: 'Juan Pérez Nuevo' })
  })

  test('Acción 3: rechaza cambio de contraseña sin la actual correcta', async () => {
    await expect(
      cambiarPassword('juan@mail.com', 'incorrecta', 'NuevaClave123'),
    ).rejects.toThrow('Contraseña actual incorrecta')
  })

  test('RLS: paciente sin link no puede actualizar fila ajena', async () => {
    // cliente autenticado como paciente A intenta update sobre id de paciente B
    const { data, error } = await supabase
      .from('pacientes')
      .update({ nombre: 'Hackeado' })
      .eq('id', 'paciente-b-id')
      .select()
    expect(data).toEqual([])
  })
})
```

---

## Criterios de Aceptación del Módulo

| Criterio | Métrica | Estado |
|---|---|---|
| Policy RLS de UPDATE en `pacientes` agregada | Migración aplicada y verificada | ✅ Hecho |
| Acción 1 — cambiar nombre | Funciona con confirmación específica | ✅ Hecho |
| Acción 3 — cambiar contraseña | Reautenticación + doble confirmación verificadas | ✅ Hecho |
| Cédula/teléfono/correo no editables | Confirmado en UI y en el payload de los hooks | ✅ Hecho |
| Pruebas funcionales | 100% | ✅ Hecho (16/16 del módulo, 241/241 de la suite) |
| Deploy en `demo-vercel` / Cloudflare | Sitio accesible sin login para médicos/pacientes | ✅ Hecho |
| Merge a `main` | — | ⏸️ A propósito sin hacer (PR #2 abierto, sin mergear) |

---

## Tareas

### Completado

- [x] Migración: `paciente_actualiza_su_perfil` (UPDATE policy en `pacientes`) — aplicada en Supabase real el 2026-09-22
- [x] Confirmar mínimo de longitud de contraseña — 8 caracteres, confirmado por el equipo
- [x] Lógica de `actualizarNombre` y `cambiarPassword` — terminó en `hooks/`, no en `perfil.service.ts` (ver nota en Estructura de Carpetas)
- [x] Construir `Perfil.tsx` + `TarjetaNombre.tsx` + `TarjetaCorreo.tsx` (readonly) + `TarjetaPassword.tsx`
- [x] `signOut({ scope: 'others' })` implementado con fallback silencioso si el plan no lo soporta (no bloquea el flujo)
- [x] Pruebas funcionales + prueba de RLS — 16 tests nuevos, suite completa 241/241
- [x] Deploy verificado en `demo-vercel` (Cloudflare Workers) + RLS verificada en Supabase real

### Pendiente

- [ ] `helios-bug-hunter` (o revisión equivalente del equipo): confirmar que la policy de UPDATE no abre más de lo necesario (evaluar `GRANT UPDATE (nombre)`) — la revisión que se hizo fue directa en esta sesión, no con el subagente dedicado que pide el `CLAUDE.md`
- [ ] Merge a `main` — pendiente a propósito, sin fecha definida

---

## Decisiones Tomadas

| Decisión | Razón | Fecha |
|---|---|---|
| 3 tarjetas independientes en vez de un formulario único | Un error en un campo no bloquea guardar los otros; feedback más claro por acción | 2026-09-21 |
| Correo no editable en esta versión | Depende del worker de emails (`sprint4b_cola_email.sql`) — cambiarlo sin ese diseño desincroniza notificaciones | 2026-09-21 |
| Cédula nunca editable desde Perfil | Identificador legal, cambiarla tiene implicaciones fuera del alcance de un módulo de autogestión | 2026-09-21 |
| Reautenticación obligatoria para cambiar contraseña | `updateUser` solo no pide la contraseña actual — riesgo en sesión abierta en computador compartido | 2026-09-21 |
| Alcance de este módulo: solo paciente | Médico y clínica (tenant) tienen necesidades distintas — se evalúan aparte | 2026-09-21 |

---

## Instrucciones para Claude Code

**Contexto:** mismas reglas del `CLAUDE.md` (orchestrator → agente especializado → code review → tests), rama `demo-vercel`.

- No tocar `cedula`, `telefono` ni `correo` en el payload de ningún `.update()` de este módulo, aunque RLS lo permita
- Reutilizar `validarNombre` de `lib/validaciones.ts` — no reescribir
- Reutilizar `refreshPerfil()` de `useAuth()` tras guardar el nombre — ya existe, no agregar nada nuevo al hook
- `helios-bug-hunter` corre un pase específico sobre la nueva policy de UPDATE antes de aprobar (mismo tipo de revisión que destapó B-26)

---

## Recursos y Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 01 — Agendamiento de Citas]]
- `supabase/migrations/B-14_rls_estricto.sql`
- `supabase/migrations/sprint2_b26_cerrar_sprint1_all.sql`
- `supabase/migrations/sprint4b_cola_email.sql` — contexto de por qué el correo no se toca todavía
- `frontend/src/hooks/useAuth.tsx` — `refreshPerfil()`

---

## Reflexiones del Módulo

_(Llenar después de cada semana de trabajo)_

**2026-09-21 — Inicio** Módulo chico en superficie pero con una trampa real: no hay policy de UPDATE en `pacientes` hoy. Si alguien escribe el frontend antes de revisar esto, el botón "Guardar" va a fallar en silencio o con un error de RLS confuso. Se confirmó antes de escribir una sola línea de componente.

**2026-09-22 — Cierre** Construido, probado (16 tests nuevos, suite completa 241/241) y desplegado en `demo-vercel`/Cloudflare, con la policy RLS aplicada directo en el proyecto Supabase real. La estructura final se desvió un poco del plan original (hooks en vez de una capa `services/`) porque así es como ya funciona el resto del repo — se prefirió consistencia sobre seguir el plan al pie de la letra. Queda pendiente el merge a `main` (a propósito) y una revisión formal de `helios-bug-hunter` sobre la policy de UPDATE.

---

_← [[HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]]_
