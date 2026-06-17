# Daily — Semana 1 — Sprint 1

**Estado:** #completado 
**Fecha:** 2026-05-21 
**Sprint:** [[Sprint 1 — Agendamiento]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-1 #semana-1 #agendamiento

---

## ¿Qué hicimos desde el último laboratorio?

Esta es la primera semana del proyecto — no hay "último laboratorio" previo. Esta daily documenta el arranque oficial del Sprint 1.

### Entregables completados

- [x] **Definición de HU-01** — Agendamiento desde portal web con criterios de aceptación medibles (< 2s registro, < 5s Realtime)
- [x] **Definición de HU-02** — Agenda del médico en tiempo real con criterio SUS ≥ 75
- [x] **Flujo de proceso diseñado** — Diagrama end-to-end desde paciente hasta notificación al médico
- [x] **Tablas SQL creadas en Supabase** — `sedes`, `medicos`, `disponibilidad`, `citas` con UUID PKs y constraints
- [x] **RLS configurado** — 6 políticas de Row Level Security: paciente ve sus citas, médico las suyas, todos ven sedes/médicos/disponibilidad activos
- [x] **Estructura de carpetas definida** — `pages/`, `components/`, `services/`, `types/`, `__tests__/`
- [x] **Arquitectura del módulo documentada** — Diagrama de 4 capas: Cliente → Servicios → Supabase → PostgreSQL
- [x] **Decisiones técnicas registradas** — Supabase Realtime vs polling, RLS vs validación frontend, un servicio por módulo

### Métricas ISTQB — Semana 1

|Métrica|Valor|Interpretación|
|---|---|---|
|HU definidas|2/2 (100%)|Base completa para Sprint 1|
|Criterios de aceptación medibles|7/7|Todos con KPI numérico|
|Tablas SQL creadas|4/4|Esquema listo para desarrollo|
|Políticas RLS|6/6|Seguridad implementada desde diseño|
|Líneas de código producidas|0 LOC|Fase de diseño — sin código aún|
|Defectos encontrados|0|N/A — sin ejecutables|
|TC diseñados|3|1 × HU-01 func, 1 × HU-01 perf, 1 × HU-02 RT|

### TQM — Ciclo PDCA Semana 1

|Fase|Acción|
|---|---|
|**Plan**|Definir HU con criterios cuantificables antes de escribir código|
|**Do**|Crear tablas SQL y configurar RLS en Supabase|
|**Check**|Revisar esquema con todo el equipo — ajustar constraints|
|**Act**|Políticas RLS ajustadas después de revisión de seguridad|

---

## ¿Qué haremos para el próximo laboratorio?

### Prioridad Alta

- [ ] Crear proyecto React con pnpm + TypeScript + Vite
- [ ] Crear `lib/supabase.ts` con cliente y credenciales
- [ ] Construir `agendamiento.service.ts` con las 4 funciones definidas
- [ ] Iniciar componentes: `SelectorSede.tsx`, `SelectorEspecialidad.tsx`

### Prioridad Media

- [ ] Construir `SelectorMedico.tsx` y `SelectorHorario.tsx`
- [ ] Crear `cita.types.ts` con todos los interfaces del módulo
- [ ] Iniciar `AgendarCita.tsx` como página principal del flujo

### Responsables

|Tarea|Responsable|ETA|
|---|---|---|
|Setup React + pnpm|Todo el equipo|Lunes|
|lib/supabase.ts|Dev Backend|Martes|
|agendamiento.service.ts|Dev Backend|Miércoles|
|Componentes Selector*|Dev Frontend|Jue–Vie|

---

## ¿Qué problemas o bloqueos tuvimos?

### Bloqueos Identificados

|ID|Severidad|Descripción|Plan de acción|
|---|---|---|---|
|BLQ-01|🔴 Alto|Sin experiencia en Supabase Realtime en el equipo|Spike técnico 2h semana 2. Prototipo aislado antes de integrar|
|BLQ-02|🟡 Medio|Variables .env de Supabase no distribuidas a todos|Tech Lead comparte vía canal privado antes del jueves|
|BLQ-03|🟡 Medio|Riesgo de memory leak con useEffect + Realtime|Patrón de cleanup definido: `return () => supabase.removeChannel(ch)` obligatorio|

### Dependencias

- **Supabase project URL + anon key** → sin esto no arranca el proyecto
- **Acceso al repo GitHub** → debe estar configurado para todos antes de lunes

---

## Notas Adicionales

> Primera semana de un módulo crítico. Se decidió dedicar la semana completa a diseño y arquitectura en lugar de saltar directo al código. Esta inversión inicial reduce la deuda técnica y los defectos en fases posteriores — principio ISTQB de detección temprana.

---

_← [[Sprint 1 — Agendamiento]] | [[Módulo 01 — Agendamiento de Citas]] | [[Daily — Semana 2 — Sprint 1]]_