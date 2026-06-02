# 📅 PLAN SPRINT 2 — HELIOS

> **Estado:** Alineado con Jira (issue **HELL-3**)
> **Periodo:** 2026-05-30 al 2026-06-12 (2 semanas)
> **Tema:** Bugs urgentes (calendario + validaciones) → Cancelación/Reprogramación → Testing
> **Story Points:** 23 SP (10 bugs/testing + 13 cancelar/reprogramar)

---

## 🔥 PARTE A — Bugs urgentes (YA IMPLEMENTADOS Y EN TESTS ✅)

Detectados por el PO en producción tras la demo. Se priorizaron antes de las features.

| ID | Bug | Estado | Subtarea Jira |
|---|---|---|---|
| B-21 | Calendario desktop desfasaba la hora (timezone). Fix: vista de botones timezone-safe en todos los tamaños; se quitó FullCalendar (bundle 754→496 KB) | ✅ Hecho + tests | ST-10 (3 SP) |
| B-22 | Validador de cédula rechazaba cédulas válidas cortas. Fix: 5 tipos panameños (natural/PE/N/E/PI) + ejemplos + detección de tipo | ✅ Hecho + tests | ST-11 (3 SP) |
| B-23 | Sin doble confirmación. Fix: confirmar cédula + confirmar contraseña deben coincidir | ✅ Hecho + tests | ST-12 (2 SP) |
| B-24 | Sin validación de datos. Fix: `validarTelefonoPanama`/`validarNombre`/`validarEmail` | ✅ Hecho + tests | ST-13 (2 SP) |

**Tests:** 100/100 pasando. **Bundle:** 496 KB (bajó de 754).

## 🛡️ PARTE B — Testing seguridad/rendimiento (pendiente de correr)

> ⚠️ `zapitmedical.com` NO es herramienta de testing (es compliance radiológico). Se usa **OWASP ZAP** (seguridad) + **Lighthouse** (rendimiento). Guía completa en `dailys/Entrega_Viernes/DOCUMENTACION_SPRINT2.pdf`.

| ID | Tarea | SP |
|---|---|---|
| ST-14 | OWASP ZAP baseline scan contra producción + documentar hallazgos | 3 |
| ST-15 | Lighthouse (Core Web Vitals) + documentar | 2 |

---

## PARTE C — Cancelación y Reprogramación (features ya planeadas)

> **Story Points:** 13 SP (5 cancelar + 8 reprogramar)

---

## 🎯 Objetivo del Sprint 2

Permitir al paciente **cancelar y reprogramar sus citas de forma autoservicio**, sin necesidad de contactar al centro médico. Liberar horarios automáticamente para que estén disponibles a otros pacientes.

---

## 📋 Issue principal en Jira

**HELL-3:** "Sprint 2 — Cancelación y Re-programación"
🔗 https://helios-group.atlassian.net/browse/HELL-3

**Subtareas:** 9 subtasks listadas abajo (a crear en Jira).

---

## ✅ Alcance del Sprint 2

1. **Cancelar cita confirmada** (paciente, autoservicio)
2. **Reprogramar cita confirmada** a otro horario disponible (paciente)
3. **Actualizar dashboard del médico** en tiempo real con cambios
4. **Mantener historial de cambios por cita** (auditoría — tabla + triggers, sin UI)

### ❌ Fuera de alcance (Sprint 3)

- Notificaciones por email/SMS al cancelar/reprogramar
- Mostrar el historial de cambios en la UI
- Cancelación con motivo (texto libre)
- Cancelación masiva por médico (emergencias)
- MFA y email confirmation
- Monitoreo con Sentry

Ver propuesta completa de Sprint 3 en [`PLAN_SPRINT_3.md`](./PLAN_SPRINT_3.md).

---

## 📋 Criterios de aceptación generales (de HELL-3)

- [ ] Solo el paciente dueño puede cancelar/reprogramar sus citas (validado por RLS)
- [ ] No se puede cancelar/reprogramar con menos de 2 horas de anticipación
- [ ] Al cancelar, el horario vuelve a estar disponible automáticamente
- [ ] Al reprogramar, el horario viejo se libera y el nuevo se reserva (atómico)
- [ ] El médico ve los cambios en su dashboard sin recargar
- [ ] Cada cambio queda registrado en tabla `citas_historial`
- [ ] Cero regresiones del Sprint 1 (los 65 tests deben seguir pasando)
- [ ] Cobertura de tests se mantiene ≥ 60%

---

## 🛠️ Las 9 Subtareas (a crear en Jira bajo HELL-3)

### ST-1 · Crear función SQL `cancelar_cita_atomica` (Backend)

**Asignado:** Alejandro (Tech Lead)
**Story Points:** 2

Función PostgreSQL que cancela una cita atómicamente:

1. Valida ownership (auth.uid() = paciente dueño)
2. Valida estado "confirmada" (no ya cancelada)
3. Valida ventana de 2 horas
4. UPDATE `citas.estado = 'cancelada'` + `cancelado_at = now()`
5. UPDATE `horarios.disponible = true`
6. Todo en transacción única

**Retorna:** `{ success: boolean, error_code: string }`

**Tests SQL:**
- Cancelar cita propia OK
- Cancelar cita ajena → `error_code='unauthorized'`
- Cancelar con < 2h → `error_code='too_late'`
- Cancelar ya cancelada → `error_code='already_cancelled'`

---

### ST-2 · Crear función SQL `reprogramar_cita_atomica` (Backend)

**Asignado:** Alejandro (Tech Lead)
**Story Points:** 3

Función PostgreSQL que reprograma una cita:

**Parámetros:** `cita_id`, `nuevo_horario_id`

1. Validar ownership y ventana de 2h
2. Validar que `nuevo_horario_id` pertenezca al MISMO médico
3. Validar que el nuevo horario esté disponible
4. Liberar horario viejo (`disponible=true`)
5. Reservar horario nuevo (`disponible=false`)
6. Actualizar `citas.horario_id`
7. Insertar entrada en `citas_historial`
8. Atómico

**Retorna:** `{ success: boolean, error_code: string, nueva_cita: cita }`

---

### ST-3 · Crear tabla `citas_historial` + triggers (Backend)

**Asignado:** Alejandro (Tech Lead)
**Story Points:** 2

```sql
CREATE TABLE citas_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,
  accion TEXT CHECK (accion IN ('creada','cancelada','reprogramada','completada')),
  actor_uid UUID,
  actor_rol TEXT CHECK (actor_rol IN ('paciente','medico')),
  detalle JSONB,  -- datos viejos vs nuevos
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_citas_historial_cita ON citas_historial(cita_id);
```

**RLS:**
- SELECT: solo paciente dueño + médico asignado
- INSERT: solo desde triggers/RPCs

**Trigger en `citas` (AFTER UPDATE):** inserta automáticamente en historial.

---

### ST-4 · Hook `useCancelarCita` (Frontend)

**Asignado:** Ethan (Dev Frontend)
**Story Points:** 1

`frontend/src/hooks/useCancelarCita.ts`:

- Recibe `cita_id`
- Llama RPC vía `supabase.rpc('cancelar_cita_atomica', ...)`
- Manejo de errores con `setError` visible (patrón B-20.3)
- Estado `loading`
- `onSuccess` callback

**Tests:**
- Mock de `supabase.rpc` → verificar parámetros
- Errores `too_late`, `unauthorized` → mensajes claros
- `onSuccess` se llama tras éxito

---

### ST-5 · Componente `BotonCancelarCita` + modal (Frontend)

**Asignado:** Ethan (Dev Frontend)
**Story Points:** 1

`frontend/src/components/citas/BotonCancelarCita.tsx`:

- Botón rojo "Cancelar" visible solo si la cita es cancelable
- Modal de confirmación con detalle de la cita y advertencia
- Botones "Cancelar acción" / "Sí, cancelar cita"
- Usa `useCancelarCita`
- Tras éxito: cierra modal + actualiza lista
- Tras error: banner rojo con mensaje real

---

### ST-6 · Hook `useReprogramarCita` + página `ReprogramarCita` (Frontend)

**Asignado:** Ethan (Dev Frontend)
**Story Points:** 3

Hook similar a `useCancelarCita`.

Página `frontend/src/pages/ReprogramarCita.tsx`:
- Reutiliza `CalendarioCitas`
- Pre-carga médico, sede, especialidad de la cita actual
- Excluye el slot actual de los disponibles
- Al confirmar nuevo slot: llama hook
- Tras éxito: redirect a `/mis-citas` con mensaje verde
- Errores visibles (patrón B-20.3)

---

### ST-7 · Actualizar `MisCitas` con botones (Frontend)

**Asignado:** Ethan (Dev Frontend)
**Story Points:** 1

Modificar `frontend/src/pages/MisCitas.tsx`:

- Cada cita muestra:
  - Datos (ya existe)
  - Botón "Cancelar" si cancelable
  - Botón "Reprogramar" (link) si reprogramable
  - Badge "Cancelada" / "Completada" según estado
- Pestañas: "Próximas" / "Pasadas" / "Canceladas"

---

### ST-8 · Actualizar dashboard médico (Frontend)

**Asignado:** Ethan + Ashley (QA validación)
**Story Points:** 1

Modificar `frontend/src/pages/MedicoDashboard.tsx`:

- Citas canceladas aparecen en pestaña Historial (badge gris)
- Filtrar agenda de "Hoy" para excluir canceladas
- Auto-refresh cada 60 segundos (o Supabase Realtime)
- Toast notification si una cita se cancela mientras el médico la ve

---

### ST-9 · Tests E2E + smoke post-deploy (QA + DevOps)

**Asignado:** Ashley (QA) + Marian (DevOps)
**Story Points:** -

1. **Test manual E2E:**
   - Crear paciente → agendar → cancelar → verificar horario libre
   - Re-agendar misma cita
   - Reprogramar → verificar swap correcto
   - Login médico → verificar cambios

2. **Smoke automatizado post-deploy:** `curl HTTP 200`

3. **Verificar regresión:** 65 tests Sprint 1 siguen pasando

4. **Locust:** subir a 300 usuarios y medir P95

---

## 📊 Distribución de Story Points

| Subtarea | SP | Responsable |
|---|---|---|
| ST-1 cancelar_cita_atomica | 2 | Alejandro |
| ST-2 reprogramar_cita_atomica | 3 | Alejandro |
| ST-3 citas_historial + triggers | 2 | Alejandro |
| ST-4 useCancelarCita hook | 1 | Ethan |
| ST-5 BotonCancelarCita componente | 1 | Ethan |
| ST-6 useReprogramarCita + página | 3 | Ethan |
| ST-7 MisCitas actualizada | 1 | Ethan |
| ST-8 Dashboard médico | 1 | Ethan + Ashley |
| ST-9 QA + smoke | - | Ashley + Marian |
| **TOTAL** | **14 SP** | |

---

## 🗓️ Cronograma sugerido (1.5 semanas)

### Semana 1 (mayo 30 - junio 5)

| Día | Tarea principal | Quién |
|---|---|---|
| Lun | Planning + setup branch `sprint2/bootstrap` | Marian |
| Mar | ST-1 + ST-3 (backend cancelar + historial) | Alejandro |
| Mié | ST-2 (backend reprogramar) | Alejandro |
| Jue | ST-4 + ST-5 (hook + componente cancelar) | Ethan |
| Vie | ST-6 (hook + página reprogramar) | Ethan |

### Semana 2 (junio 6 - junio 12)

| Día | Tarea principal | Quién |
|---|---|---|
| Lun | ST-7 + ST-8 (MisCitas + dashboard médico) | Ethan + Ashley |
| Mar | ST-9 tests E2E + smoke post-deploy | Ashley + Marian |
| Mié | Deploy producción + validación PO | Marian + José |
| Jue | Buffer (bugs encontrados, ajustes) | Equipo |
| Vie | Demo Sprint 2 + retrospectiva | Todos |

---

## 🚦 Criterios de "Done"

Cada subtarea se considera completada cuando:

1. ✅ Código mergeado a `sprint2/bootstrap`
2. ✅ Tests unitarios + integración pasando
3. ✅ Code review aprobado por al menos un integrante
4. ✅ Deploy a producción exitoso (HTTP 200 verificado)
5. ✅ PO (José) valida funcionalidad en producción real
6. ✅ Documentación actualizada (CLAUDE.md, PLAN_EJECUCION)
7. ✅ Subtarea de Jira movida a "Done"

---

## ⚠️ Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Race condition: dos pacientes reservan el mismo horario liberado | Función SQL atómica con SELECT FOR UPDATE |
| Pacientes reprograman muchas veces para "bloquear" horarios | Considerar límite (ej: máximo 2 reprogramaciones por cita) — discutir con PO |
| El médico ve datos viejos por caché del frontend | Auto-refresh cada 60s o usar Supabase Realtime |
| RLS rechaza UPDATE por bug en política | Tests SQL exhaustivos antes de deploy |
| Regresión en flow Sprint 1 (registro, agendamiento) | ST-9 verifica los 65 tests del Sprint 1 |

---

## 📝 Preguntas pendientes para José (PO)

1. **¿Límite de reprogramaciones por cita?** (sugiero máximo 2, así no se abusa)
2. **¿Ventana de 2 horas es correcta?** o prefieren 4h / 24h?
3. **¿Quieren botón "Cancelar" también para el médico?** (no está en alcance pero es razonable)
4. **¿Quieren ya pensar en notificaciones email?** o lo dejamos firme para Sprint 3?

---

## 📦 Entregables al final del Sprint 2

1. App con cancelación + reprogramación en producción
2. Tablero Jira HELL-3 con 9 subtareas en Done
3. Métricas actualizadas (cobertura, bugs, latencia)
4. Demo en vivo del flujo: agendar → cancelar → reprogramar
5. Retrospectiva documentada

---

## 🔄 Próximos pasos inmediatos

1. **José llena la descripción de HELL-3** con el texto provisto en chat
2. **José/Marian crean las 9 subtareas** en Jira con los títulos y descripciones
3. **Marian crea la branch** `sprint2/bootstrap` desde `sprint1/bootstrap`
4. **Equipo empieza por ST-1, ST-2, ST-3** (backend, son bloqueantes)
5. **Frontend (ST-4 a ST-8)** arranca cuando ST-1 y ST-2 estén deployados

---

_Documento alineado con Jira HELL-3, 2026-05-28._
