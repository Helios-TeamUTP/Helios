# Daily — Semana 3 — Sprint 1

**Estado:** #completado 
**Fecha:** 2026-06-11 
**Sprint:** [[Sprint 1 — Agendamiento de Citas]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-1 #semana-3 #testing #despliegue #cierre

---

## ¿Qué hicimos desde el último laboratorio?

Última semana del Sprint 1 — cerramos el flujo de agendamiento completo, escribimos las pruebas, corrimos las métricas de calidad y desplegamos a Railway. Sprint 1 queda **completado** con 13/13 Story Points.

### Entregables completados

- [x] **`ConfirmacionCita.tsx`** — pantalla final con resumen de la cita y código de confirmación
- [x] **`AgendarCita.tsx` integrado** — los 5 selectores conectados en secuencia (Sede → Especialidad → Médico → Horario → Confirmación)
- [x] **`AgendaMedico.tsx` con Realtime** — agenda del médico actualizada en vivo vía canal `agenda-medico`
- [x] **`AgendaDia.tsx` y `TarjetaCita.tsx`** — componentes de visualización de la agenda diaria
- [x] **8 casos de prueba Vitest + RTL** — `__tests__/agendamiento.test.tsx`, 8/8 pasando
- [x] **Script Python de carga** — 100 usuarios concurrentes ejecutado
- [x] **SonarQube corrido** sobre todo el código del módulo
- [x] **SUS aplicado** a los 5 médicos evaluadores — resultado: **80/100**
- [x] **Despliegue en Railway** — Módulo 01 accesible en producción

### Código producido esta semana

```
frontend/src/
├── components/agendamiento/ConfirmacionCita.tsx
├── pages/AgendarCita.tsx          ← integración de los 5 selectores
├── pages/AgendaMedico.tsx         ← Realtime
├── components/agendamiento/AgendaDia.tsx
├── components/agendamiento/TarjetaCita.tsx
└── __tests__/agendamiento.test.tsx ← 8 casos de prueba
Total semana: ~468 LOC
Total Sprint 1: ~768 LOC
```

### Métricas Finales del Sprint 1 (ISTQB)

|Métrica|Resultado|
|---|---|
|Velocidad|13 Story Points (100%)|
|LOC producidas (total)|~768 LOC|
|TC ejecutados|8/8 (100%)|
|Defectos totales del sprint|3|
|Densidad de defectos|0.39/KLOC|
|Cobertura de código|84%|
|SUS|80/100|
|Rendimiento p95 (100 usuarios)|1.94s|
|Realtime medido|1.8s|

### Registro de Defectos — Semana 3

|ID|Descripción|Severidad|Estado|Resolución|
|---|---|---|---|---|
|DEF-003|Selector de horario poco intuitivo — feedback directo del Eval-05 en el cuestionario SUS|🟡 Menor|✅ Resuelto parcialmente|Se documenta como acción de mejora para Sprint 2, no bloquea el Sprint 1|

> Con DEF-001 y DEF-002 (semana 2) + DEF-003 (semana 3) = **3 defectos totales / 768 LOC ≈ 0.39 defectos/KLOC** — dato que cierra la métrica final del Sprint 1.

---

## ¿Qué haremos para el próximo laboratorio?

Inicia el Sprint 2 — Cancelación y Reprogramación. Antes de código nuevo, el equipo prioriza resolver los bugs detectados en la demo del Sprint 1 (B-21 cédula, B-22 timezone), ver [[Sprint 2 — Cancelación y Reprogramación]].

### Prioridad Alta

- [ ] Corregir B-21 — validador de cédula panameña (`cedula.ts`)
- [ ] Corregir B-22 — timezone en calendario y `seed_data.py`
- [ ] Diseñar funciones SQL atómicas: `cancelar_cita_atomica`, `reprogramar_cita_atomica`
- [ ] Crear tabla `citas_historial` con triggers de auditoría

---

## ¿Qué problemas o bloqueos tuvimos?

### Bloqueos Esta Semana

|ID|Severidad|Descripción|Estado|Plan|
|---|---|---|---|---|
|BLQ-04|✅ Resuelto|`AgendarCita.tsx` con estado complejo (4 selectores en cascada)|CERRADO|Se dividió en pasos con `useState` por etapa — funcionó bien en la integración final|

### Riesgo Cerrado

> **RIE-01** (datos de seed para test de carga) se resolvió creando `scripts/seed_data.py` con datos de prueba válidos antes de correr el script de 100 usuarios. Sin este paso, el test habría fallado por violación de FK constraints.

---

## Retrospectiva del Sprint 1

**Lo que salió bien:**

- La semana 1 de diseño puro evitó defectos estructurales — el esquema de BD no cambió durante todo el sprint
- El spike de Realtime de semana 2 resolvió el mayor riesgo técnico del sprint
- RLS desde el inicio — cero problemas de seguridad detectados

**Lo que mejorar:**

- El selector de horario resultó poco intuitivo (DEF-003 / feedback Eval-05 del SUS)
- El script de seed de datos debería prepararse desde el inicio del sprint, no al final

**Acción para Sprint 2:**

- Mejorar UX del selector de horario
- Preparar seeds de datos desde el día 1

---

## Notas Adicionales

> Cerramos el Sprint 1 con los 13 SP completos y SUS de 80/100 — por encima del umbral de 75 definido en [[1. Documento de Visión del Proyecto]] §1.7. El hallazgo más importante: invertir la semana 1 completa en diseño y base de datos se paga con creces en las semanas de código.

---

_← [[Daily — Semana 2 — Sprint 1]] | [[Sprint 1 — Agendamiento de Citas]] | [[Módulo 01 — Agendamiento de Citas]] | [[Daily — Semana 4 — Sprint 2]]_
