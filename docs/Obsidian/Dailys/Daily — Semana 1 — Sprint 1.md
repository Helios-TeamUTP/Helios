# Daily — Semana 1 — Sprint 1

**Estado:** #completado 
**Fecha:** 2026-05-21 
**Sprint:** [[Sprint 1 — Agendamiento de Citas]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-1 #semana-1 #diseno #arquitectura

---

## ¿Qué hicimos desde el último laboratorio?

Primera semana del Sprint 1 — sin escribir código todavía. La decisión del equipo fue diseñar antes de programar: definir bien las historias de usuario, el flujo end-to-end y, sobre todo, la base de datos completa, para que la semana 2 pudiera arrancar directo a construir componentes sin bloqueos de esquema.

### Entregables completados

- [x] **HU-01 y HU-02 definidas** con criterios de aceptación medibles (8 + 5 = 13 SP)
- [x] **Flujo de proceso end-to-end diseñado** — Sede → Especialidad → Médico → Fecha/Hora → Confirmación
- [x] **Tablas SQL creadas en Supabase** — `sedes`, `medicos`, `disponibilidad`, `citas`
- [x] **RLS configurado** — 6 políticas de seguridad activas desde el día uno (paciente, médico, admin)
- [x] **Estructura de carpetas del módulo definida** — `pages/`, `components/agendamiento/`, `services/`, `types/`, `__tests__/`

### Métricas ISTQB — Semana 1

|Métrica|Valor|Interpretación|
|---|---|---|
|LOC producidas|0|Semana de diseño puro, sin código aún|
|Tablas SQL creadas|4/4|Esquema base del módulo completo|
|Políticas RLS activas|6|Seguridad desde el diseño, no al final|
|Historias definidas|2/2 (HU-01, HU-02)|13 Story Points totales del sprint|

### TQM — Decisión de Calidad

> Crear toda la base de datos y el RLS antes de escribir una sola línea de frontend fue la apuesta más importante del sprint. La retrospectiva confirmó que esto evitó defectos estructurales — ningún bug de la semana 2 o 3 fue por esquema mal diseñado.

---

## ¿Qué haremos para el próximo laboratorio?

### Prioridad Alta

- [ ] Inicializar proyecto React + Vite + pnpm + TypeScript estricto + ESLint + Prettier
- [ ] Crear `lib/supabase.ts` con variables de entorno
- [ ] Completar `cita.types.ts` con todas las interfaces (`Cita`, `Medico`, `Sede`, `Disponibilidad`, `EstadoCita`, `NuevaCita`)
- [ ] Completar `agendamiento.service.ts`
- [ ] Construir `SelectorSede`, `SelectorEspecialidad`, `SelectorMedico`, `SelectorHorario`
- [ ] Spike de Supabase Realtime — medir latencia del canal `agenda-medico`

### Responsables

|Tarea|Responsable|ETA|
|---|---|---|
|Bootstrap proyecto React|Dev Frontend|Lunes|
|lib/supabase.ts + cita.types.ts|Dev Backend|Lunes-Martes|
|agendamiento.service.ts|Dev Backend|Martes-Miércoles|
|Selectores (4 componentes)|Dev Frontend|Miércoles-Viernes|
|Spike Realtime|Dev Backend|Viernes|

---

## ¿Qué problemas o bloqueos tuvimos?

### Bloqueos Esta Semana

|ID|Severidad|Descripción|Estado|Plan|
|---|---|---|---|---|
|BLQ-01|🟡 Abierto|Equipo sin experiencia previa con Supabase Realtime|Abierto|Dedicar un spike completo en semana 2 antes de construir sobre esa base|
|BLQ-02|🟡 Abierto|Variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) aún no compartidas con todo el equipo|Abierto|Compartir vía canal seguro al inicio de semana 2|

---

## Notas Adicionales

> Empezar por la base de datos completa y el RLS se sintió lento al principio — "todavía no hay nada que mostrar" — pero en retrospectiva fue la decisión correcta del Sprint 1. El esquema de `sedes → medicos → disponibilidad → citas → notificaciones` definido esta semana se mantuvo sin cambios estructurales durante todo el proyecto.

---

_← [[Daily — Semana 1 — Sprint 0]] | [[Sprint 1 — Agendamiento de Citas]] | [[Módulo 01 — Agendamiento de Citas]] | [[Daily — Semana 2 — Sprint 1]]_
