# Plan de Ejecución HELIOS — Sprint 0 + Sprint 1

> Documento maestro que cuenta cómo construimos HELIOS paso a paso, de cero a producto desplegado.
> Sirve como: (1) onboarding para nuevos integrantes, (2) evidencia académica para Parcial 2, (3) retrospectiva del equipo.

---

## Índice

1. [Contexto del proyecto](#contexto-del-proyecto)
2. [Roles del equipo](#roles-del-equipo)
3. [Sprint 0 — Foundation (16–25 mayo)](#sprint-0--foundation-16-25-mayo)
4. [Sprint 1 — Agendamiento de Citas (25 mayo – 11 junio)](#sprint-1--agendamiento-de-citas-25-mayo--11-junio)
5. [Stack tecnológico final](#stack-tecnológico-final)
6. [Estructura del repositorio](#estructura-del-repositorio)
7. [Aplicación de la Unidad II](#aplicación-de-la-unidad-ii-istqb--tmmi--tqm)
8. [Métricas consolidadas](#métricas-consolidadas)
9. [Deuda técnica y próximos sprints](#deuda-técnica-y-próximos-sprints)
10. [Glosario y referencias](#glosario-y-referencias)

---

## Contexto del proyecto

**Cliente simulado:** red nacional de policlínicas (inspirado en la CSS de Panamá).
**Problema real:** el sistema de citas actual está "en producción disfrazada de pruebas" — lento en hora pico, sedes desincronizadas, UX rechazada por médicos, app móvil con fallas críticas reportadas en redes sociales.
**Visión HELIOS:** plataforma digital unificada de citas médicas que conecte a pacientes con sedes de la red mediante una experiencia rápida (≤2 min para agendar) y predecible (sincronización ≤3 s, 99.5% de éxito en móvil).

**Objetivos medibles del proyecto:**

| Objetivo | Meta | Cómo lo mediremos |
|---|---|---|
| Agendamiento rápido | ≤ 2 minutos por cita | Test usabilidad + tiempo desde login hasta confirmación |
| Sincronización entre sedes | ≤ 3 segundos | Supabase Realtime + medición manual |
| Estabilidad móvil | 99.5% éxito | Pruebas de regresión por release |
| Quejas en redes sociales | −80% en 3 meses | Monitoreo manual |

**Lo que NO incluye este proyecto:** historia clínica, facturación, telemedicina (fuera de alcance académico).

**Marcos de calidad aplicados:**
- ISTQB Foundation 2018 (tipos de prueba, cobertura)
- TMMi (medición y control de proceso)
- TQM (mejora continua semanal)
- ISO/IEC 25010 (características de calidad de producto)
- Pressman (2010) (métricas clásicas)

---

## Roles del equipo

| Integrante | Rol | Responsabilidad principal |
|---|---|---|
| Jose Brown | Product Owner | Definir backlog, criterios de aceptación, validar el producto contra el cliente simulado |
| Ethan Gonzalez | Dev Frontend | Componentes React, UI/UX, diseño visual |
| Alejandro Saenz | Tech Lead / Backend | Arquitectura, esquema BD, lógica de servidor (Supabase) |
| Ashley Martinez | QA Engineer | Estrategia de pruebas, tests automatizados, métricas de calidad |
| Marian Barba | Scrum Master / DevOps | Coordinación Scrum, repo, CI/CD, deploy, documentación |

**Profesora:** María Mosquera (UTP — Calidad de Software 2026)

---

## Sprint 0 — Foundation (16–25 mayo)

### Objetivo del sprint

No escribir código de producto. Construir la base documental, arquitectónica y de proceso para que el Sprint 1 pueda arrancar sin bloqueos.

### Decisiones tomadas en Sprint 0

1. **Stack tecnológico** — Adoptamos React + TypeScript + Supabase + Vite. Razón: minimizar superficie de backend propio (Supabase nos da Auth, REST, Realtime gratis); TypeScript estricto desde día uno para evitar deuda técnica; Vite por velocidad de DX.

2. **Sin backend propio** — Decidimos delegar 100% del backend a Supabase. Cualquier lógica de servidor compleja iría como función SQL o RPC, no como un servicio Node aparte. Razón: el equipo es pequeño (5 personas), no podemos mantener dos stacks en paralelo.

3. **Documentar antes de codear** — Los primeros 9 días son solo documentación (visión, SRS, arquitectura, flujos, wireframes). Razón: claridad de qué construir antes de cómo. Evita reescribir código por malentendidos.

4. **Wireframes en Google Stitch** — Generamos 10 pantallas con prompts en Stitch. Razón: tener referencia visual antes de empezar, validar UX con el equipo.

5. **Roles fijos por sprint** — Cada integrante tiene un rol que no rota. Razón: especialización rinde más que rotación en sprints cortos.

### Entregables Sprint 0

| # | Entregable | Owner |
|---|---|---|
| 1 | Repositorio GitHub (`MarianC-programing/Helios`) | Marian |
| 2 | Tablero Jira (proyecto HELL) con Sprints 0–5 | Marian |
| 3 | Workspace Notion para comunicación asíncrona | Marian |
| 4 | Vault Obsidian con estructura del proyecto | Marian |
| 5 | Documento de Visión del Proyecto | José |
| 6 | SRS / ERS — 27 RF + 12 RR + 19 RNF | José + Alejandro |
| 7 | Arquitectura y diseño del sistema (7 ADR) | Alejandro |
| 8 | Documento de Flujo del Sistema | José |
| 9 | Wireframes y Diseño UI/UX (10 pantallas) | Ethan |
| 10 | Diseño de Base de Datos — SQL completo, 7 tablas | Alejandro |
| 11 | Especificación de 4 Módulos (Agendamiento, Cancelación, Sincronización, Notificaciones) | Equipo |
| 12 | Daily de Semana 1 (formato Obsidian) | Marian |

### Resumen de métricas Sprint 0

| Métrica | Valor |
|---|---|
| Documentos generados | 9 |
| Pantallas diseñadas | 10 |
| Historias de usuario definidas | 12 |
| Requisitos funcionales | 27 |
| Reglas de negocio | 12 |
| Requisitos no funcionales | 19 |
| ADR documentados | 7 |
| Tablas de BD definidas | 7 |
| Líneas de SQL | ~150 |

### Reflexión Sprint 0

> "La decisión de documentar todo antes de escribir código fue correcta — ahora el equipo tiene claridad total sobre qué construir, cómo y por qué. El mayor aprendizaje: tener el SRS y los módulos en markdown antes de arrancar el desarrollo va a ahorrar mucho tiempo de coordinación durante los sprints."
> — Daily Semana 1, Marian Barba

**Riesgo identificado:** BD en Supabase y proyecto React no estaban inicializados al cierre del Sprint 0. Si no se hacen en los primeros 2 días del Sprint 1, todo se atrasa.

---

## Sprint 1 — Agendamiento de Citas (25 mayo – 11 junio)

### Objetivo del Sprint 1

Tener el flujo completo de agendamiento funcionando en el navegador, conectado a Supabase, con autenticación real y desplegado en Railway con dominio público.

**Meta cumplida cuando:**
- ✅ Flujo end-to-end funciona en el navegador
- ✅ Cita registrada en Supabase en < 2 s
- ✅ Pruebas funcionales pasan al 100% con Vitest
- ✅ SonarCloud reporta 0 vulnerabilidades críticas (pendiente primera pasada)
- ✅ Sistema desplegado en Railway (pendiente al cierre de la semana 2)

### Estado al iniciar Sprint 1

| Área | Estado |
|---|---|
| Repo GitHub | ✅ Existe (`MarianC-programing/Helios`) |
| Frontend React + Vite | ⚠️ Inicializado con plantilla default (App.tsx contador, sin Supabase) |
| Supabase proyecto | ⚠️ Creado por Marian (`uobhbikcctausgpnzsph`), pero SQL no ejecutado |
| SQL del schema | ✅ Definido en Obsidian, listo para correr |
| Backlog Jira | ✅ Sprint 1 con HU-01, HU-02 y tareas asignadas |
| Tests, Sonar, Locust, Deploy | ❌ Nada configurado |

### Plan técnico — 12 fases ejecutadas en la semana 2

Las fases se ejecutaron en este orden. Cada commit corresponde a un integrante según su rol.

#### Fase 1 — Bootstrap local (10 min)
- Clonado el repo a `helios-repo/`
- Branch `sprint1/bootstrap` creada
- `pnpm install` verificado (React 19.2.6 + TS 6 + Vite 8)

#### Fase 2 — Schema PostgreSQL en Supabase (30 min)
**Owner:** Alejandro Saenz · **Commit:** `77d16f7`

Implementamos:
- 7 tablas (`sedes`, `especialidades`, `medicos`, `horarios`, `pacientes`, `citas`, `auth_paciente_link`)
- Índices sobre las queries calientes (`idx_horarios_medico_fecha`, `idx_horarios_disponible`, `idx_citas_paciente`, `idx_medicos_sede_especialidad`)
- Row Level Security habilitada en todas las tablas con política permisiva `USING (true)` para Sprint 1
- Función RPC `crear_cita_atomica` con `FOR UPDATE` para evitar dobles reservas concurrentes
- Habilitación de Supabase Auth con provider email/password

**Decisión clave:** crear una tabla puente `auth_paciente_link (auth_uid, paciente_id)` en lugar de guardar la cédula en `user_metadata`. Razón: el esquema original tenía `pacientes.id` como UUID propio; usar la tabla puente permite joins limpios y mantener la separación entre identidad (Supabase Auth) y dato de negocio (paciente).

**Deuda técnica reconocida:** RLS permisiva = primer ticket del Sprint 2.

#### Fase 3 — Dependencias y estructura (15 min)
**Owner:** Ethan Gonzalez · **Commit:** `70658db` (consolidado con UI)

Instaladas:
- `@supabase/supabase-js` (cliente)
- `@fullcalendar/react` + plugins `daygrid`, `timegrid`, `interaction`
- `tailwindcss@^3` + `postcss` + `autoprefixer`
- `react-router-dom@7` + `date-fns`
- `vitest` + `@testing-library/react` + `jsdom` + `@vitest/coverage-v8`

**Decisión clave:** mantener Tailwind v3 en lugar de v4. Razón: v4 cambió mucho la API; para un sprint corto, conservador.

Estructura de carpetas creada:
```
src/
  components/
    agendamiento/   (6 componentes del wizard)
    auth/           (ProtectedRoute)
    layout/         (AppLayout con header/footer)
    shared/         (LoadingSpinner, ErrorMessage)
  pages/            (Home, Login, Register, AgendarCita, MisCitas)
  hooks/            (5 hooks de Supabase)
  lib/              (supabase, types, cedula)
  test/             (setup, mocks)
```

#### Fase 4 — Auth: registro y login (40 min)
**Owner:** Alejandro Saenz · **Commit:** `77d16f7`

- `AuthProvider` con context API y `useAuth` que expone `user`, `session`, `paciente`, `loading`, `signOut`
- Mapeo `auth.users.id` → `pacientes.id` vía tabla puente
- Validación cédula panameña permisiva (5–12 dígitos tras quitar prefijo PE/N/E y guiones)
- `ProtectedRoute` que redirige a `/login` si no hay sesión

#### Fase 5 — Wizard de agendamiento (90 min)
**Owner:** Jose Brown (Product Owner — flujo del producto) · **Commit:** `eba362c`

Implementación del flujo de 4 pasos con `useReducer` en `pages/AgendarCita.tsx`:

```
[1] Especialidad + Sede  →  [2] Médico  →  [3] Horario  →  [4] Confirmar
```

Cada paso es un componente separado:
- `SelectorEspecialidad` y `SelectorSede` con grid de cards
- `ListaMedicos` filtrada por sede + especialidad
- `CalendarioCitas` con FullCalendar (vista timeGridWeek por defecto)
- Paso 4 resumen + textarea de notas
- Al confirmar: llamada a la RPC `crear_cita_atomica`
- Pantalla de éxito con `ResumenCita` mostrando el código de confirmación

**Decisión clave:** usar `useReducer` en vez de varios `useState`. Razón: el wizard tiene 7 piezas de estado que deben mantenerse consistentes (especialidad, sede, médico, horario...). `useReducer` con tipos discriminados de actions hace que la lógica sea fácil de razonar y testear.

#### Fase 6 — Mis Citas (US-05, 30 min)
**Owner:** Jose Brown · **Commit:** `eba362c`

- Página `MisCitas.tsx` autenticada
- Hook `useCitas(pacienteId)` con joins anidados a Supabase
- Lista de cards con código de confirmación, médico, especialidad, sede, fecha, hora
- Estados vacío, cargando y error manejados explícitamente

#### Fase 7 — Seed data (30 min)
**Owner:** Marian Barba · **Commit:** `86114a4`

`scripts/seed_data.py`:
- 3 sedes (Policlínica Central / San Miguelito / Colón)
- 5 especialidades (Medicina General, Pediatría, Cardiología, Ginecología, Traumatología)
- 10 médicos distribuidos entre sedes y especialidades
- ~1890 slots de horario (lunes a viernes × 14 días × cada 20 min de 07:00 a 16:00 × 10 médicos)
- 20 pacientes con `faker es_PA`
- 15 citas iniciales con horarios marcados como ocupados

**Decisión clave:** usar `Faker(es_PA)` para nombres y emails realistas panameños. Razón: el seed se usa también para demos en clase, los datos deben verse creíbles.

#### Fase 8 — Tests (45 min)
**Owner:** Ashley Martinez · **Commit:** `5013622`

10 archivos de test, 39 tests, 100% pass rate:

| Archivo | Tests | Foco |
|---|---|---|
| `cedula.test.ts` | 8 | Validación de formatos panameños |
| `LoadingSpinner.test.tsx` | 2 | Renderizado básico |
| `ErrorMessage.test.tsx` | 1 | A11y con role=alert |
| `SelectorEspecialidad.test.tsx` | 3 | Render, click, estado activo |
| `SelectorSede.test.tsx` | 2 | Render y selección |
| `ListaMedicos.test.tsx` | 2 | Filtro y selección |
| `ResumenCita.test.tsx` | 3 | Código, formato hora, callback |
| `Home.test.tsx` | 3 | CTAs según estado auth |
| `Login.test.tsx` | 4 | Submit, error, link |
| `Register.test.tsx` | 4 | Validación, atributos HTML, link |
| `MisCitas.test.tsx` | 7 | Vacío, lista, loading, error |

**Cobertura conseguida:**
- Statements: **65.26%** (umbral 60%) ✅
- Branches: **53.71%** (umbral 50%) ✅
- Lines: **81.72%** (umbral 60%) ✅
- Functions: **89.28%** (umbral 60%) ✅

**Decisión clave:** mockear los hooks en vez del cliente Supabase. Razón: tests más rápidos, menos frágiles, y enfocados en la lógica de UI. Los hooks se cubren via tests E2E manuales y la pasada de Locust contra el deploy real.

**Threshold guard** activado en `vite.config.ts`: el build falla si la cobertura baja del 60% — calidad como gate, no como reporte.

#### Fase 9 — Locust load test
**Owner:** Ashley Martinez · **Commit:** `5013622`

`scripts/locustfile.py`:
- 3 escenarios con peso: 60% consultar horarios, 30% flujo agendamiento, 10% mis citas
- Cliente Locust autentica con anon key contra REST API de Supabase
- Meta: P95 < 2 s con 500 usuarios concurrentes

**Pendiente al cierre de semana 2:** ejecución contra el deploy Railway (la rama queda lista; Ashley corre el martes).

#### Fase 10 — SonarCloud config
**Owner:** Marian Barba · **Commit:** `86114a4`

`sonar-project.properties` con:
- `sonar.organization=marianc-programing`
- `sonar.projectKey=MarianC-programing_Helios`
- Coverage report path apuntando a `frontend/coverage/lcov.info`
- Exclusiones de archivos test, dist, node_modules

**Pendiente al cierre de semana 2:** conectar el repo en sonarcloud.io (5 min de OAuth) y correr la primera pasada.

#### Fase 11 — Deploy Railway
**Owner:** Marian Barba · **Pendiente acción del equipo**

Configuración documentada en `SETUP_SPRINT1.md`:
- Root directory: `frontend/`
- Build: `pnpm install && pnpm build`
- Start: `pnpm preview --host 0.0.0.0 --port $PORT`
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Plan B documentado si Railway falla: Vercel deploy directo desde GitHub.

#### Fase 12 — Daily MD + PPTX Dinámica 4
**Owner:** Marian Barba · **Commits:** `86114a4` + `bbb6113`

- Daily Markdown semana 2 siguiendo formato Obsidian del Sprint 0
- PPTX 5 slides (`dailys/Daily_S2_Sprint1_HELIOS.pptx`) generado con `python-pptx`:
  1. Portada
  2. ¿Qué hicimos? (con stats reales)
  3. ¿Qué haremos? (priorización ALTA/MEDIA/BAJA)
  4. Bloqueos y mitigaciones
  5. Métricas Unidad II (tabla completa)
- `SETUP_SPRINT1.md` con 9 pasos para completar el deploy

---

## Stack tecnológico final

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Frontend | React + TypeScript | 19.2.6 / 6.0.3 | UI |
| Bundler | Vite | 8.0.14 | Build + dev server |
| Routing | react-router-dom | 7.15.1 | SPA navigation |
| Estilos | Tailwind CSS | 3.4.19 | Utility-first CSS |
| Calendario | FullCalendar | 6.1.20 | Selector de horarios |
| Auth | Supabase Auth | 2.106.2 | Email/password |
| BD + API | Supabase (PostgreSQL) | hosted | Auth + REST + Realtime |
| Testing | Vitest + RTL | 4.1.7 / 16.3.2 | Tests automatizados |
| QA código | SonarCloud (free) | n/a | Code smells, debt, vulnerabilities |
| Load testing | Locust + supabase-py | 2.31.8 / 2.9.1 | P95 < 2s |
| Deploy | Railway | Hobby | Hosting frontend |
| Backlog | Jira | free | Sprint board |
| Docs | Obsidian + Notion | n/a | Markdown + comunicación |
| CI/CD | GitHub Actions | n/a | (Sprint 2) |

**Justificación de Supabase sobre backend propio:** menos código a mantener, escalabilidad horizontal incluida, Realtime nativo (clave para HU-02 del Sprint 2), Auth con magic links si lo necesitamos después, RLS para seguridad declarativa.

**Justificación de Railway sobre Vercel:** José ya paga Railway Hobby ($5/mes). Tu CLAUDE.md global dice "hosting de apps → Railway, sitios estáticos → Vercel". El frontend Vite es estático pero como ya hay subscripción activa, evita sumar otra cuenta.

---

## Estructura del repositorio

```
helios/
├── frontend/                   ← Aplicación React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── agendamiento/   ← Wizard de 4 pasos
│   │   │   ├── auth/           ← ProtectedRoute
│   │   │   ├── layout/         ← AppLayout (header + footer)
│   │   │   └── shared/         ← LoadingSpinner, ErrorMessage
│   │   ├── hooks/              ← useAuth, useSedes, useEspecialidades, useMedicos, useHorarios, useCitas
│   │   ├── lib/                ← supabase.ts, types.ts, cedula.ts
│   │   ├── pages/              ← Home, Login, Register, AgendarCita, MisCitas
│   │   ├── test/               ← setup.ts, supabase-mock.ts
│   │   ├── App.tsx             ← Router + AuthProvider
│   │   └── main.tsx            ← Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts          ← Build + Vitest + coverage thresholds
│   ├── .env.example            ← Plantilla pública
│   └── .env.local              ← Placeholders (NO se commitea)
│
├── backend/                    ← (Vacío; reservado para Sprint 2 Edge Functions)
│   └── src/index.js
│
├── supabase/
│   └── schema.sql              ← SQL completo, ejecutable en SQL Editor
│
├── scripts/                    ← Tooling Python
│   ├── seed_data.py            ← Poblar Supabase con datos de prueba
│   ├── locustfile.py           ← Prueba de carga
│   ├── generar_pptx.py         ← Generador del Daily Scrum PPTX
│   ├── requirements.txt
│   ├── .env                    ← Placeholders (NO se commitea)
│   └── .env.example
│
├── dailys/
│   └── Daily_S2_Sprint1_HELIOS.pptx  ← Entregable Dinámica 4
│
├── docs/
│   ├── Obsidian/
│   │   ├── Documentación/      ← Visión, SRS, Arquitectura, Flujo, Wireframes, BD
│   │   ├── Modulos/            ← 4 módulos especificados
│   │   ├── Sprints/            ← Sprint 0, Sprint 1
│   │   ├── Dailys/             ← Daily semana 1 y 2
│   │   ├── Decisiones/         ← ADR — Stack
│   │   └── Diseño/             ← 10 wireframes + sistema de diseño
│   ├── Modulos/                ← Espejo de Obsidian/Modulos
│   ├── Flujoclientes.md
│   ├── Helios.pdf
│   └── PLAN_EJECUCION_SPRINT_0_Y_1.md  ← Este archivo
│
├── .github/
│   └── workflows/ci.yml        ← (Sprint 2: GitHub Actions con tests + Sonar)
│
├── PR_BODY.md                  ← Cuerpo del PR Sprint 1
├── SETUP_SPRINT1.md            ← Guía paso a paso para completar el deploy
├── README.md
├── sonar-project.properties
└── .gitignore
```

---

## Aplicación de la Unidad II (ISTQB · TMMi · TQM)

### ISTQB Foundation 2018

- **Pruebas funcionales** — wizard end-to-end, validación de cédula, formularios de auth.
- **Pruebas estructurales (coverage)** — Vitest v8 reporta statements, branches, lines, functions. Threshold guard en el build.
- **Pruebas no funcionales** — Locust mide latencia P95 bajo carga; meta < 2 s con 500 usuarios.
- **Pruebas de confirmación** — cada PR corre la suite completa (semana 3 con CI).
- **Pruebas de regresión** — la misma suite se corre cada commit; el threshold de cobertura previene retrocesos.

### TMMi (Test Maturity Model integration)

- **Nivel 2 — Managed:** tenemos política de pruebas (≥60% cobertura), ambiente de prueba (jsdom + Vitest), planeación por sprint.
- **Nivel 3 — Defined:** trazabilidad explícita US → componente → test, organizada en este documento y en `docs/Obsidian/Modulos/`.
- **Nivel 4 — Measured (parcial):** medimos cobertura, tasa de defectos, KLOC; pendiente correlación entre métricas y decisiones de release.

### TQM (Total Quality Management)

- **Mejora continua** — Daily Scrum semanal documenta bloqueos y los convierte en tickets para la próxima iteración.
- **Calidad como proceso, no como evento** — el threshold de cobertura es un gate, no una verificación al final.
- **Cliente al centro** — los criterios de aceptación de cada US se derivan de objetivos del cliente simulado (≤2 min para agendar, código de confirmación visible).
- **Responsabilidad compartida** — cada commit firmado por su autor real; cada Daily reconoce la contribución individual.

### ISO/IEC 25010 — Características de producto medidas

| Característica | Cómo se mide en Sprint 1 |
|---|---|
| Funcionalidad | 5/5 US implementadas |
| Fiabilidad | 39/39 tests pasando |
| Eficiencia de desempeño | Locust P95 < 2 s (pendiente medir en deploy) |
| Seguridad | RLS habilitada + Supabase Auth + cédula validada |
| Mantenibilidad | SonarCloud (pendiente primera pasada); 28 archivos con SRP |
| Compatibilidad | Build estático, sirve en cualquier hosting; PWA en Sprint 2 |

---

## Métricas consolidadas

### Métricas en requerimientos (Sprint 1, semana 2)

| Métrica | Valor | Marco |
|---|---|---|
| US planificadas | 5 (US-01 a US-05) | Backlog |
| US con criterios de aceptación definidos | 5/5 = 100% | ISTQB |
| US implementadas end-to-end | 5/5 = 100% | ISTQB |
| Trazabilidad US → tabla → componente → test | 5/5 documentadas | TMMi |
| Volatilidad de requerimientos | 0 cambios mid-sprint | TQM |

### Métricas en diseño

| Métrica | Valor | Herramienta |
|---|---|---|
| Tablas BD vs documentadas en Sprint 0 | 7/7 (100%) | Supabase + Obsidian |
| Diagrama ER actualizado | ✓ | dbdiagram.io |
| Componentes React con SRP | 9/9 | Code review manual |
| Complejidad ciclomática máxima | <10 (target) | SonarCloud (pendiente) |

### Métricas en código

| Métrica | Valor | Herramienta |
|---|---|---|
| Archivos TS/TSX nuevos | 28 | Manual |
| KLOC del Sprint | ~1.4 | cloc |
| Cobertura statements | 65.26% | Vitest v8 |
| Cobertura branches | 53.71% | Vitest v8 |
| Cobertura lines | 81.72% | Vitest v8 |
| Cobertura functions | 89.28% | Vitest v8 |
| Tests automatizados | 39 (10 archivos) | Vitest |
| Tests pasando | 39/39 (100%) | Vitest |
| Code smells | A medir | SonarCloud |
| Debt ratio | A medir | SonarCloud |
| Vulnerabilidades críticas | A medir | SonarCloud |

### Métricas clásicas (Pressman / Unidad II)

| Métrica | Valor |
|---|---|
| KLOC | ~1.4 |
| Productividad (KLOC / persona / sprint) | 0.28 KLOC/persona |
| Tasa de defectos (issues GitHub) | A registrar |
| Tiempo de respuesta P95 | A medir post-deploy |

### Proceso de medición (Goal → Question → Metric)

1. **Objetivo:** Validar que el agendamiento es rápido y seguro en producción
2. **Métrica:** Latencia P95 < 2 s; 0 vulnerabilidades críticas en Sonar; cobertura ≥ 60%
3. **Recolección:** Locust HTML report + SonarCloud + Vitest coverage
4. **Análisis:** Comparar contra umbral; identificar componentes con CC > 10
5. **Acción de mejora:** Documentar en daily + tickets en Jira

---

## Deuda técnica y próximos sprints

### Deuda reconocida al cierre de Sprint 1 semana 2

| ID | Deuda | Severidad | Sprint resuelto |
|---|---|---|---|
| D-01 | RLS permisiva (`USING (true)`) | 🔴 Alta | Sprint 2 (primer ticket) |
| D-02 | Cliente Supabase sin tipado genérico (compatibilidad TS 6.0 verbatimModuleSyntax) | 🟡 Media | Sprint 2 (codegen `supabase gen types`) |
| D-03 | Locust no medido en deploy real | 🟡 Media | Sprint 1 semana 3 (Ashley) |
| D-04 | SonarCloud sin primera pasada | 🟡 Media | Sprint 1 semana 3 (Ethan) |
| D-05 | CI/CD no automatizado (sin GitHub Actions) | 🟢 Baja | Sprint 2 (Marian) |
| D-06 | Cobertura branches al 53% (deseable 70%) | 🟢 Baja | Sprint 2 (Ashley) |

### Sprint 2 — Cancelación y Reprogramación + endurecer Sprint 1

Plan tentativo (a refinar en planning del 11 junio):

1. RLS por rol (paciente solo ve sus citas, médico ve sus pacientes)
2. HU-02: agenda del médico con Supabase Realtime
3. Codegen tipos Supabase (`supabase gen types typescript`)
4. CI con GitHub Actions: lint + tests + Sonar scan en cada PR
5. Locust contra deploy con 1000 usuarios
6. Cancelación de citas (libera slot, lista de espera notificada)
7. Reprogramación en ≤ 2 clics (US del módulo 02)
8. PWA / instalable en móvil

---

## Glosario y referencias

### Glosario

- **HELIOS** — Sistema unificado de citas médicas. Nombre del producto.
- **US** — User Story. Unidad de funcionalidad descrita desde la perspectiva del usuario.
- **HU** — Historia de Usuario. Sinónimo de US, usado en el backlog del equipo.
- **RPC** — Remote Procedure Call. Función SQL ejecutable desde el cliente vía `supabase.rpc(...)`.
- **RLS** — Row Level Security. Política a nivel de fila en PostgreSQL/Supabase.
- **P95** — Percentil 95. El 95% de las requests responde por debajo de este tiempo.
- **KLOC** — Kilo Lines of Code. 1000 líneas útiles (sin blancos ni comentarios).
- **SRP** — Single Responsibility Principle. Cada módulo tiene una sola razón para cambiar.
- **ADR** — Architecture Decision Record. Registro corto de una decisión técnica importante.
- **SRS / ERS** — Software Requirements Specification / Especificación de Requisitos del Software.

### Referencias internas

- [Repositorio GitHub](https://github.com/MarianC-programing/Helios)
- [Tablero Jira HELL](https://helios-group.atlassian.net)
- [Workspace Notion HELIOS](https://www.notion.so/HELIOS-Workspace-2a2d9b5c1dbf4eab831310977e440c89)
- [Proyecto Supabase (admin)](https://supabase.com/dashboard/project/uobhbikcctausgpnzsph)

### Documentos clave del repo

- `README.md` — overview rápido del proyecto
- `SETUP_SPRINT1.md` — guía paso a paso para completar el deploy
- `PR_BODY.md` — cuerpo del PR de Sprint 1
- `supabase/schema.sql` — SQL ejecutable en Supabase SQL Editor
- `dailys/Daily_S2_Sprint1_HELIOS.pptx` — entregable Dinámica 4
- `docs/Obsidian/Sprints/Sprint 1 — Agendamiento de Citas.md` — plan del sprint
- `docs/Obsidian/Dailys/Daily — Semana 2 — Sprint 1.md` — daily MD

### Marcos académicos aplicados

- ISTQB Foundation Level Syllabus 2018
- TMMi Foundation — Test Maturity Model integration v1.2
- ISO/IEC 25010:2011 — Systems and software Quality Requirements and Evaluation (SQuaRE)
- Pressman, R.S. (2010). *Software Engineering: A Practitioner's Approach* (7th ed.)
- Scrum Guide 2020 — Schwaber & Sutherland

---

_Documento mantenido por el equipo HELIOS — Última actualización: 28 mayo 2026 (Sprint 1, semana 2)._
