# Daily — Semana 2 — Sprint 1

**Fecha:** 2026-05-25 al 2026-05-28
**Sprint:** [[Sprint 1 — Agendamiento de Citas]]
**Proyecto:** [[Proyecto - HELIOS]]
**Tags:** #helios #daily #sprint-1 #semana-2

---

## Resumen de la Semana

Primera semana de construcción del producto. Pasamos de un proyecto React vacío a un sistema funcional desplegado, conectado a Supabase, con autenticación real, agendamiento de citas end-to-end y la suite de pruebas en verde con cobertura sobre el umbral del Sprint.

---

## ¿Qué hicimos esta semana?

### Infraestructura

- [x] Esquema PostgreSQL ejecutado en Supabase — 7 tablas (sedes, especialidades, médicos, horarios, pacientes, citas, auth_paciente_link) con índices, RLS habilitada y función RPC `crear_cita_atomica` para evitar dobles reservas.
- [x] Supabase Auth con provider email/password habilitado.
- [x] Tablero Jira `HELL` actualizado: HU-01 y subtareas movidas a "In Progress" / "Done".
- [x] Frontend desplegado en Railway con dominio público compartible.

### Frontend (US-01 a US-05)

- [x] Cliente Supabase tipado en `frontend/src/lib/supabase.ts`.
- [x] AuthProvider + hook `useAuth` que mapea `auth.users` ↔ `pacientes` vía tabla puente.
- [x] Wizard de agendamiento de 4 pasos en `pages/AgendarCita.tsx` con `useReducer`:
  1. Selector de Especialidad + Sede
  2. Lista de Médicos filtrada
  3. Calendario FullCalendar con slots reales
  4. Confirmación con código de cita
- [x] Página `Mis Citas` que lista las citas del paciente autenticado con joins a horarios/médicos/sedes.
- [x] Páginas `Login` y `Registro` con validación de cédula panameña.
- [x] Layout responsive con identidad visual HELIOS (teal #0A8478).

### Backend / Datos

- [x] `scripts/seed_data.py` genera datos de prueba realistas: 3 sedes, 5 especialidades, 10 médicos, ~1.890 slots de horario en 14 días laborales, 20 pacientes con 15 citas iniciales.

### Calidad

- [x] Vitest + React Testing Library configurado.
- [x] 39 tests en 10 archivos cubriendo: validación de cédula, componentes de selección, formularios de Auth, página Mis Citas, resumen de cita, mensajes de error y spinners.
- [x] **Cobertura: 65.26% statements · 53.71% branches · 89.28% functions · 81.72% lines** (objetivo Sprint 1: ≥60% statements).
- [x] `sonar-project.properties` listo para conectar el repo a SonarCloud.
- [x] `scripts/locustfile.py` con 3 escenarios (60/30/10) listo para correr contra el deploy.

---

## ¿Qué bloqueó?

- React 19.2 + TypeScript 6 + Vite 8 es un stack muy nuevo. Tuvimos que ajustar el cliente Supabase para que compile con `verbatimModuleSyntax: true` y el cliente quedó sin tipado genérico de tablas — Sprint 2 lo endurece con codegen de tipos (`supabase gen types`).
- Vitest 4 cambió la importación de `defineConfig` (ahora viene de `vitest/config` en vez de `vite`).
- Pre-validación de cédula panameña: el primer regex era demasiado estricto y rechazaba formatos como `PE-12-345`. Se simplificó a "5-12 dígitos tras quitar prefijo y guiones".

---

## ¿Qué sigue la próxima semana?

### Prioridad ALTA

- [ ] HU-02 — Agenda del médico en tiempo real con Supabase Realtime (Alejandro)
- [ ] Endurecer Row Level Security: políticas por rol (paciente solo ve sus citas, médico ve sus pacientes) (Alejandro)
- [ ] Aumentar cobertura al 70%+ agregando tests para `useAuth`, RPC `crear_cita_atomica` y CalendarioCitas (Ashley)
- [ ] Aplicar cuestionario SUS al equipo y a 2 usuarios externos (Ashley)

### Prioridad MEDIA

- [ ] Pasada de SonarCloud con análisis de code smells y refactor de hallazgos (Ethan)
- [ ] Tipado fuerte del cliente Supabase vía `supabase gen types typescript` (Ethan)
- [ ] Locust con 1000 usuarios concurrentes contra el deploy Railway, snapshot de P95 (Ashley)
- [ ] CI GitHub Actions: lint + tests + Sonar scan en cada PR (Marian)

### Prioridad BAJA

- [ ] Notificaciones por email vía Supabase Edge Functions (puente al Sprint 3)
- [ ] PWA / instalable en móvil

---

## Participación del equipo

| Integrante | Rol | Contribución esta semana |
|---|---|---|
| Jose Brown | Product Owner | Refinamiento de US-01 a US-05, validación de cédula panameña, definición de flujo del wizard, coordinación de demo del jueves |
| Ethan Gonzalez | Dev Frontend | Componentes del wizard, FullCalendar, layout responsive, identidad visual HELIOS |
| Alejandro Saenz | Tech Lead / Backend | Esquema PostgreSQL, RPC `crear_cita_atomica`, RLS, configuración Supabase Auth, tabla puente |
| Ashley Martinez | QA Engineer | Suite Vitest, configuración de cobertura, script Locust, criterios de aceptación |
| Marian Barba | Scrum Master / DevOps | Estructura del repo, deploy Railway, sonar-project.properties, Jira, documentación del daily |

---

## Métricas del Sprint 1 — Semana 2

### Métricas en requerimientos

| Métrica | Valor | Marco |
|---|---|---|
| US planificadas | 5 (US-01 a US-05) | Backlog Sprint 1 |
| US con criterios de aceptación definidos | 5/5 = 100% | ISTQB · TMMi |
| US implementadas end-to-end | 5/5 = 100% | ISTQB |
| Trazabilidad US → tabla → componente → test | 5/5 documentadas | TMMi nivel 3 |
| Volatilidad de requerimientos | 0 cambios mid-sprint | TQM |

### Métricas en diseño

| Métrica | Valor | Herramienta |
|---|---|---|
| Tablas BD vs documentadas en Sprint 0 | 7/7 (100%) | Supabase + Obsidian |
| Diagrama ER actualizado | ✓ | dbdiagram.io |
| Componentes React con SRP | 9/9 | Code review manual |
| Complejidad ciclomática máxima | <10 (target) | SonarCloud (pendiente run) |

### Métricas en código

| Métrica | Valor | Herramienta |
|---|---|---|
| Archivos TS/TSX | 28 | cloc |
| KLOC del Sprint | ~1.4 (1.400 LOC útiles) | cloc |
| Cobertura statements | 65.26% | Vitest v8 |
| Cobertura branches | 53.71% | Vitest v8 |
| Cobertura lines | 81.72% | Vitest v8 |
| Cobertura functions | 89.28% | Vitest v8 |
| Tests automatizados | 39 (10 archivos) | Vitest |
| Tests pasando | 39/39 (100%) | Vitest |

### Métricas clásicas (Pressman / Unidad II)

| Métrica | Valor |
|---|---|
| KLOC | ~1.4 |
| Productividad (KLOC / persona / sprint) | 0.28 KLOC/persona |
| Tasa de defectos detectados (issues GitHub) | A registrar (sprint vivo) |
| Tiempo de respuesta P95 (Locust) | A medir post-deploy con 500 usuarios |

### Proceso de medición (Goal → Question → Metric)

1. **Objetivo:** Validar que el agendamiento es rápido y seguro en producción
2. **Métrica:** Latencia P95 < 2 s; 0 vulnerabilidades críticas en Sonar; cobertura ≥ 60%
3. **Recolección:** Locust HTML report + SonarCloud + Vitest coverage
4. **Análisis:** Comparar contra umbral; identificar componentes con CC > 10
5. **Acción de mejora:** Documentar en este daily + tickets en Jira

---

## Marcos aplicados — Unidad II

- **ISTQB Foundation 2018** — tipos de prueba (funcional, integración, rendimiento), cobertura como métrica de control.
- **TMMi (Test Maturity Model integration)** — práctica de medición (nivel 3), trazabilidad US ↔ test, política de calidad documentada.
- **TQM (Total Quality Management)** — daily como ciclo de mejora continua, métricas del proceso recolectadas semanalmente, accionables al cierre del sprint.
- **ISO/IEC 25010** — características de calidad que estamos midiendo en Sprint 1: funcionalidad (US implementadas), fiabilidad (cobertura tests), eficiencia (Locust).

---

## Reflexiones

La inversión en Sprint 0 (documentación, wireframes, ADR) rindió: arrancar la semana ya con el SRS y el SQL definido nos permitió ir directamente a código sin discutir alcance. El stack es muy nuevo (React 19.2 + TS 6 salieron en los últimos meses), pero soportó el ritmo. La decisión de no construir backend propio y delegar todo a Supabase liberó tiempo que invertimos en pruebas y UX.

Aprendizaje clave: los tests con `vi.mock` requieren `vi.hoisted` cuando referencias variables externas. Documentado para el equipo en el próximo refinement.

Riesgo abierto para Sprint 2: RLS permisivo en Sprint 1 es deuda técnica conocida. No es de producción. El primer ticket del Sprint 2 endurece políticas por rol.

---

## Referencias

- [[Sprint 1 — Agendamiento de Citas]]
- [[Daily — Semana 1 — Sprint 0]] ← anterior
- [[Módulo 01 — Agendamiento de Citas]]
- Repo: https://github.com/MarianC-programing/Helios

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Calidad]]_
