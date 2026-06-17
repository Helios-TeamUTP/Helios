# Sprint 1 — Agendamiento

**Estado:** #completado 
**Fecha inicio:** 2026-05-21 
**Fecha fin:** 2026-06-11 
**Proyecto:** [[Proyecto - HELIOS]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Tags:** #helios #sprint-1 #agendamiento #scrum

---

## Objetivo del Sprint

Entregar el Módulo 01 de HELIOS completamente funcional: el flujo de agendamiento de citas desde el portal web y la agenda del médico en tiempo real.

---

## Definición de Done (DoD)

- [ ] Todas las pruebas funcionales pasan al 100%
- [ ] Rendimiento: 95% de respuestas bajo 2s con 100 usuarios concurrentes
- [ ] Realtime: cambios visibles en menos de 5 segundos
- [ ] SonarQube: 0 issues críticos
- [ ] SUS ≥ 75 sobre 100
- [ ] Sistema desplegado y corriendo en Railway

---

## Historias de Usuario del Sprint

|ID|Historia|Puntos|Estado|
|---|---|---|---|
|HU-01|Agendamiento desde portal web|8|✅ Completada|
|HU-02|Agenda del médico en tiempo real|5|✅ Completada|

**Total:** 13 puntos de historia — **velocidad del equipo Sprint 1: 13 SP**

---

## Backlog del Sprint

### Completado ✅

- [x] Definir HU-01 y HU-02 con criterios medibles
- [x] Diseñar flujo de proceso end-to-end
- [x] Crear tablas SQL en Supabase (sedes, medicos, disponibilidad, citas)
- [x] Configurar RLS con 6 políticas de seguridad
- [x] Definir estructura de carpetas del módulo
- [x] Crear proyecto React + pnpm + TypeScript
- [x] Crear `lib/supabase.ts`
- [x] Crear `cita.types.ts` con todos los interfaces
- [x] Crear `agendamiento.service.ts` (4 funciones)
- [x] Construir SelectorSede, SelectorEspecialidad, SelectorMedico, SelectorHorario
- [x] Construir ConfirmacionCita.tsx
- [x] Integrar AgendarCita.tsx (flujo completo)
- [x] Construir AgendaMedico.tsx con Realtime
- [x] Construir AgendaDia.tsx y TarjetaCita.tsx
- [x] Escribir 8 casos de prueba Vitest + RTL
- [x] Ejecutar script Python 100 usuarios
- [x] Correr SonarQube
- [x] Aplicar SUS a 5 evaluadores
- [x] Desplegar en Railway

---

## Dailys del Sprint

- [[Daily — Semana 1 — Sprint 1]] — Diseño y arquitectura
- [[Daily — Semana 2 — Sprint 1]] — Código: servicios y componentes
- [[Daily — Semana 3 — Sprint 1]] — Pruebas, métricas y despliegue

---

## Métricas Finales

|Métrica|Resultado|
|---|---|
|Velocidad|13 Story Points|
|LOC producidas|~768 LOC|
|TC ejecutados|8/8 (100%)|
|Defectos totales|3|
|Densidad de defectos|0.39/KLOC|
|Cobertura de código|84%|
|SUS|80/100|
|Rendimiento p95|1.94s|
|Realtime medido|1.8s|

---

## Retrospectiva

**Lo que salió bien:**

- Semana 1 de diseño puro evitó defectos estructurales
- Spike de Realtime resolvió el mayor riesgo del sprint
- RLS en BD desde el inicio — cero problemas de seguridad

**Lo que mejorar:**

- El selector de horario resultó poco intuitivo (feedback Eval-05 SUS)
- El script de seed de datos debería haberse preparado antes del test de carga

**Acción para Sprint 2:**

- Mejorar UX del selector de horario
- Preparar seeds desde el inicio del sprint

---

_← [[Proyecto - HELIOS]] | [[Módulo 01 — Agendamiento de Citas]] | [[MOC — Proyectos]]_