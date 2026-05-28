# 📅 PLAN SPRINT 2 — HELIOS

> **Versión:** Propuesta inicial (pendiente validación con Jira real)
> **Periodo:** 2026-05-30 al 2026-06-12 (2 semanas)
> **Tema principal:** Cancelación, reprogramación de citas + notificaciones + hardening de producción
>
> ⚠️ **Nota:** Este plan se basa en lo que el CLAUDE.md menciona como "5 historias para Sprint 2" + "Cancelar/reprogramar en progreso". Cuando José confirme con captura de Jira, los IDs y títulos se ajustarán a los reales.

---

## 🎯 Objetivos del Sprint 2

1. **Permitir al paciente cancelar y reprogramar sus citas** (autoservicio)
2. **Notificar por email** confirmación de cita, cancelación y recordatorios
3. **Aumentar madurez del proceso** hacia TMMi nivel 3 (optimización con métricas)
4. **Reducir deuda técnica** identificada al cierre del Sprint 1
5. **Mantener estabilidad de producción** (cero regresiones del Sprint 1)

---

## 📋 Historias de Usuario propuestas

### US-06 — Cancelar cita (5 SP · Alta prioridad)

**Como** paciente,
**quiero** cancelar una cita que tengo agendada,
**para** liberar el horario si no podré asistir.

#### Criterios de aceptación

- [ ] En la página `/mis-citas`, cada cita confirmada tiene botón "Cancelar"
- [ ] Al hacer clic en "Cancelar", aparece modal de confirmación con detalle de la cita
- [ ] Si el paciente confirma, la cita cambia a estado `cancelada`
- [ ] El horario asociado vuelve a estar disponible (`disponible = true`)
- [ ] No se puede cancelar una cita ya pasada (fecha < hoy)
- [ ] No se puede cancelar con menos de 2 horas de anticipación
- [ ] El médico ve la cancelación en su dashboard en tiempo real

#### Subtareas técnicas

**Backend (Supabase):**
- [ ] Crear función RPC `cancelar_cita_atomica(cita_id, paciente_id)` que:
  - Valida que el paciente sea el dueño de la cita
  - Valida ventana de 2h
  - Actualiza `citas.estado = 'cancelada'`
  - Actualiza `horarios.disponible = true`
  - Todo en una transacción atómica
- [ ] Actualizar RLS de `citas` para permitir UPDATE solo del dueño + médico asignado
- [ ] Test SQL de la RPC en Supabase SQL Editor

**Frontend:**
- [ ] Componente `BotonCancelarCita.tsx` con modal de confirmación
- [ ] Hook `useCancelarCita.ts` que llama a la RPC
- [ ] Integrar en `pages/MisCitas.tsx`
- [ ] Mostrar estado visual de la cita cancelada (badge gris)
- [ ] Manejar error si ya pasó la cita o muy cerca

**Tests:**
- [ ] Test unitario de `useCancelarCita` (mockear Supabase)
- [ ] Test integración del componente con modal
- [ ] Test de la validación de 2h de anticipación
- [ ] Test de regresión: paciente NO puede cancelar cita ajena

**Documentación:**
- [ ] Actualizar `CLAUDE.md` con la nueva RPC
- [ ] Documentar el flujo en `PLAN_EJECUCION_SPRINT_0_Y_1.md`

---

### US-07 — Reprogramar cita (8 SP · Alta prioridad)

**Como** paciente,
**quiero** cambiar la fecha/hora de una cita ya agendada,
**para** ajustarla a mi disponibilidad sin tener que cancelar y volver a agendar.

#### Criterios de aceptación

- [ ] En `/mis-citas`, cada cita confirmada tiene botón "Reprogramar"
- [ ] Al hacer clic, se abre el wizard del calendario CON los mismos médico/especialidad/sede precargados
- [ ] Solo se muestran horarios disponibles del médico (excluyendo el horario actual)
- [ ] Al seleccionar nuevo slot y confirmar, la cita se actualiza atómicamente:
  - Horario viejo: `disponible = true`
  - Horario nuevo: `disponible = false`
  - Cita: `horario_id = nuevo_id`
- [ ] No se puede reprogramar con menos de 2 horas de anticipación
- [ ] Notifica al médico del cambio (preparar para US-08)

#### Subtareas técnicas

**Backend (Supabase):**
- [ ] Crear función RPC `reprogramar_cita_atomica(cita_id, nuevo_horario_id, paciente_id)` que:
  - Valida ownership y ventana de 2h
  - Libera horario viejo
  - Reserva horario nuevo (con check de disponibilidad)
  - Actualiza la cita
  - Todo atómico
- [ ] Test SQL de la RPC

**Frontend:**
- [ ] Modal/página de reprogramación que reutilice `CalendarioCitas`
- [ ] Hook `useReprogramarCita.ts`
- [ ] Pre-llenar contexto con datos de la cita actual
- [ ] Integrar en `pages/MisCitas.tsx`
- [ ] Confirmación visual con código de cita actualizado

**Tests:**
- [ ] Test unitario del hook
- [ ] Test del flujo completo (mock Supabase)
- [ ] Test de race condition (dos pacientes intentan el mismo slot)

---

### US-08 — Notificaciones por email (8 SP · Media prioridad)

**Como** paciente / médico,
**quiero** recibir notificaciones por email de mis citas,
**para** estar informado sin tener que entrar al sistema.

#### Criterios de aceptación

- [ ] Al **agendar** una cita, el paciente recibe email con: fecha, hora, médico, sede, código
- [ ] Al **cancelar** una cita, paciente y médico reciben email
- [ ] Al **reprogramar** una cita, ambos reciben email con datos viejos vs nuevos
- [ ] **Recordatorio automático** 24h antes de la cita (paciente)
- [ ] Templates en HTML con marca HELIOS (color teal #0A8478)
- [ ] Si el email falla, NO bloquea la operación principal (best-effort)

#### Subtareas técnicas

**Decisión de arquitectura:**
- [ ] Evaluar opciones: Supabase Edge Functions vs servicio externo (Resend, SendGrid)
- [ ] Recomendación inicial: **Resend** (gratuito hasta 3000 emails/mes, fácil setup)

**Backend (Supabase + Edge Functions o webhook):**
- [ ] Crear Edge Function `send_cita_email` que recibe `{ tipo, cita_id }` y manda email
- [ ] 4 templates HTML: confirmación, cancelación, reprogramación, recordatorio
- [ ] Trigger SQL en `citas` (INSERT/UPDATE) que invoca la Edge Function
- [ ] Cron job (Supabase pg_cron) para recordatorios 24h

**Frontend:**
- [ ] Mostrar mensaje "Te enviamos un correo de confirmación" tras agendar
- [ ] (Opcional) Botón "Reenviar email" en MisCitas

**Tests:**
- [ ] Mock de la Edge Function en tests de hooks
- [ ] Test de los 4 templates renderizados

**Configuración:**
- [ ] Variables de entorno en Supabase para Resend API key
- [ ] Documentar en `CLAUDE.md` la decisión de arquitectura

---

### US-09 — Historial de cambios por cita (3 SP · Media prioridad)

**Como** paciente / médico,
**quiero** ver el historial de cambios de una cita,
**para** auditar quién la cambió y cuándo.

#### Criterios de aceptación

- [ ] Cada cita tiene un historial visible: creación, cambios de estado, reprogramaciones
- [ ] Cada entrada del historial muestra: acción, fecha/hora, autor (paciente o médico)
- [ ] Accesible desde `/mis-citas` (paciente) y dashboard médico
- [ ] Solo visible para el paciente dueño y el médico asignado (RLS)

#### Subtareas técnicas

**Backend:**
- [ ] Crear tabla `citas_historial`:
  ```sql
  CREATE TABLE citas_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID REFERENCES citas(id),
    accion TEXT NOT NULL,  -- 'creada', 'cancelada', 'reprogramada', 'completada'
    actor_uid UUID,
    actor_rol TEXT,  -- 'paciente' o 'medico'
    detalle JSONB,   -- datos viejos vs nuevos
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] Triggers en `citas` que insertan automáticamente en `citas_historial`
- [ ] RLS de `citas_historial`: solo dueño + médico asignado

**Frontend:**
- [ ] Componente `HistorialCita.tsx` (accordion expandible)
- [ ] Hook `useHistorialCita.ts`
- [ ] Integrar en MisCitas y dashboard médico

**Tests:**
- [ ] Test del trigger SQL (insertar cita → verificar entry en historial)
- [ ] Test del componente con varias entradas

---

### US-10 — Confirmación email + MFA opcional (13 SP · Baja prioridad)

**Como** equipo,
**queremos** activar confirmación de email obligatoria y MFA opcional,
**para** acercar HELIOS a producción comercial real.

#### Criterios de aceptación

- [ ] Tras `signUp`, el usuario recibe email con link de confirmación
- [ ] El usuario NO puede iniciar sesión hasta confirmar el email
- [ ] Página `/verificar-email` que muestra "Revisa tu bandeja"
- [ ] Opción "Reenviar email" si no llegó
- [ ] Settings del usuario para activar MFA con app autenticadora (TOTP)
- [ ] Login MFA: tras password correcto, pedir código TOTP

#### Subtareas técnicas

**Backend (Supabase):**
- [ ] Activar `Confirm email` en Supabase Auth settings
- [ ] Configurar SMTP propio (no usar el de Supabase que es limitado)
- [ ] Templates de Supabase Auth en español con marca HELIOS
- [ ] Habilitar MFA en Supabase Auth settings

**Frontend:**
- [ ] Página `/verificar-email`
- [ ] Manejar caso "email no confirmado" en login con mensaje claro
- [ ] Page `/configuracion` con sección MFA (enrollar/desenrollar)
- [ ] Modal MFA en login si está activo

**Tests:**
- [ ] Mock de Supabase Auth para los flujos nuevos

**Documentación:**
- [ ] Guía de usuario para confirmar email
- [ ] Guía de usuario para activar MFA

**⚠️ NOTA:** Esta historia tiene 13 SP por su impacto en flujos. Puede dividirse en US-10a (email confirmation) y US-10b (MFA) si conviene.

---

## 🛠️ Tareas técnicas no funcionales (Deuda Técnica)

### TD-01 — Monitoreo de errores en producción (3 SP)

- [ ] Integrar Sentry (free tier: 5,000 eventos/mes)
- [ ] Capturar errores no manejados en frontend
- [ ] Capturar console.errors del catch
- [ ] Alertas a email del equipo

### TD-02 — Logging estructurado (2 SP)

- [ ] Reemplazar `console.error` por logger estructurado
- [ ] Logs con contexto (user_id, accion, timestamp)
- [ ] Enviar a Supabase logs o servicio externo

### TD-03 — Pruebas E2E con Playwright (5 SP)

- [ ] Configurar Playwright en el repo
- [ ] 3 tests E2E críticos:
  1. Registro nuevo paciente → agendar cita → ver en MisCitas
  2. Médico ve agenda → marca cita completada → aparece en historial
  3. Cancelar cita → horario vuelve a disponible
- [ ] Correr en CI antes de cada deploy

### TD-04 — Locust a 500 usuarios (2 SP)

- [ ] Ajustar `locustfile.py` para 500 usuarios
- [ ] Medir P95 con esa carga
- [ ] Identificar cuellos de botella (queries lentas, RLS, etc.)
- [ ] Documentar resultados

### TD-05 — Documentar RPCs en SQL (1 SP)

- [ ] Agregar comentarios COMMENT ON FUNCTION para cada RPC
- [ ] Documentar parámetros, retornos, casos de error
- [ ] Generar dump del schema con comentarios

---

## 📊 Distribución de Story Points

| Categoría | SP | % del Sprint |
|---|---|---|
| Historias funcionales (US-06 a US-10) | 37 | 75% |
| Deuda técnica (TD-01 a TD-05) | 13 | 25% |
| **TOTAL** | **50 SP** | 100% |

**Capacidad estimada del equipo:** 50 SP / 2 semanas (similar al Sprint 1).

---

## 🗓️ Cronograma sugerido

### Semana 1 (mayo 30 - junio 5)

| Día | Tarea principal |
|---|---|
| Lun | Planning Sprint 2 + setup ramas |
| Mar | US-06 (cancelar cita) backend + frontend |
| Mié | US-06 tests + code review + deploy |
| Jue | US-07 (reprogramar) backend |
| Vie | US-07 frontend + tests |

### Semana 2 (junio 6 - junio 12)

| Día | Tarea principal |
|---|---|
| Lun | US-07 deploy + US-08 (emails) arranque |
| Mar | US-08 templates + Edge Function |
| Mié | US-09 (historial) backend + frontend |
| Jue | TD-01 (Sentry) + TD-04 (Locust 500) |
| Vie | Demo + retrospectiva Sprint 2 |

**Nota:** US-10 (email confirmation + MFA) queda como opcional/stretch goal. Solo si quedan SP libres.

---

## 🚦 Criterios de "Done" del Sprint 2

Cada historia se considera completada cuando:

1. ✅ Código mergeado a `main` (o branch del Sprint 2)
2. ✅ Tests unitarios + integración pasando
3. ✅ Code review aprobado por al menos un integrante
4. ✅ Deploy a producción exitoso (HTTP 200 verificado)
5. ✅ PO valida funcionalidad en producción real
6. ✅ Documentación actualizada (CLAUDE.md, PLAN_EJECUCION)
7. ✅ Issue de Jira movida a "Done"

---

## ⚠️ Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| SMTP de Supabase muy limitado para emails | Usar Resend desde el inicio |
| Race conditions en reprogramación | Validar con tests de carga (TD-04) |
| Sentry consume cuota free rápido | Filtrar errores conocidos, alertas solo críticas |
| MFA muy complejo para tiempo de Sprint | Marcar US-10 como stretch goal, no comprometerse |
| Cancelaciones masivas afectan calendario | Implementar caché client-side de horarios |

---

## 📝 Preguntas pendientes para José (PO)

1. **¿Tenemos presupuesto para servicios?** (Resend free + Sentry free son gratis, pero validar)
2. **¿Email confirmation se hace en Sprint 2 o Sprint 3?** (impacta UX significativamente)
3. **¿MFA es realmente prioridad académica?** (no aporta a métricas, sí a "producción real")
4. **¿La profesora pide cosas específicas para Sprint 2?** (revisar rúbrica)

---

## 📦 Entregables al final del Sprint 2

1. App con cancelación + reprogramación + notificaciones en producción
2. Tablero Kanban actualizado (cero issues Sprint 2 en To Do, todas Done o In Progress)
3. Métricas actualizadas con datos del Sprint 2
4. Demo en vivo del flujo completo
5. Retrospectiva documentada

---

## 🔄 Próximos pasos inmediatos (esta semana)

1. **José revisa este plan** y lo compara con Jira real
2. **José manda captura de Jira** Sprint 2 para refinar IDs y títulos
3. **Equipo discute en daily** prioridades y asignaciones
4. **Marian crea las ramas** `sprint2/us-06-cancelar`, etc.
5. **Empezamos por US-06** (cancelar) por ser la más simple y de alta prioridad

---

_Documento generado al inicio del Sprint 2, 2026-05-28. Pendiente validación con Jira._
