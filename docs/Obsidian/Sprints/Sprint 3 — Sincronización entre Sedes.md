# Sprint 3 — Sincronización entre Sedes

**Estado:** #pendiente 
**Fecha inicio:** 2026-06-13 (estimada) 
**Fecha fin:** 2026-06-26 (estimada)
**Duración:** 2 semanas 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #sprint-3 #sincronizacion #realtime #notificaciones

---

## Objetivo del Sprint

Implementar la sincronización en tiempo real entre sedes usando Supabase Realtime, el sistema de notificaciones por correo electrónico usando Resend + Edge Functions, y el monitoring de salud del sistema para el administrador.

**Meta cumplida cuando:**

- Cambio en cualquier sede se refleja en todas en < 3 segundos
- Notificaciones por correo funcionan (recordatorio 24h y 1h antes)
- Administrador puede ver estado de sincronización en dashboard
- MFA opcional disponible para médicos
- Monitoreo de errores en producción con Sentry
- Pruebas E2E completas con Playwright

---

## Historias de Usuario

### HU-08 — Sincronización entre sedes en tiempo real

**Como** administrador del sistema, **quiero** que cualquier cambio en una sede se refleje automáticamente en todas las demás, **para** garantizar información consistente en toda la red.

**Story Points:** 13

**Criterios de aceptación:**

- [ ] Cambio visible en todas las sedes en < 3 segundos
- [ ] 99% de sincronizaciones exitosas bajo carga normal
- [ ] Reintentos automáticos con espera exponencial (1s, 2s, 4s)
- [ ] Log de cada sincronización en `sync_logs`
- [ ] Alerta al admin si 3 intentos consecutivos fallan
- [ ] Dashboard de estado de sedes

---

### HU-09 — Notificaciones por correo

**Como** paciente, **quiero** recibir un recordatorio por correo 24 horas y 1 hora antes de mi cita, **para** no olvidarme de asistir.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Edge Function con cron cada hora detecta citas próximas
- [ ] Correo enviado via Resend con datos de la cita
- [ ] No enviar si ya se envió ese recordatorio (constraint UNIQUE)
- [ ] Registro en tabla `notificaciones` con estado enviado/fallido
- [ ] 100% de citas confirmadas reciben al menos un recordatorio

---

### HU-10 — Confirmación de asistencia desde notificación

**Como** paciente, **quiero** confirmar mi asistencia desde el correo de recordatorio, **para** que el médico sepa que voy a ir.

**Story Points:** 3

**Criterios de aceptación:**

- [ ] Link de confirmación en el correo
- [ ] Al hacer click, estado de cita → `confirmada_asistencia`
- [ ] Médico ve qué pacientes confirmaron en su dashboard
- [ ] Funciona sin necesidad de iniciar sesión

---

## Tareas Técnicas

### Semana 1 (13 - 19 junio)

|Tarea|Responsable|Estado|
|---|---|---|
|Configurar Supabase Realtime en tabla citas|Alejandro|⏳|
|Crear tabla `sync_logs` con RLS|Alejandro|⏳|
|Crear tabla `notificaciones` con RLS|Alejandro|⏳|
|Implementar canal `citas-sync` en frontend|Ethan|⏳|
|Crear servicio de sincronización con reintentos|Ethan|⏳|
|Configurar Resend para correos|Alejandro|⏳|
|Crear Edge Function `enviar-recordatorio` (cron)|Alejandro|⏳|

### Semana 2 (20 - 26 junio)

|Tarea|Responsable|Estado|
|---|---|---|
|Crear Edge Function `notificar-cambio` (evento)|Alejandro|⏳|
|Crear dashboard de sincronización para admin|Ethan|⏳|
|Implementar confirmación de asistencia por link|Ethan|⏳|
|Configurar Sentry para monitoreo de errores|Marian|⏳|
|MFA opcional para médicos|Alejandro|⏳|
|Tests E2E completos con Playwright|Ashley|⏳|
|Locust a 500 usuarios|Marian + Ashley|⏳|
|Deploy y verificación|Marian|⏳|

---

## Deudas técnicas del Sprint 2 que pasan aquí

- Email de confirmación de cuenta (requiere SMTP en Supabase)
- Logging estructurado (actualmente solo console.error)
- Pruebas E2E completas (en Sprint 2 solo básicas)

---

## Criterios de Aceptación del Sprint

|Criterio|Métrica|Estado|
|---|---|---|
|Realtime entre sedes|99% cambios < 3s|⏳|
|Notificaciones correo|100% citas con recordatorio|⏳|
|Confirmación asistencia|Link funcional desde correo|⏳|
|sync_logs sin datos personales|Verificado en tests seguridad|⏳|
|Sentry configurado|Errores visibles en dashboard|⏳|
|Playwright E2E|Flujos completos cubiertos|⏳|
|Locust 500 usuarios|P95 < 2000ms|⏳|

---

## Dailys del Sprint

- [[Daily — Semana 6 — Sprint 3]]
- [[Daily — Semana 7 — Sprint 3]]

---

## Referencias

- [[Proyecto - HELIOS]]
- [[Sprint 2 — Cancelación y Reprogramación]] ← anterior
- [[Sprint 4 — Notificaciones y Cierre]] ← siguiente
- [[Módulo 03 — Sincronización entre Sedes]]

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_