# Daily — Semana 1 — Sprint 0

**Fecha:** 2026-05-21 al 2026-05-25 
**Sprint:** [[Sprint 0 — Setup]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-0 #semana-1

---

## Resumen de la Semana

Primera semana del proyecto. Enfoque total en arquitectura, documentación base y configuración del entorno. No se escribió código de producto — se construyó la base para que el Sprint 1 pueda arrancar sin bloqueos.

---

## ¿Qué hicimos esta semana?

### Organización y herramientas

- [x] Repositorio GitHub creado → https://github.com/MarianC-programing/Helios
- [x] Tablero Jira creado (Proyecto HELL) → https://helios-group.atlassian.net
- [x] Workspace Notion creado → https://www.notion.so/HELIOS-Workspace
- [x] Vault Obsidian configurado con estructura de carpetas
- [x] Sprints 0 al 5 creados en Jira
- [x] Stack tecnológico definido y aprobado por el equipo
- [x] Roles del equipo asignados

### Documentación generada

- [x] `HELIOS.md` — nota general del proyecto en Obsidian
- [x] `1-Vision-del-Proyecto.md` — documento de visión completo
- [x] `2-Documento-Requisitos-SRS.md` — 27 RF + 12 RR + 19 RNF
- [x] `3-Arquitectura-Diseno-Sistema.md` — 7 ADR + patrones + seguridad
- [x] `4-Flujo-del-Sistema.md` — flujos paciente, médico y admin
- [x] `5-Wireframes-Diseno-UI-UX.md` — inventario de pantallas + prompts
- [x] `Modulo-01-Agendamiento.md` — especificación completa para Claude Desktop
- [x] `Modulo-02-Cancelacion.md` — especificación completa
- [x] `Modulo-03-Sincronizacion.md` — especificación completa
- [x] `Modulo-04-Notificaciones.md` — especificación completa
- [x] `arquitectura-helios.html` — diagrama visual interactivo

### Base de datos

- [x] SQL completo definido (7 tablas: sedes, pacientes, medicos, disponibilidad, citas, notificaciones, sync_logs)
- [x] Políticas RLS definidas por rol
- [x] Datos de prueba (seed) definidos

### Diseño UI/UX

- [x] 10 pantallas generadas en Google Stitch
- [x] Correcciones identificadas (idioma, footer, navegación)
- [x] 3 prompts generados para pantallas pendientes (registro, login, confirmación)
- [x] Sistema de diseño documentado (colores, tipografía, componentes)

---

## ¿Qué bloqueó?

- Fechas de sprints 2 al 5 sin definir — esperando instrucciones de la profesora la próxima semana
- Base de datos en Supabase aún no ejecutada en producción (pendiente Alejandro)
- Colaboradores del GitHub aún no agregados (pendiente Marian)
- Proyecto React aún no inicializado con pnpm

---

## ¿Qué sigue la próxima semana?

### Prioridad ALTA

- [x] Ejecutar SQL completo en Supabase ✅ 2026-05-25
- [x] Agrega colaboradores al GitHub ✅ 2026-05-25
- [x] Crear proyecto React con pnpm + TypeScript + Vite ✅ 2026-05-25
- [ ] Conectar Supabase al frontend (`lib/supabase.ts` + `.env`)
- [ ] Arranca el módulo 01 con los archivos md en el agente Calude

### Prioridad MEDIA

- [ ] Corregir pantallas de Stitch (idioma, footer, nav)
- [x] Crear pantallas faltantes en Stitch (registro, login, confirmación) ✅ 2026-05-25
- [ ] Exportar código React de Stitch
- [ ] Esperar instrucciones de la profesora y actualizar fechas de sprints

### Prioridad BAJA

- [ ] Configurar Railway para despliegue
- [ ] Configurar SonarQube Community

---

## Participación del equipo

|Integrante|Rol|Contribución esta semana|
|---|---|---|
|Jose Brown|Product Owner|Definición de backlog, historias de usuario, flujo del paciente y médico|
|Ethan Gonzalez|Dev Frontend|Revisión de stack, diseños en Stitch|
|Alejandro Saenz|Tech Lead|Revisión de arquitectura, SQL de base de datos|
|Ashley Martinez|QA Engineer|Revisión de tipos de prueba ISTQB, criterios de aceptación|
|Marian Barba|Scrum Master|Configuración GitHub, Jira, Obsidian, documentación general|

---

## Métricas del Sprint 0

|Métrica|Valor|
|---|---|
|Documentos generados|9|
|Pantallas diseñadas|10|
|Historias de usuario definidas|12|
|Requisitos funcionales|27|
|Reglas de negocio|12|
|Requisitos no funcionales|19|
|ADR documentados|7|
|Tablas de BD definidas|7|
|Líneas de SQL|~150|

---

## Reflexiones

Primera semana muy productiva en documentación. La decisión de documentar todo antes de escribir código fue correcta — ahora el equipo tiene claridad total sobre qué construir, cómo y por qué.

El mayor aprendizaje: tener el SRS y los módulos en markdown antes de arrancar el desarrollo va a ahorrar mucho tiempo de coordinación durante los sprints. Claude Desktop puede leer esos archivos y construir directamente.

Riesgo identificado: la base de datos en Supabase y el proyecto React deben estar listos antes del daily de la semana 2 o el Sprint 1 no puede arrancar.

---

## Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Sprint 0 — Setup]]
- [[Daily — Semana 2 — Sprint 1]] ← siguiente
- [[1. Documento de Visión del Proyecto]]
- [[Módulo 01 — Agendamiento de Citas]]

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_