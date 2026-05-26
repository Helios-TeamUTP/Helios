# Sprint 0 — Setup y Configuración

**Estado:** #completado 
**Fecha inicio:** 2026-05-21 
**Fecha fin:** 2026-05-25 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #sprint-0 #setup #documentacion

---

## Objetivo del Sprint

Preparar toda la infraestructura, documentación base y entorno de desarrollo para que el Sprint 1 pueda arrancar sin bloqueos. No se escribe código de producto en este sprint.

**Meta cumplida cuando:**

- Repositorio GitHub listo con estructura de carpetas
- Jira configurado con backlog y sprints
- Supabase con base de datos ejecutada
- Documentación base completa en Obsidian
- Diseños iniciales en Google Stitch

---

## Historias de Usuario

Ninguna — este sprint es de setup y documentación.

---

## Tareas del Sprint

### Herramientas y entorno

| Tarea                              | Responsable | Estado     |
| ---------------------------------- | ----------- | ---------- |
| Crear repositorio GitHub           | Marian      | Completado |
| Agregar colaboradores al GitHub    | Marian      | Pendiente  |
| Crear tablero Jira (Proyecto HELL) | Marian      | Completado |
| Configurar sprints 0-5 en Jira     | Marian      | Completado |
| Crear workspace Notion             | Marian      | Completado |
| Configurar vault Obsidian          | Marian      | Completado |
| Crear proyecto en Supabase         | Alejandro   | Completado |
| Ejecutar SQL completo en Supabase  | Alejandro   | Completado |
| Conectar Railway al repositorio    | Marian      | Pendiente  |

### Documentación

| Documento                          | Responsable   | Estado     |
| ---------------------------------- | ------------- | ---------- |
| `HELIOS.md` — nota general         | Marian        | Completado |
| `1-Vision-del-Proyecto.md`         | Jose          | Completado |
| `2-Documento-Requisitos-SRS.md`    | Jose + Ashley | Completado |
| `3-Arquitectura-Diseno-Sistema.md` | Alejandro     | Completado |
| `4-Flujo-del-Sistema.md`           | Jose          | Completado |
| `5-Wireframes-Diseno-UI-UX.md`     | Ethan         | Completado |
| `6-Diseno-Base-de-Datos.md`        | Alejandro     | Completado |
| `Modulo-01-Agendamiento.md`        | Equipo        | Completado |
| `Modulo-02-Cancelacion.md`         | Equipo        | Completado |
| `Modulo-03-Sincronizacion.md`      | Equipo        | Completado |
| `Modulo-04-Notificaciones.md`      | Equipo        | Completado |
| `arquitectura-helios.html`         | Alejandro     | Completado |

### Diseño UI/UX

| Tarea                                                     | Responsable | Estado     |
| --------------------------------------------------------- | ----------- | ---------- |
| Generar 10 pantallas en Google Stitch                     | Ethan       | Completado |
| Identificar correcciones pendientes                       | Ethan       | Completado |
| Crear pantallas faltantes (registro, login, confirmación) | Ethan       | Pendiente  |
| Aplicar correcciones globales (idioma, footer, nav)       | Ethan       | Pendiente  |

### Backlog Jira

| Tarea                                 | Responsable | Estado     |
| ------------------------------------- | ----------- | ---------- |
| Crear 12 historias de usuario en Jira | Jose        | Pendiente  |
| Asignar HU a sprints correspondientes | Jose        | Pendiente  |
| Agregar Story Points a cada HU        | Jose        |  Pendiente |

---

## Métricas del Sprint

|Métrica|Valor|
|---|---|
|Documentos generados|12|
|Pantallas diseñadas|10|
|HU definidas|12|
|RF documentados|27|
|RNF documentados|19|
|ADR documentados|7|
|Tablas de BD definidas|7|
|Días de duración|5|

---

## Decisiones Tomadas este Sprint

|Decisión|Razón|Fecha|
|---|---|---|
|pnpm sobre npm|Vulnerabilidad de seguridad en npm|2026-05-21|
|Supabase como BaaS|Resuelve BD, auth, realtime y notificaciones|2026-05-21|
|Railway para despliegue|Integración con GitHub, plan gratuito|2026-05-21|
|Sin app móvil nativa|Web responsive cubre el caso de uso|2026-05-21|
|Jira sobre Trello|Soporte nativo de Scrum, gratuito hasta 10 usuarios|2026-05-21|
|Un archivo .md por módulo|Claude Desktop puede leer módulos independientes|2026-05-21|

---

## Bloqueadores

- Pantallas de Stitch con correcciones pendientes
- Fechas de sprints 2-5 sin confirmar (esperando clase)

---

## Retrospectiva

**¿Qué salió bien?**

- Documentación completa antes de escribir código
- Todo el equipo alineado en stack y arquitectura
- Diseños de Stitch con buen nivel de calidad

**¿Qué mejorar?**

- Ejecutar Supabase más temprano en la semana
- Agregar colaboradores al GitHub el primer día
- Definir fechas de todos los sprints desde el inicio

---

## Links

- [[Daily — Semana 1 — Sprint 0]]
- [[Sprint 1 — Agendamiento de Citas]] ← siguiente

---

## Recursos

- [[Proyecto - HELIOS]] ← proyecto padre
- [GitHub — Helios](https://github.com/MarianC-programing/Helios)
- [Jira — Tablero HELL](https://helios-group.atlassian.net/)
- [Notion — HELIOS Workspace](https://www.notion.so/HELIOS-Workspace-2a2d9b5c1dbf4eab831310977e440c89)
- [Google Stitch — Proyecto](https://stitch.withgoogle.com/projects/8433169150774233053)

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_