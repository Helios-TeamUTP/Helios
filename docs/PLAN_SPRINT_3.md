# 📅 PLAN SPRINT 3 — HELIOS (propuesta futura)

> **Estado:** PROPUESTA — Sin confirmar con Jira
> **Periodo estimado:** Por confirmar (junio 2026)
> **Tema principal:** Notificaciones + Historial UI + Hardening de producción

⚠️ Este documento es una **propuesta** de lo que tiene sentido hacer en el Sprint 3 una vez cerrado el Sprint 2 (cancelar + reprogramar). Discutir con el equipo y el PO antes de comprometerse.

---

## 🎯 Objetivos del Sprint 3 (propuestos)

1. **Notificar por email** confirmaciones, cancelaciones, reprogramaciones y recordatorios
2. **Mostrar el historial de cambios** en la UI (tabla `citas_historial` ya creada en Sprint 2)
3. **Hardening de producción**: monitoreo de errores, logging estructurado, pruebas E2E
4. **Aumentar madurez del proceso** hacia TMMi nivel 3 (optimización con métricas estadísticas)
5. **Acercar HELIOS a producción comercial real** (email confirmation, MFA opcional)

---

## 📋 Historias de Usuario propuestas

### US-08 — Notificaciones por email (8 SP · Alta prioridad)

**Como** paciente / médico,
**quiero** recibir notificaciones por email de mis citas,
**para** estar informado sin tener que entrar al sistema.

#### Criterios de aceptación

- [ ] Al **agendar** cita: paciente recibe email con fecha, hora, médico, sede, código
- [ ] Al **cancelar** cita: paciente y médico reciben email
- [ ] Al **reprogramar** cita: ambos reciben email con datos viejos vs nuevos
- [ ] **Recordatorio automático 24h antes** de la cita (paciente)
- [ ] Templates HTML con marca HELIOS (teal #0A8478)
- [ ] Si email falla, NO bloquea operación principal (best-effort)

#### Subtareas técnicas

**Decisión de arquitectura:**
- Evaluar Resend (3000 emails/mes free) vs SendGrid vs Supabase Edge Functions
- Recomendación inicial: **Resend** por simplicidad de setup

**Backend (Supabase + Edge Functions):**
- Crear Edge Function `send_cita_email({ tipo, cita_id })`
- 4 templates HTML: confirmación, cancelación, reprogramación, recordatorio
- Trigger SQL en `citas` (INSERT/UPDATE) que invoca la Edge Function
- Cron job (Supabase pg_cron) para recordatorios 24h antes

**Frontend:**
- Mostrar mensaje "Te enviamos un correo de confirmación" tras agendar
- (Opcional) Botón "Reenviar email" en MisCitas

**Configuración:**
- Variables de entorno Supabase para Resend API key
- Documentar arquitectura en CLAUDE.md

---

### US-09 — Mostrar historial de cambios en UI (3 SP · Media prioridad)

**Como** paciente / médico,
**quiero** ver el historial de cambios de una cita,
**para** auditar quién la cambió y cuándo.

**Nota:** La tabla `citas_historial` y los triggers se crearon en Sprint 2 (ST-3). Esta US es solo el frontend para mostrarlos.

#### Criterios de aceptación

- [ ] En MisCitas y dashboard médico, cada cita tiene un icono "Ver historial"
- [ ] Al hacer click se expande accordion con todas las entradas
- [ ] Cada entrada muestra: acción, fecha/hora, autor (paciente o médico)
- [ ] Solo visible para el paciente dueño y el médico asignado

#### Subtareas técnicas

- Hook `useHistorialCita.ts`
- Componente `HistorialCita.tsx` (accordion expandible)
- Integrar en MisCitas y MedicoDashboard
- Tests del componente con varias entradas

---

### US-10 — Email confirmation + MFA opcional (13 SP · Baja prioridad)

**Como** equipo,
**queremos** activar confirmación de email obligatoria y MFA opcional,
**para** acercar HELIOS a producción comercial real.

#### Criterios de aceptación

- [ ] Tras signUp, usuario recibe email con link de confirmación
- [ ] No puede iniciar sesión hasta confirmar
- [ ] Página `/verificar-email` con mensaje "Revisa tu bandeja"
- [ ] Opción "Reenviar email"
- [ ] Settings de usuario para activar MFA con app TOTP
- [ ] Login MFA: tras password correcto, pedir código TOTP

#### Subtareas técnicas

**Backend (Supabase):**
- Activar `Confirm email` en Auth settings
- Configurar SMTP propio (no usar el limitado de Supabase)
- Templates Auth en español con marca HELIOS
- Habilitar MFA en Auth settings

**Frontend:**
- Página `/verificar-email`
- Manejo de "email no confirmado" con mensaje claro
- Página `/configuracion` con sección MFA
- Modal MFA en login si está activo

**⚠️ NOTA:** Puede dividirse en US-10a (email) + US-10b (MFA) si conviene.

---

## 🛠️ Tareas técnicas no funcionales (Deuda Técnica)

### TD-01 — Monitoreo de errores con Sentry (3 SP)

- Integrar Sentry (free tier: 5,000 eventos/mes)
- Capturar errores no manejados en frontend
- Capturar console.errors del catch
- Alertas a email del equipo

### TD-02 — Logging estructurado (2 SP)

- Reemplazar `console.error` por logger estructurado
- Logs con contexto (user_id, accion, timestamp)
- Enviar a Supabase logs o servicio externo

### TD-03 — Pruebas E2E con Playwright (5 SP)

- Configurar Playwright en el repo
- 3 tests E2E críticos:
  1. Registro nuevo paciente → agendar cita → ver en MisCitas
  2. Médico ve agenda → marca cita completada → aparece en historial
  3. Cancelar cita → horario vuelve a disponible
- Correr en CI antes de cada deploy

### TD-04 — Locust a 500 usuarios (2 SP)

- Ajustar `locustfile.py` para 500 usuarios
- Medir P95 con esa carga
- Identificar cuellos de botella
- Documentar resultados

### TD-05 — Documentar RPCs en SQL (1 SP)

- Agregar `COMMENT ON FUNCTION` para cada RPC
- Documentar parámetros, retornos, casos de error
- Generar dump del schema con comentarios

---

## 📊 Distribución de Story Points propuesta

| Categoría | SP | % del Sprint |
|---|---|---|
| Notificaciones (US-08) | 8 | 24% |
| Historial UI (US-09) | 3 | 9% |
| Email + MFA (US-10) | 13 | 39% |
| Deuda técnica (TD-01 a TD-05) | 13 | 39% |
| **TOTAL** | **37 SP** | 100% |

**Capacidad estimada:** Si la velocidad sigue como Sprint 1 (37/53 SP en 2 semanas), el Sprint 3 puede comprometerse a **30-35 SP** realistas. **US-10 (13 SP) puede dejarse como stretch goal**.

---

## 🗓️ Cronograma sugerido (2 semanas)

### Semana 1

| Día | Tarea principal |
|---|---|
| Lun | Planning + setup |
| Mar-Mié | US-08 (notificaciones) — Edge Function + templates |
| Jue | US-08 — integración con triggers + recordatorios |
| Vie | TD-01 (Sentry) + TD-02 (logging) |

### Semana 2

| Día | Tarea principal |
|---|---|
| Lun | US-09 (historial UI) |
| Mar | TD-03 (Playwright E2E) |
| Mié | TD-04 (Locust 500) + TD-05 (documentar RPCs) |
| Jue | Buffer / US-10 si hay tiempo |
| Vie | Demo + retrospectiva |

---

## 🚦 Criterios de "Done"

Mismos que Sprint 1 y 2:

1. ✅ Código mergeado
2. ✅ Tests pasando (incluyendo nuevos E2E)
3. ✅ Code review aprobado
4. ✅ Deploy producción exitoso
5. ✅ PO valida
6. ✅ Docs actualizadas
7. ✅ Issues movidas a Done en Jira

---

## ⚠️ Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Resend free tier insuficiente (3000 emails/mes) | Empezar gratis, upgrade si pasamos 80% |
| Triggers SQL que invocan Edge Functions fallan silente | Logging + alertas Sentry |
| MFA muy complejo para tiempo de Sprint | Marcar US-10 como stretch goal |
| Playwright requiere setup nuevo en CI | Considerar Cypress como alternativa más rápida |
| Cambios SMTP propio rompen Auth | Probar exhaustivamente en branch antes de prod |

---

## 📝 Preguntas para discutir antes de comprometerse

1. **¿El profesor/profesora pide email confirmation para alguna entrega?**
2. **¿Tenemos presupuesto si los free tiers se quedan cortos?** (Resend $20/mes, Sentry $26/mes)
3. **¿MFA es realmente útil para un MVP académico?** (impacta UX, valor pedagógico discutible)
4. **¿Locust a 500 usuarios es objetivo del curso o métrica de vanidad?**
5. **¿Playwright vs Cypress?** Equipo decide según familiaridad
6. **¿Queremos dividir el Sprint 3 en 3a (notificaciones + hardening) y 3b (email + MFA)?**

---

## 📦 Entregables esperados al final del Sprint 3

1. App con notificaciones email funcionando en producción
2. Historial de cambios visible en UI
3. Monitoreo y logging operativos
4. 3+ tests E2E en CI
5. Métricas con Locust 500 usuarios
6. (Opcional) Email confirmation y MFA

---

## 🔄 Próximos pasos

1. **Cerrar Sprint 2** primero (HELL-3)
2. **Retrospectiva Sprint 2** identifica qué velocidad real tiene el equipo
3. **PO confirma prioridades** del Sprint 3 con base en feedback de la profesora
4. **Crear issue HELL-X "Sprint 3 — Hardening"** en Jira
5. **Comprometerse a 30-35 SP** (no 37), dejar US-10 como stretch

---

_Propuesta inicial. Sin validar con Jira ni con la profesora. 2026-05-28._
