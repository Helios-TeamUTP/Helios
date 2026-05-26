---
share_link: https://share.note.sx/pjjw2bkd#7TggH8R2Js+RK3TQ/jw1bAdlQ1MpCbIgbLaWQXJV29A
share_updated: 2026-05-24T23:51:29-05:00
---
# Proyecto HELIOS

**Estado:** #activo 
**Fecha inicio:** 2026-05-21
**Fecha límite:** 2026-06-11 (Sprint 1) · 2026-07-11 (entrega final estimada) 
**Área:** [[MOC — Proyectos]] 
**Tags:** #helios #calidad-software #utp #scrum #devops #supabase #react #typescript #istqb

---

## ¿Qué es?

Sistema web unificado de citas médicas para una red de policlínicas panameñas, desarrollado como proyecto de Calidad de Software en la UTP, aplicando Scrum, DevOps e ISTQB para garantizar un producto funcional, seguro y de calidad medible.

---

## Objetivo Principal

El éxito se ve así:

- 4 módulos funcionales desplegados en Railway
- Pruebas ISTQB ejecutadas y documentadas por cada módulo
- Dailys entregados cada semana a la profesora María Mosquera
- Presentación final de 5-10 minutos con demo en vivo del sistema

Está "listo" cuando el sistema permite agendar, cancelar, sincronizar y notificar citas sin errores críticos, con todas las métricas de calidad cumplidas y documentadas.

---

## Por Qué Lo Hago

Es el proyecto más completo de la carrera hasta ahora: combina desarrollo real con calidad de software formal usando estándares internacionales (ISTQB, ISO/IEC 25010). No es un proyecto de juguete — tiene base de datos real, autenticación, tiempo real, pruebas automatizadas y CI/CD. Lo que aprendamos aquí lo aplicamos directamente en el mundo profesional.

---

## Equipo

|Nombre|Rol|Responsabilidad principal|
|---|---|---|
|Jose Brown|Product Owner|Backlog, prioridades, visión del producto|
|Ethan Gonzalez|Dev Frontend|React + TypeScript, UI/UX de cada módulo|
|Alejandro Saenz|Tech Lead / Dev Backend|Supabase, arquitectura, base de datos|
|Ashley Martinez|QA Engineer|Pruebas ISTQB, métricas, SonarQube|
|Marian Barba|Scrum Master / DevOps|Sprints, dailys, CI/CD, Railway|

**Profesora:** María Mosquera **Curso:** Calidad de Software — Universidad Tecnológica de Panamá

---

## Stack Tecnológico

|Capa|Herramienta|
|---|---|
|Frontend|React + TypeScript|
|Base de datos|Supabase (PostgreSQL)|
|Autenticación|Supabase Auth|
|Tiempo real|Supabase Realtime|
|Despliegue|Railway|
|Scripts / QA|Python|
|Calidad de código|SonarQube Community|
|Testing frontend|Vitest + React Testing Library|
|Gestor de paquetes|pnpm|
|Backlog|Jira|
|Documentación|Obsidian + Notion|
|Repositorio|GitHub|

---

## Módulos del Sistema

|#|Módulo|Sprint|Fecha límite|
|---|---|---|---|
|01|Agendamiento de citas|Sprint 1|11 jun 2026|
|02|Cancelación y reprogramación|Sprint 2|Por definir|
|03|Sincronización entre sedes|Sprint 3|Por definir|
|04|Notificaciones y recordatorios|Sprint 4|Por definir|
|—|Pruebas, ajustes y cierre|Sprint 5|Por definir|

---

## Tareas

### En Progreso

- [ ] Crear proyecto React con pnpm + TypeScript
- [ ] Ejecutar SQL completo de base de datos en Supabase
- [ ] Conectar frontend a Supabase (credenciales + variables de entorno)
- [ ] Construir módulo 01 — Agendamiento con Claude Code
- [ ] Creacion de documentación completa:
	- [[ 1. Documento de Visión del Proyecto]]
	- [[2. Documento de Requisitos (SRS,  ERS)]]
	- [[3. Arquitectura y Diseño del Sistema]]
	- [[4. Flujo del Sistema]]
	- [[5. Wireframes y Diseño UI UX]]
	- [[6. Diseño de Base de Datos]]
	- [[7. Documentación Técnica]]
	- [[8. Manual de Usuario]]
	- [[9. Manual Técnico,  Mantenimiento]]



### Pendiente

- [ ] Agregar colaboradores al repositorio GitHub
- [ ] Conectar repositorio a Railway
- [ ] Configurar SonarQube Community
- [ ] Configurar GitHub Actions (CI/CD pipeline)
- [ ] Crear archivos markdown módulos 02, 03 y 04
- [ ] Crear prototipos en Google Sites (módulo 01 primero)
- [ ] Definir fechas de sprints 2, 3, 4 y 5 (esperar clase próxima semana)
- [ ] Ejecutar pruebas funcionales módulo 01 (Vitest)
- [ ] Ejecutar pruebas de rendimiento módulo 01 (Python)
- [ ] Aplicar SUS al módulo 01
- [ ] Primer daily documentado en Obsidian
- [ ] Actualizar Jira con criterios de aceptación completados

### Completado

- [x] Crear repositorio GitHub — https://github.com/MarianC-programing/Helios
- [x] Crear tablero Jira — https://helios-group.atlassian.net
- [x] Crear workspace Notion — https://www.notion.so/HELIOS-Workspace-2a2d9b5c1dbf4eab831310977e440c89
- [x] Crear sprints en Jira (Sprint 0 al Sprint 5)
- [x] Definir stack tecnológico
- [x] Definir roles del equipo
- [x] Generar arquitectura general del sistema (arquitectura-helios.html)
- [x] Generar SQL completo de base de datos
- [x] Generar markdown módulo 01 — Agendamiento
- [x] Entregar Parcial 1 escrito (PDF)

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Usar pnpm en lugar de npm|npm sufrió vulnerabilidad de seguridad reciente|2026-05-21|
|Usar Supabase como backend|Resuelve base de datos, auth, realtime y API en un solo servicio gratuito|2026-05-21|
|Usar Railway para despliegue|Integración directa con GitHub, plan gratuito suficiente para proyecto estudiantil|2026-05-21|
|No desarrollar app móvil|Proyecto estudiantil, web responsive cubre el caso de uso del paciente en celular|2026-05-21|
|Usar Jira en lugar de Trello|Soporte nativo de Scrum (sprints, burndown, backlog real), plan gratuito hasta 10 usuarios|2026-05-21|
|Usar Obsidian para documentación interna|Control local de archivos, formato markdown compatible con GitHub y Claude Code|2026-05-21|
|Un archivo markdown por módulo|Claude Code puede leer cada módulo de forma independiente sin confundirse|2026-05-21|
|Crear base de datos completa desde Sprint 0|Los módulos se relacionan entre sí, mejor definir toda la estructura desde el inicio|2026-05-21|
|Usar TypeScript en lugar de JavaScript|Tipado estático reduce errores en tiempo de desarrollo, mejor para un equipo de 5|2026-05-21|
|Pruebas de rendimiento en Python|El equipo ya conoce Python, scripts más simples que herramientas como k6 o JMeter|2026-05-21|

---

## Archivos del Proyecto

|Archivo|Descripción|Ubicación|
|---|---|---|
|`arquitectura-helios.html`|Diagrama visual de arquitectura general|`docs/` en GitHub|
|`modulo-01-agendamiento.md`|Especificación completa del módulo 1|`docs/` en GitHub|
|`modulo-02-cancelacion.md`|Especificación completa del módulo 2|`docs/` en GitHub — pendiente|
|`modulo-03-sincronizacion.md`|Especificación completa del módulo 3|`docs/` en GitHub — pendiente|
|`modulo-04-notificaciones.md`|Especificación completa del módulo 4|`docs/` en GitHub — pendiente|
|`GrupoHelios_Parcial1_Estrategia_UnidadI.pdf`|Documento escrito del Parcial 1|Teams|

---

## Recursos y Referencias

### Proyecto

- [[GitHub — Helios]] → https://github.com/MarianC-programing/Helios
- [[Jira — Tablero HELL]] → https://helios-group.atlassian.net
- [[Notion — HELIOS Workspace]] → https://www.notion.so/HELIOS-Workspace-2a2d9b5c1dbf4eab831310977e440c89

### Documentación técnica

- [[Supabase Docs]] → https://supabase.com/docs
- [[Railway Docs]] → https://docs.railway.app
- [[Vitest Docs]] → https://vitest.dev
- [[React Testing Library]] → https://testing-library.com/docs/react-testing-library/intro
- [[SonarQube Community]] → https://www.sonarsource.com/products/sonarqube

### Estándares aplicados

- [[ISTQB Foundation Level Syllabus 2018]]
- [[ISO/IEC 25010 — Modelo de calidad de software]]
- [[SUS — System Usability Scale (Brooke, 1996)]]

### Dailys

- [[Daily — Semana 1 — Sprint 1]]
- [[Daily — Semana 2 — Sprint 1]]
- [[Daily — Semana 3 — Sprint 1]]

### Módulos

- [[Módulo 01 — Agendamiento de Citas]]
- [[Módulo 02 — Cancelación y Reprogramación]]
- [[Módulo 03 — Sincronización entre Sedes]]
- [[Módulo 04 — Notificaciones y Recordatorios]]

---

## Reflexiones del Proyecto

_(Llenar semanalmente después de cada daily)_

**2026-05-21 — Sprint 0** Arrancamos con buena organización. Tener toda la arquitectura, base de datos y documentación antes de escribir una sola línea de código es algo que normalmente no hacemos en otros proyectos. Se nota la diferencia que hace la metodología. El reto más grande va a ser mantener el ritmo con los dailys y no dejar la documentación para el final.

**2026-05-28 — Sprint 1**

---

_← [[­HOME]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_