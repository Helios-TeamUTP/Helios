# Sprint 1 — Agendamiento de Citas

**Estado:** #activo 
**Fecha inicio:** 2026-05-25 
**Fecha fin:** 2026-06-11 
**Duración:** 3 semanas 
**Proyecto:** [[Proyecto - HELIOS]] 
**Módulo:** [[Módulo 01 — Agendamiento de Citas]] 
**Tags:** #helios #sprint-1 #agendamiento #modulo-01

---

## Objetivo del Sprint

Tener el flujo completo de agendamiento de citas funcionando en el navegador web, conectado a Supabase y con la agenda del médico actualizándose en tiempo real. Al final del sprint el paciente puede agendar una cita desde el portal y el médico la ve en su dashboard sin recargar la página.

**Meta cumplida cuando:**

- Flujo de agendamiento funciona end-to-end en el navegador
- Cita registrada en Supabase en menos de 2 segundos
- Agenda del médico actualizada en menos de 5 segundos via Realtime
- Pruebas funcionales pasan al 100% con Vitest
- SonarQube reporta 0 vulnerabilidades críticas
- Sistema desplegado y accesible en Railway

---

## Historias de Usuario

### HU-01 — Agendamiento desde portal web

**Como** paciente, **quiero** seleccionar sede, especialidad, médico disponible, fecha y hora, **para** agendar una cita médica desde el portal web.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Solo muestra médicos disponibles según sede y especialidad
- [ ] No permite seleccionar horarios ya reservados
- [ ] Cita registrada en Supabase en menos de 2 segundos
- [ ] Paciente recibe confirmación visual inmediata
- [ ] Cita aparece en agenda del médico en menos de 5 segundos

---

### HU-02 — Agenda del médico en tiempo real

**Como** médico, **quiero** ver mi agenda actualizada automáticamente, **para** conocer mis citas sin recargar la pantalla.

**Story Points:** 5

**Criterios de aceptación:**

- [ ] Cambios visibles en menos de 5 segundos via Supabase Realtime
- [ ] Muestra nombre del paciente, hora, especialidad y sede
- [ ] Médico puede filtrar agenda por fecha
- [ ] Interfaz pasa SUS ≥ 75 sobre 100

---

## Tareas Técnicas

### Semana 1 (25 - 31 mayo) — Setup técnico

| Tarea                                                           | Responsable | Estado |
| --------------------------------------------------------------- | ----------- | ------ |
| Crear proyecto React con pnpm + TypeScript + Vite               | Ethan       | ⏳      |
| Instalar dependencias base (@supabase/supabase-js, vitest, RTL) | Ethan       | ⏳      |
| Crear `lib/supabase.ts` con cliente Supabase                    | Alejandro   | ⏳      |
| Crear archivo `.env` con credenciales                           | Alejandro   | ⏳      |
| Verificar `.gitignore` incluye `.env`                           | Marian      | ⏳      |
| Ejecutar SQL en Supabase (si no se hizo en Sprint 0)            | Alejandro   | ⏳      |
| Crear estructura de carpetas del proyecto                       | Ethan       | ⏳      |
| Configurar Vitest en `vite.config.ts`                           | Ashley      | ⏳      |
| Primer commit con estructura base                               | Marian      | ⏳      |

### Semana 2 (1 - 7 junio) — Desarrollo del módulo

|Tarea|Responsable|Estado|
|---|---|---|
|Crear `cita.types.ts` con tipos TypeScript|Ethan|⏳|
|Crear `agendamiento.service.ts` (getMedicos, getHorarios, crearCita)|Alejandro|⏳|
|Crear componente `SelectorSede.tsx`|Ethan|⏳|
|Crear componente `SelectorEspecialidad.tsx`|Ethan|⏳|
|Crear componente `SelectorMedico.tsx`|Ethan|⏳|
|Crear componente `SelectorHorario.tsx`|Ethan|⏳|
|Crear componente `ConfirmacionCita.tsx`|Ethan|⏳|
|Crear página `AgendarCita.tsx` (wizard 4 pasos)|Ethan|⏳|
|Implementar Supabase Realtime en `AgendaMedico.tsx`|Alejandro|⏳|
|Crear página `AgendaMedico.tsx` con vista diaria|Ethan|⏳|
|Exportar código React de Google Stitch e integrar|Ethan|⏳|

### Semana 3 (8 - 11 junio) — Pruebas y cierre

|Tarea|Responsable|Estado|
|---|---|---|
|Escribir pruebas funcionales en `agendamiento.test.tsx`|Ashley|⏳|
|Correr pruebas funcionales con Vitest|Ashley|⏳|
|Correr script Python de rendimiento|Ashley|⏳|
|Aplicar cuestionario SUS (muestra interna del equipo)|Ashley|⏳|
|Revisar código con SonarQube|Ashley|⏳|
|Desplegar en Railway|Marian|⏳|
|Verificar funcionamiento en producción|Todo el equipo|⏳|
|Actualizar README con instrucciones de setup|Marian|⏳|
|Registrar daily semana 2 y semana 3|Marian|⏳|
|Actualizar Jira con tareas completadas|Marian|⏳|
|Presentar avance a la profesora|Todo el equipo|⏳|

---

## Comandos de Setup

```bash
# Crear proyecto React con pnpm
pnpm create vite@latest frontend -- --template react-ts
cd frontend

# Instalar dependencias de producción
pnpm install @supabase/supabase-js

# Instalar dependencias de desarrollo
pnpm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Verificar que funciona
pnpm dev
```

---

## Estructura de Carpetas a Crear

```
frontend/src/
├── lib/
│   └── supabase.ts
├── types/
│   └── cita.types.ts
├── services/
│   └── agendamiento.service.ts
├── components/
│   └── agendamiento/
│       ├── SelectorSede.tsx
│       ├── SelectorEspecialidad.tsx
│       ├── SelectorMedico.tsx
│       ├── SelectorHorario.tsx
│       └── ConfirmacionCita.tsx
├── pages/
│   ├── AgendarCita.tsx
│   └── AgendaMedico.tsx
└── __tests__/
    └── agendamiento.test.tsx
```

---

## Criterios de Aceptación del Sprint

|Criterio|Métrica|Estado|
|---|---|---|
|Flujo completo funciona|100% pruebas funcionales pasan|⏳|
|Rendimiento|95% respuestas < 2s con 100 usuarios|⏳|
|Realtime agenda médico|Cambio visible < 5s|⏳|
|Calidad de código|SonarQube 0 issues críticos|⏳|
|Usabilidad|SUS ≥ 75|⏳|
|Despliegue|Accesible en Railway|⏳|

---

## Dailys del Sprint

- [[Daily — Semana 1 — Sprint 1]] ← semana del 25 mayo
- [[Daily — Semana 2 — Sprint 1]] ← semana del 1 junio
- [[Daily — Semana 3 — Sprint 1]] ← semana del 8 junio

---

## Política de Calidad

- Todo código nuevo debe pasar SonarQube antes de hacer merge
- Ningún PR sin pruebas unitarias del flujo cubierto
- El flujo completo debe funcionar end-to-end antes del daily semanal
- Las llamadas a Supabase van SOLO en archivos de servicios, nunca en componentes
- Usar pnpm siempre, nunca npm
- TypeScript estricto en todo el código
- Colores del sistema: azul `#003087`, rojo `#CE1126`

---

## Bloqueadores Potenciales

|Bloqueador|Impacto|Mitigación|
|---|---|---|
|Supabase no ejecutado|Alto — bloquea todo|Alejandro lo ejecuta el lunes 25|
|Realtime no habilitado en tabla citas|Alto|Verificar en SQL Editor|
|Stitch no exportado a React|Medio|Ethan exporta al inicio de semana 2|
|SonarQube sin configurar|Bajo|Configurar en semana 3|

---

## Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Sprint 0 — Setup]] ← sprint anterior
- [[Sprint 2 — Cancelación y Reprogramación]] ← siguiente
- [[Módulo 01 — Agendamiento de Citas]] ← especificación completa
- [[6. Diseño de Base de Datos]] ← SQL de las tablas
- [[5. Wireframes y Diseño UI UX]] ← diseños de Stitch

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_