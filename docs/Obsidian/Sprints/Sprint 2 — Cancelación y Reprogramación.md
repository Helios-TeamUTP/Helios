# Sprint 2 — Cancelación y Reprogramación

**Estado:** #activo 
**Fecha inicio:** 2026-05-30 
**Fecha fin:** 2026-06-12 
**Duración:** 2 semanas 
**Proyecto:** [[Proyecto - HELIOS]] 
**Jira Epic:** HELL-3 
**Tags:** #helios #sprint-2 #cancelacion #reprogramacion

---

## Objetivo del Sprint

Permitir al paciente autenticado cancelar o reprogramar sus citas directamente desde el portal, de forma atómica y con registro de auditoría. Además corregir los bugs B-21 (cédula) y B-22 (fechas) detectados en la demo del Sprint 1.

**Meta cumplida cuando:**

- Paciente puede cancelar cita con política de 24h aplicada
- Paciente puede reprogramar al otro horario disponible del mismo médico
- Ambas operaciones son atómicas (RPC en Supabase)
- Dashboard médico refleja cancelaciones y reprogramaciones
- Tabla `citas_historial` registra cada acción
- Bug B-21 resuelto: cédula acepta todos los formatos panameños
- Bug B-22 resuelto: fechas correctas en timezone de Panamá
- SonarCloud integrado al CI/CD
- Locust subido a 300 usuarios concurrentes

---

## Bugs a resolver PRIMERO (antes de código nuevo)

### B-21 — Cédula panameña

**Archivo:** `frontend/src/lib/cedula.ts` **Síntoma:** Cédulas cortas como `8-123-1` eran rechazadas **Fix:** Ver [[Investigación — Cédula Panameña]]

### B-22 — Fechas erróneas en calendario

**Archivos:** Componente de calendario + `scripts/seed_data.py` **Síntoma:** Al agendar, las fechas mostradas no correspondían al día correcto **Causa:** Timezone UTC vs America/Panama (UTC-5) **Fix:** Ver [[Investigación — Cédula Panameña]] sección timezone

---

## Historias de Usuario

### HU-06 — Cancelar cita confirmada

**Como** paciente autenticado, **quiero** cancelar una de mis citas confirmadas, **para** liberar el horario si no puedo asistir.

**Story Points:** 5

**Criterios de aceptación:**

- [ ] Solo cancelable con mínimo 24h de anticipación
- [ ] Si faltan < 24h, mensaje claro con la política institucional
- [ ] Operación atómica: cita → `cancelada`, horario → `disponible = true`
- [ ] Registro en `citas_historial` con motivo y timestamp
- [ ] Dashboard médico actualizado
- [ ] Confirmación visual inmediata
- [ ] Operación < 2 segundos

---

### HU-07 — Reprogramar cita

**Como** paciente autenticado, **quiero** reprogramar una cita a otro horario disponible del mismo médico, **para** cambiar fecha/hora sin perder mi turno.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Solo horarios disponibles del mismo médico
- [ ] Horario anterior → `disponible = true`, nuevo → `disponible = false`
- [ ] Cita original → `reprogramada`, nueva cita → `confirmada`
- [ ] Operación atómica (RPC)
- [ ] Dos registros en `citas_historial`
- [ ] Dashboard médico refleja cambio
- [ ] Operación < 2 segundos

---

## Tareas Técnicas

### Semana 1 (30 mayo - 5 junio)

|Tarea|Responsable|SP|Estado|
|---|---|---|---|
|Corregir B-21 cedula.ts|Ethan|—|⏳|
|Corregir B-22 timezone calendario|Ethan|—|⏳|
|Corregir B-22 seed_data.py timezone|Alejandro|—|⏳|
|Crear función SQL `cancelar_cita_atomica`|Alejandro|2|⏳|
|Crear función SQL `reprogramar_cita_atomica`|Alejandro|3|⏳|
|Crear tabla `citas_historial` + triggers|Alejandro|2|⏳|
|Crear hook `useCancelarCita`|Ethan|1|⏳|
|Crear componente `BotonCancelarCita` + modal|Ethan|1|⏳|

### Semana 2 (6 - 12 junio)

|Tarea|Responsable|SP|Estado|
|---|---|---|---|
|Crear hook + página `ReprogramarCita`|Ethan|3|⏳|
|Actualizar `MisCitas.tsx` con botones acción|Ethan|1|⏳|
|Actualizar dashboard médico|Ethan + Ashley|1|⏳|
|Tests funcionales cancelación|Ashley|—|⏳|
|Tests funcionales reprogramación|Ashley|—|⏳|
|Tests E2E básicos con Playwright|Ashley|—|⏳|
|Integrar SonarCloud al CI/CD|Marian|—|⏳|
|Subir Locust a 300 usuarios|Marian + Ashley|—|⏳|
|Deploy y verificación en producción|Marian|—|⏳|

---

## Criterios de Aceptación del Sprint

|Criterio|Métrica|Estado|
|---|---|---|
|B-21 resuelto|Tests de cédula nuevos pasan|⏳|
|B-22 resuelto|Fechas correctas en Panamá|⏳|
|Cancelación funcional|RPC atómica + UI completa|⏳|
|Reprogramación funcional|RPC atómica + UI completa|⏳|
|Historial de auditoría|Tabla con RLS activo|⏳|
|Tests módulo 2|≥ 80% cobertura|⏳|
|SonarCloud|Pipeline verde|⏳|
|Locust 300 usuarios|P95 < 2000ms|⏳|
|Playwright E2E|Al menos flujo cancelar|⏳|

---

## Dailys del Sprint

- [[Daily — Semana 4 — Sprint 2]] ← semana del 30 mayo
- [[Daily — Semana 5 — Sprint 2]] ← semana del 6 junio

---

## Referencias

- [[Proyecto - HELIOS]]
- [[Sprint 1 — Agendamiento de Citas]] ← cerrado
- [[Sprint 3 — Sincronización entre Sedes]] ← siguiente
- [[Módulo 02 — Cancelación y Reprogramación]]
- [[Investigación — Cédula Panameña]]
- [Jira HELL-3](https://helios-group.atlassian.net/)
- [Producción](https://helios-web-production.up.railway.app/)

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_