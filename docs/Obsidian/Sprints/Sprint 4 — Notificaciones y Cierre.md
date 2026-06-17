# Sprint 4 — Notificaciones y Cierre

**Estado:** #pendiente 
**Fecha inicio:** 2026-06-27 (estimada) 
**Fecha fin:** 2026-07-10 (estimada)
**Duración:** 2 semanas 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #sprint-4 #notificaciones #cierre #presentacion

---

## Objetivo del Sprint

Completar el [[Módulo 04 — Notificaciones y Recordatorios]] (recordatorio 1h y notificación inmediata de cambios/cancelaciones), correr la regresión completa de los módulos 01-04, terminar la documentación técnica final y dejar HELIOS desplegado y listo para la presentación del Parcial 1.

**Meta cumplida cuando:**

- El 100% de las citas confirmadas reciben recordatorio 24h y 1h
- Las cancelaciones/cambios generan notificación en menos de 30 segundos
- Confirmación de asistencia funciona desde la notificación, sin login
- Regresión completa de módulos 01-04 pasa al 100%
- Documentación técnica (7, 8, 9) completa
- Los 4 módulos están desplegados y accesibles en Railway
- Demo de 5-10 minutos preparada para la profesora María Mosquera

---

## Historias de Usuario

> Las historias HU-11 y HU-12 están especificadas en detalle en [[Módulo 04 — Notificaciones y Recordatorios]]. HU-09 y HU-10 ya quedaron cubiertas en el [[Sprint 3 — Sincronización entre Sedes]].

### HU-11 — Recordatorio 1 hora antes y confirmación de asistencia

**Como** paciente, **quiero** recibir un aviso final 1 hora antes de mi cita y poder confirmar mi asistencia desde ahí, **para** tener un último recordatorio y que el médico sepa que voy a ir.

**Story Points:** 5

**Criterios de aceptación:**

- [ ] Recordatorio enviado en la ventana de 1h antes de la cita
- [ ] Link/botón de confirmación funciona sin iniciar sesión
- [ ] Estado de la cita cambia a `confirmada_asistencia` con timestamp
- [ ] El médico ve qué pacientes confirmaron en su dashboard

---

### HU-12 — Notificación inmediata de cancelación o cambio

**Como** paciente, **quiero** recibir una notificación inmediata si mi cita fue cancelada o reprogramada, **para** poder reaccionar a tiempo sin perder el viaje a la clínica.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Notificación enviada en menos de 30 segundos tras el cambio
- [ ] Incluye motivo del cambio si está disponible
- [ ] Incluye link directo para reprogramar
- [ ] Estado registrado en `notificaciones`

---

### HU-13 — Cierre y entrega del proyecto

**Como** equipo de desarrollo, **quiero** dejar HELIOS desplegado, documentado y probado de extremo a extremo, **para** entregar un sistema funcional y demostrable en la presentación del Parcial 1.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Regresión completa de módulos 01-04 pasa al 100%
- [ ] Documentos 7, 8 y 9 completos en [[Proyecto - HELIOS]]
- [ ] Los 4 módulos accesibles en producción (Railway)
- [ ] 0 vulnerabilidades críticas en SonarQube
- [ ] Guion y demo de presentación listos

---

## Tareas Técnicas

### Semana 1 (27 jun - 3 jul)

|Tarea|Responsable|Estado|
|---|---|---|
|Edge Function `enviar-recordatorio` — ventana 1h|Alejandro|⏳|
|Edge Function `notificar-cambio` (trigger por evento)|Alejandro|⏳|
|`BtnConfirmarAsist.tsx` + flujo sin login|Ethan|⏳|
|`CentroNotificaciones.tsx` y `PreferenciasNotif.tsx`|Jose|⏳|
|Pruebas funcionales `notificaciones.test.tsx`|Ashley|⏳|
|Pruebas de sistema y seguridad en Python|Ashley + Marian|⏳|

### Semana 2 (4 - 10 jul)

|Tarea|Responsable|Estado|
|---|---|---|
|Regresión completa módulos 01-04 (Vitest + RTL)|Todo el equipo|⏳|
|Revisión final SonarQube — 0 críticas|Marian|⏳|
|Documento 7 — Documentación Técnica|Marian|⏳|
|Documento 8 — Manual de Usuario|Jose|⏳|
|Documento 9 — Manual Técnico y Mantenimiento|Alejandro|⏳|
|Deploy final 4 módulos en Railway|Marian|⏳|
|Preparar demo y guion de presentación|Todo el equipo|⏳|

---

## Deudas Técnicas que Llegan de Sprints Anteriores

- Confirmación por correo al registrarse (requiere SMTP, ver [[Sprint 2 — Cancelación y Reprogramación]])
- Logging estructurado (placeholder con `console.error` desde Sprint 1)
- Proveedor SMS panameño (placeholder desde Sprint 3 — queda fuera del alcance del Parcial 1)

---

## Criterios de Aceptación del Sprint

|Criterio|Métrica|Estado|
|---|---|---|
|Recordatorio 1h|100% citas confirmadas|⏳|
|Notificación de cambio/cancelación|< 30 segundos|⏳|
|Confirmación de asistencia sin login|Funcional|⏳|
|Regresión M01-M04|100% pasa|⏳|
|SonarQube|0 vulnerabilidades críticas|⏳|
|Documentación 7, 8, 9|Completa|⏳|
|Despliegue final|4 módulos en Railway|⏳|

---

## Dailys del Sprint

- [[Daily — Semana 1 — Sprint 4]]

---

## Referencias

- [[Proyecto - HELIOS]]
- [[Sprint 3 — Sincronización entre Sedes]] ← anterior
- [[Módulo 04 — Notificaciones y Recordatorios]]
- [[ISO-IEC 25010 — Modelo de Calidad de Software]]
- [[ISTQB Foundation Level Syllabus 2018]]

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_
