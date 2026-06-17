# Daily — Semana 2 — Sprint 1

**Estado:** #completado 
**Fecha:** 2026-05-28 
**Sprint:** [[Sprint 1 — Agendamiento de Citas]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #daily #sprint-1 #semana-2 #agendamiento #react #typescript

---

## ¿Qué hicimos desde el último laboratorio?

### Entregables completados

- [x] **Proyecto React inicializado** — Vite + pnpm + TypeScript estricto + ESLint + Prettier configurados
- [x] **`lib/supabase.ts` creado** — Cliente Supabase con variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [x] **`cita.types.ts` completado** — Interfaces: `Cita`, `Medico`, `Sede`, `Disponibilidad`, `EstadoCita`, `NuevaCita`
- [x] **`agendamiento.service.ts` completado** — 4 funciones: `getMedicosDisponibles()`, `getHorariosDisponibles()`, `crearCita()`, `suscribirAgendaMedico()`
- [x] **`SelectorSede.tsx` construido** — Carga sedes activas desde Supabase, estado controlado
- [x] **`SelectorEspecialidad.tsx` construido** — Lista de especialidades filtrada por sede seleccionada
- [x] **`SelectorMedico.tsx` construido** — Médicos disponibles según sede + especialidad vía `getMedicosDisponibles()`
- [x] **`SelectorHorario.tsx` construido** — Horarios disponibles del médico en fecha seleccionada
- [x] **Spike Realtime completado** — Canal `agenda-medico` probado en entorno aislado. Latencia medida: 1.2s promedio

### Código producido esta semana

```
frontend/src/
├── lib/supabase.ts                  ← 12 líneas
├── types/cita.types.ts              ← 48 líneas
├── services/agendamiento.service.ts ← 74 líneas
└── components/agendamiento/
    ├── SelectorSede.tsx             ← 38 líneas
    ├── SelectorEspecialidad.tsx     ← 31 líneas
    ├── SelectorMedico.tsx           ← 45 líneas
    └── SelectorHorario.tsx          ← 52 líneas
Total: ~300 LOC producidas
```

### Métricas ISTQB — Semana 2

|Métrica|Valor|Interpretación|
|---|---|---|
|LOC producidas|~300|Primer código ejecutable del módulo|
|Componentes completados|4/5|Falta `ConfirmacionCita.tsx`|
|Funciones de servicio|4/4 (100%)|Capa de servicios completa|
|Defectos encontrados|2|Ver tabla de defectos|
|Defectos resueltos|2|Tasa de resolución: 100%|
|Cobertura de pruebas|0%|Tests inician semana 3|
|Latencia Realtime (spike)|1.2s promedio|✅ Cumple criterio < 5s|

### Registro de Defectos — Semana 2

|ID|Descripción|Severidad|Estado|Resolución|
|---|---|---|---|---|
|DEF-001|`getMedicosDisponibles()` retornaba médicos inactivos al no filtrar `disponible=true`|🔴 Mayor|✅ Resuelto|Agregar `.eq('disponible', true)` al query|
|DEF-002|Canal Realtime no se desuscribía al desmontar componente — memory leak detectado en spike|🟡 Menor|✅ Resuelto|Implementar `return () => supabase.removeChannel(channel)` en cleanup de `useEffect`|

### TMMi — Nivel 2: Gestión de Defectos

- Defectos clasificados por severidad (Mayor / Menor / Crítico) desde el primer día de código
- Registro mantenido en esta nota — trazabilidad directa a TC y HU afectada
- Tasa de inyección: 2 defectos / 300 LOC = **0.67 defectos/KLOC** (excelente para primera semana de código)

### TQM — Decisión de Calidad

> Se detectó DEF-001 durante code review informal antes de integrar al componente. Esto confirma el valor del **shift-left** — detectar el defecto en servicios antes de que llegue al UI redujo el costo de corrección a 5 minutos vs horas de debugging en producción.

---

## ¿Qué haremos para el próximo laboratorio?

### Prioridad Alta

- [ ] Construir `ConfirmacionCita.tsx` — pantalla final de confirmación con resumen de la cita
- [ ] Integrar flujo completo en `AgendarCita.tsx` — conectar los 5 selectores en secuencia
- [ ] Construir `AgendaMedico.tsx` con suscripción Realtime
- [ ] Construir `AgendaDia.tsx` y `TarjetaCita.tsx` (componentes de agenda)

### Prioridad Media

- [ ] Escribir pruebas funcionales en `__tests__/agendamiento.test.tsx` — TC1, TC2, TC3
- [ ] Ejecutar prueba de rendimiento Python (100 usuarios concurrentes)
- [ ] Correr SonarQube sobre el código producido

### Prioridad Baja

- [ ] Preparar cuestionario SUS para los 5 médicos evaluadores

### Responsables

|Tarea|Responsable|ETA|
|---|---|---|
|ConfirmacionCita.tsx|Dev Frontend|Lunes|
|AgendarCita.tsx (integración)|Dev Frontend|Martes|
|AgendaMedico.tsx + Realtime|Dev Backend|Miércoles|
|Pruebas Vitest|QA Lead|Jue–Vie|
|Script Python rendimiento|QA Lead|Viernes|

---

## ¿Qué problemas o bloqueos tuvimos?

### Bloqueos Esta Semana

|ID|Severidad|Descripción|Estado|Plan|
|---|---|---|---|---|
|BLQ-01|✅ Resuelto|Sin experiencia Realtime|CERRADO|Spike completado. Latencia 1.2s — cumple criterio|
|BLQ-02|✅ Resuelto|.env no distribuido|CERRADO|Variables compartidas el martes|
|BLQ-04|🟡 Nuevo|`AgendarCita.tsx` tiene estado complejo — 4 selectores en cascada dificultan el flujo|Abierto|Dividir en pasos con estado local usando `useState` por etapa|

### Riesgo Identificado

> **RIE-01:** Las pruebas de rendimiento Python requieren datos reales en Supabase (paciente_id, medico_id válidos). Si no existen en BD al momento de correr el script, todos los inserts fallarán con FK constraint violation.  
> **Acción:** Crear script de seed con datos de prueba antes de ejecutar test de carga.

---

## Notas Adicionales

> El spike de Realtime fue la actividad más valiosa de la semana. Confirmamos que la latencia real (1.2s) es muy inferior al criterio (5s), lo que da margen para posibles problemas de red en producción. La arquitectura de suscripción + cleanup está validada técnicamente.

---

_← [[Daily — Semana 1 — Sprint 0]] | [[Sprint 1 — Agendamiento de Citas]] | [[Módulo 01 — Agendamiento de Citas]] | [[Daily — Semana 3 — Sprint 1]]_