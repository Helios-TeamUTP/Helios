# Daily — Semana 4 — Sprint 2

**Estado:** #en-progreso 
**Fecha:** 2026-05-30 
**Sprint:** [[Sprint 2 — Cancelación y Reprogramación]] 
**Módulo:** [[Módulo 02 — Cancelación y Reprogramación]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-2 #semana-4 #cancelacion #bugs

---

## Plan de la Semana (30 mayo - 5 junio)

> Primera semana del Sprint 2. Prioridad: resolver los bugs B-21 y B-22 detectados en la demo del Sprint 1 **antes** de tocar código nuevo (ver [[Sprint 2 — Cancelación y Reprogramación]] → Bugs a resolver PRIMERO).

### Bugs

- [ ] Corregir B-21 — `frontend/src/lib/cedula.ts` (cédulas cortas como `8-123-1` rechazadas). Ver [[Investigación — Cédula Panameña]]
- [ ] Corregir B-22 — timezone del calendario (UTC vs America/Panama, UTC-5)
- [ ] Corregir B-22 en `scripts/seed_data.py`

### Backend

- [ ] Crear función SQL `cancelar_cita_atomica` (2 SP)
- [ ] Crear función SQL `reprogramar_cita_atomica` (3 SP)
- [ ] Crear tabla `citas_historial` + triggers de auditoría (2 SP)

### Frontend

- [ ] Crear hook `useCancelarCita` (1 SP)
- [ ] Crear componente `BotonCancelarCita` + modal de confirmación (1 SP)

---

## ¿Qué hicimos esta semana?

*(Completar al final de la semana: marcar lo hecho arriba y describir aquí cómo se resolvieron B-21 y B-22, y el estado de las funciones SQL atómicas)*

---

## ¿Qué problemas o bloqueos tuvimos?

|ID|Severidad|Descripción|Estado|Plan|
|---|---|---|---|---|
| | | | | |

---

## ¿Qué haremos para el próximo laboratorio?

Continuar con la semana 2 del Sprint 2: hook y página de reprogramación, actualización de `MisCitas.tsx` y dashboard médico, tests funcionales, SonarCloud y Locust a 300 usuarios. Ver [[Daily — Semana 5 — Sprint 2]].

---

## Notas Adicionales

---

_← [[Daily — Semana 3 — Sprint 1]] | [[Sprint 2 — Cancelación y Reprogramación]] | [[Módulo 02 — Cancelación y Reprogramación]] | [[Daily — Semana 5 — Sprint 2]]_
