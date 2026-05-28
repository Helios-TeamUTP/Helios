# 📚 MEMORIA FINAL — Sprint 1 HELIOS

> **Documento de cierre del Sprint 1** · Calidad de Software · UTP 2026
>
> **Periodo:** 2026-05-12 al 2026-05-28 (2 semanas + ajustes)
> **Estado:** ✅ CERRADO — Demo entregada el viernes 29 de mayo
> **Producción:** https://helios-web-production.up.railway.app

---

## 1. Resumen ejecutivo

HELIOS es el sistema unificado de citas médicas del Grupo HELIOS, simulando una red de policlínicas. El Sprint 1 entregó:

- **Agendamiento end-to-end** de citas en 4 pasos (especialidad → médico → calendario → confirmación)
- **Dashboard médico** completo con agenda diaria, historial y gestión de citas
- **Seguridad multicapa** con Row Level Security (RLS) por rol en base de datos
- **Vista móvil responsive** del calendario
- **Flow de registro→login automático** que crea el paciente en BD sin pasos manuales

El Sprint involucró 5 integrantes, 2 semanas de desarrollo, 20 bugs detectados y resueltos en uso real, y 65 tests automatizados. Producción estable con latencia P95 de 300 ms con 200 usuarios concurrentes.

---

## 2. Equipo y roles

| Nombre | Rol | Responsabilidad principal |
|---|---|---|
| **José Brown** | Product Owner | Definir requerimientos, validar deploys, priorizar backlog |
| **Ethan Gonzalez** | Dev Frontend | Componentes React, hooks, integración Supabase |
| **Alejandro Saenz** | Tech Lead | Arquitectura, decisiones técnicas, backend SQL |
| **Ashley Martinez** | QA Engineer | Pruebas funcionales, casos de prueba, demo |
| **Marian Barba** | Scrum Master / DevOps | Coordinación, deploys, ceremonias Scrum |

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + TypeScript | 19 / 6 |
| Bundler | Vite | 8 |
| Estilos | Tailwind CSS | 3 |
| Backend (BaaS) | Supabase | 2 |
| Base de datos | PostgreSQL | (vía Supabase) |
| Routing | React Router | 7 |
| Calendario | FullCalendar | 6 |
| Testing | Vitest + React Testing Library | 4.1 |
| Pruebas de carga | Locust | 2.x |
| Hosting | Railway | Hobby plan |
| Repositorio | GitHub | MarianC-programing/Helios |

---

## 4. User Stories entregadas

### US-01: Seleccionar especialidad y sede ✅
**Como** paciente, **quiero** seleccionar especialidad y sede, **para** filtrar médicos disponibles.

### US-02: Ver médicos disponibles ✅
**Como** paciente, **quiero** ver los médicos disponibles, **para** elegir con quién agendar.

### US-03: Ver calendario de horarios disponibles ✅
**Como** paciente, **quiero** ver un calendario con slots, **para** elegir día y hora.

### US-04: Confirmar la cita ✅
**Como** paciente, **quiero** ingresar mis datos y confirmar, **para** quedar registrado.

### US-05: Ver mis citas ✅
**Como** paciente, **quiero** consultar mis citas, **para** recordar detalles.

**Funcionalidades adicionales no planificadas (entregadas igual):**
- Dashboard médico completo (agenda, marcar estados, historial)
- Vista móvil responsive del calendario
- Flow registro→login automático con paciente

---

## 5. Defectos resueltos (20 bugs)

| ID | Patrón / síntoma | Severidad | Detectado por |
|---|---|---|---|
| B-01 | Regex cédula muy estricto | Media | Tests |
| B-02 | vi.mock con vars externas | Baja | Tests |
| B-03 | Faker locale es_PA inexistente | Baja | Seed |
| B-04 | Auth sin paciente → form vacío | Alta | PO (Marian) |
| B-05 | NavLinks no responden | Media | PO |
| B-06 | Seed destructivo | Crítica | Producción |
| B-07 | useAuth loading infinito | Crítica | PO |
| B-08 | 5 hooks de datos sin try/catch | Alta | Code review |
| B-09 | localStorage para auth (sesión persistente entre tabs) | Media | PO |
| B-10 | Login/Register spinner eterno si Supabase tarda | Alta | PO |
| B-11 | "Verificando sesión..." eterno tras F5 | Crítica | PO |
| B-12 | Spinner ~10s por 2 queries serializadas | Alta | PO |
| B-13 | Sprint 1 sin pantalla para médicos | Alta (feature gap) | PO |
| B-14 | RLS permisiva por defecto | Crítica (seguridad) | Code review |
| B-15 | Spinner >10s por RLS sin índice | Alta | PO |
| B-16 | Flash "Completa tu perfil" en loading | Media | PO |
| B-17 | F5 lento + flash si loadPerfil falla | Alta | PO |
| B-18 | Calendario ilegible en móvil | Alta (UX) | PO |
| B-19 | signUp session=null → paciente huérfano | Crítica | PO |
| B-20/.1/.2/.3 | Race React closure tras signIn (4 iteraciones) | Crítica | PO |

**Tasa de defectos:** 20 bugs / 2.3 KLOC = **8.70 bugs/KLOC** (rango profesional 5-10).

### El bug más complejo: B-20

Requirió 4 iteraciones para encontrar la causa raíz real:

- **B-20:** Separar registro de login (signUp + sessionStorage + redirect a /login)
- **B-20.1:** signOut tras signUp para evitar auto-login que mostraba "Completa tu perfil"
- **B-20.2:** Polling getSession + errores visibles en pantalla (para diagnóstico)
- **B-20.3:** FIX DEFINITIVO — mover `completarRegistroPendiente` DENTRO de `useAuth.onAuthStateChange` (corre secuencial antes de loadPerfil; sin race con setSession de React state)

**Causa raíz real:** El `refreshPerfil` con `useCallback` y dep `session?.user?.id` veía `null` porque `setSession` del listener aún no se había propagado al state de React. Solo con la pista del PO (*"si cierro sesión y vuelvo a entrar funciona"*) se identificó.

Demuestra **el valor del feedback de usuario real vs solo tests automatizados**.

---

## 6. Métricas finales

### Calidad de código

| Métrica | Valor | Meta |
|---|---|---|
| Tests automatizados | 65/65 ✅ | ≥39 |
| Cobertura statements | 61.4% | ≥60% |
| Cobertura lines | 82% | ≥60% |
| Cobertura functions | 90.9% | ≥60% |
| Build status | ✅ limpio | sin errores |

### Performance

| Métrica | Valor | Meta |
|---|---|---|
| Latencia P95 | 300 ms | <2000 ms |
| Usuarios concurrentes probados | 200 | 500 (Sprint 2) |
| Tiempo de F5 tras índice B-15 | <2 s | <2 s |

### Esfuerzo

| Métrica | Valor |
|---|---|
| Story Points planificados | 53 |
| Story Points completados | 37 (70%) |
| Story Points en progreso | 5 |
| Story Points pendientes | 11 (pasan a Sprint 2) |
| Deploys producción | ~30 en total, 2/día promedio |
| Commits firmados | 9 |

### Trazabilidad

| Métrica | Valor |
|---|---|
| Bugs detectados | 20 |
| Bugs resueltos | 20 |
| Bugs pendientes | 0 |
| Cobertura con test de regresión | 100% (cada bug → su test) |

---

## 7. Marco de calidad aplicado

### ISTQB (estándar internacional)
- Pruebas automatizadas en cada deploy
- Cobertura medible y monitoreada
- Defectos trazables con ID, causa, fix
- Pruebas de carga con métricas de latencia

### TMMi — Madurez del proceso (Nivel 2: Gestionado)
- ✅ Política de pruebas documentada (CLAUDE.md)
- ✅ Plan de pruebas trazable (cada bug → test de regresión)
- ✅ Métricas registradas por sprint
- ✅ Code review obligatorio antes de merge
- ✅ Threshold automático en CI (≥60% cobertura)
- 🎯 Camino a Nivel 3 (Sprint 2): optimización formal con métricas estadísticas

### TQM — Mejora continua
- ✅ PO prueba deploy real antes de cada demo
- ✅ Bugs detectados en vivo se arreglan en la misma sesión
- ✅ Cada bug genera test de regresión
- ✅ Plan Mode obligatorio antes de tocar código
- ✅ Documentación viva (CLAUDE.md, decisiones registradas)
- ✅ Honestidad: deudas técnicas reconocidas en roadmap

---

## 8. Herramientas usadas

| Herramienta | Tipo | Para qué |
|---|---|---|
| GitHub | Plataforma | Repositorio de código, control de versiones, 9 commits firmados |
| Jira | Plataforma | Tablero Kanban con 21 issues |
| Vitest | CLI (npm) | Ejecuta 65 tests automatizados |
| Locust | CLI (Python) | Simula 200 usuarios para pruebas de carga |
| Supabase | Cloud service | BD PostgreSQL + Auth + API REST |
| Railway | Cloud hosting | Deploy CI automático desde GitHub |

---

## 9. Arquitectura

### Frontend (React + TypeScript)

```
frontend/src/
├── components/
│   ├── agendamiento/    ← Wizard 4 pasos + lista mobile
│   ├── auth/            ← ProtectedRoute con requireRole
│   ├── layout/          ← AppLayout con nav por rol
│   ├── medico/          ← Dashboard de médico
│   └── shared/          ← LoadingSpinner, ErrorMessage
├── hooks/               ← useAuth, useCitas, useMedicoCitas, useIsMobile, etc.
├── lib/                 ← supabase, types, cedula, withTimeout
├── pages/               ← Home, Login, Register, AgendarCita, MisCitas, MedicoDashboard
└── test/                ← setup + supabase-mock
```

### Base de datos (Supabase / PostgreSQL)

**6 tablas principales:**
- `sedes` — policlínicas de la red
- `especialidades` — especialidades médicas
- `medicos` — médicos con especialidad + sede
- `horarios` — slots disponibles por médico
- `pacientes` — datos de pacientes
- `citas` — citas agendadas (tabla central)

**3 tablas de vinculación auth:**
- `auth_paciente_link` — vincula auth.users → pacientes
- `auth_medico_link` — vincula auth.users → medicos

**1 función RPC atómica:**
- `crear_cita_atomica` — garantiza que dos pacientes no reserven el mismo horario simultáneamente

**RLS estricto por rol en todas las tablas críticas.**

---

## 10. Deploys importantes del Sprint 1

| Fecha | Commit | Descripción |
|---|---|---|
| 2026-05-15 | bbd2ff4 | Fix seed destructivo |
| 2026-05-17 | a5e1021 | useAuth loading infinito |
| 2026-05-19 | db6105c | Bug B-10 withTimeout en Login/Register |
| 2026-05-21 | cba7a38 | Bug B-11 timeout useAuth |
| 2026-05-23 | 1d24011 | Bug B-13+B-14 Dashboard médico + RLS |
| 2026-05-25 | b9d184a | Bug B-15+B-16 índice RLS + UX |
| 2026-05-27 | dbb0f8c | Bug B-17 doble loadPerfil |
| 2026-05-27 | 9dee8cb | Bug B-18 calendario móvil |
| 2026-05-28 | 055b22e | Bug B-19 garantizar sesión |
| 2026-05-28 | 12b5a9f | Bug B-20 separar register/login |
| 2026-05-28 | 1e8c3ae | Bug B-20.1 signOut tras signUp |
| 2026-05-28 | e3dcea5 | Bug B-20.2 polling JWT + errores visibles |
| 2026-05-28 | eef45ad | **Bug B-20.3 FIX DEFINITIVO** |
| 2026-05-28 | 0cfc5b0 | Docs B-20 cadena completa |

---

## 11. Lecciones aprendidas

### Técnicas

1. **El proceso obligatorio (CLAUDE.md) sí funciona.** Cada bug crítico se cazó en <1 día gracias a la disciplina Plan → Code → Review → Tests → Deploy.

2. **El feedback del PO en uso real es irremplazable.** El bug B-20 (race React closure) solo se detectó con la pista del PO ("si cierro sesión y vuelvo a entrar funciona"). Tests automatizados no lo hubieran encontrado.

3. **Cuando un bug requiere 4 iteraciones, el problema es de diagnóstico, no de código.** Cada iteración nos acercó más a la causa raíz real (que era arquitectónica, no de implementación).

4. **Race conditions en React son sutiles.** `useCallback` con dependencias capturadas + `setState` asíncrono pueden crear bugs que solo se ven en producción.

5. **RLS sin índice es un cuello de botella oculto.** B-15 demostró que policies que parecen simples pueden hacer full table scans devastadores.

### De equipo

1. **Code review obligatorio bloqueó bugs antes del PO.** El agente revisor identificó el C-1 de B-20 antes de ir a producción.

2. **Documentación viva (CLAUDE.md) evita repetir errores.** Cada bug nuevo se compara con la tabla histórica.

3. **Honestidad técnica > impresionar.** Reconocer 20 bugs y la cadena B-20.1/.2/.3 es más profesional que ocultar.

---

## 12. Deudas técnicas reconocidas (al cierre)

1. **Email de confirmación de cuenta** — no implementado (requiere SMTP en Supabase)
2. **MFA (autenticación de doble factor)** — no implementado
3. **Monitoreo de errores en producción** — sin Sentry / equivalente
4. **Logging estructurado** — solo console.error/log básico
5. **Cancelación / reprogramación de citas** — features del Sprint 2 (no Sprint 1)
6. **Notificaciones (email/push)** — no implementadas (Sprint 2)
7. **Pruebas E2E (Playwright/Cypress)** — solo unit + integration tests
8. **Locust a 500 usuarios** — actualmente probado con 200

---

## 13. Métricas categorizadas (slide 7 del demo)

| Categoría | Valor |
|---|---|
| **Requerimientos** | 5 US (US-01 a US-05), 100% completadas |
| **Diseño** | 9 componentes · 6 tablas SQL · 1 RPC atómica |
| **Código** | 2.3 KLOC · 600 LOC tests · 9 commits firmados |
| **Defectos** | 20 bugs cazados · 20 resueltos · 8.70 bugs/KLOC |
| **Esfuerzo** | 53 SP · 37 completados · 5 en progreso |
| **Productividad** | 0.28 KLOC/persona · 2 deploys/día |

---

## 14. Sprint 2 — Siguiente sprint

Ver documento separado: [`PLAN_SPRINT_2.md`](./PLAN_SPRINT_2.md)

**Tema principal:** Cancelación, reprogramación + notificaciones + hardening.

---

## 15. Cierre

Sprint 1 entregó **MVP funcional en producción**, con:

- Flow end-to-end de agendamiento operativo
- Dashboard médico funcional
- Seguridad multicapa
- 65 tests automatizados
- 20 bugs documentados y resueltos
- Documentación viva
- Equipo coordinado bajo proceso obligatorio

**Demo viernes 29 lista para defender ante la profesora.** Material en `dailys/Entrega_Viernes/`.

---

_Documento generado al cierre del Sprint 1, 2026-05-28._
