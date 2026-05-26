# Sprint 1 — Setup + Wizard Agendamiento + QA

Primera entrega funcional del Sprint 1 (semana del 25 al 28 mayo).
Cubre las 5 user stories del módulo de Agendamiento, suite de pruebas con cobertura sobre el umbral, y la dinámica semanal Parcial 2.

---

## Qué cierra esta PR

### Features (HU-01 + US-01..US-05)
- ✅ Selector de Especialidad y Sede con datos de Supabase
- ✅ Lista de Médicos filtrada por sede + especialidad
- ✅ Calendario de horarios disponibles (FullCalendar)
- ✅ Formulario de confirmación con cédula panameña validada
- ✅ Página "Mis Citas" con joins a horarios, médicos y sedes
- ✅ Autenticación email/password (Supabase Auth) + tabla puente `auth_paciente_link`
- ✅ Rutas protegidas y layout responsive con identidad HELIOS (teal #0A8478)

### Backend
- ✅ Schema PostgreSQL completo (7 tablas + índices + RLS)
- ✅ RPC `crear_cita_atomica` para evitar dobles reservas (FOR UPDATE)
- ✅ Cliente Supabase + tipos TS

### Calidad (Unidad II — ISTQB / TMMi / TQM)
- ✅ 39 tests Vitest, 100% pasando
- ✅ Cobertura: 65.26% statements · 53.71% branches · 81.72% lines · 89.28% functions
- ✅ Threshold guard en `vite.config.ts` (build falla si baja de 60%)
- ✅ `sonar-project.properties` listo para conectar SonarCloud
- ✅ `scripts/locustfile.py` con 3 escenarios para prueba de carga

### Datos y DevOps
- ✅ `scripts/seed_data.py` (3 sedes + 5 especialidades + 10 médicos + ~1890 slots + 20 pacientes + 15 citas)
- ✅ `dailys/Daily_S2_Sprint1_HELIOS.pptx` (5 slides — entregable Dinámica 4 Semanal)
- ✅ `docs/Obsidian/Dailys/Daily — Semana 2 — Sprint 1.md` (formato compatible con Sprint 0)
- ✅ `SETUP_SPRINT1.md` con pasos para Supabase + Railway + Sonar

---

## Distribución de commits por integrante (Daily Scrum evidence)

| Commit | Autor | Responsabilidad |
|---|---|---|
| `77d16f7` | Alejandro Saenz (Tech Lead) | Schema PostgreSQL + RPC + RLS + cliente Supabase + AuthProvider |
| `70658db` | Ethan Gonzalez (Dev Frontend) | Tailwind + layout + componentes UI + páginas Login/Register/Home |
| `eba362c` | Jose Brown (Product Owner) | Wizard 4 pasos con `useReducer` + página Mis Citas + 5 hooks de Supabase |
| `5013622` | Ashley Martinez (QA) | 39 tests Vitest + Locust + threshold de cobertura |
| `86114a4` | Marian Barba (Scrum Master / DevOps) | Seed Python + Sonar config + Daily MD + PPTX dinámica |

---

## Cómo verificar

```bash
# 1. Instalar deps
cd frontend && pnpm install

# 2. Configurar .env.local (ver SETUP_SPRINT1.md paso 1)

# 3. Ejecutar SQL en Supabase (ver SETUP_SPRINT1.md paso 2)

# 4. Poblar datos
cd .. && python scripts/seed_data.py

# 5. Correr tests con cobertura
cd frontend && pnpm test --coverage

# 6. Build de producción
pnpm build

# 7. Dev server
pnpm dev
```

---

## Métricas Unidad II reportadas

| Categoría | Métrica | Valor | Marco |
|---|---|---|---|
| Requerimientos | Cobertura US con criterios | 5/5 (100%) | ISTQB |
| Requerimientos | Trazabilidad US→BD→Comp→Test | 5/5 | TMMi nivel 3 |
| Diseño | Tablas BD vs documentadas | 7/7 (100%) | ISO/IEC 25010 |
| Código | Cobertura statements | 65.26% | ISTQB |
| Código | Cobertura branches | 53.71% | ISTQB |
| Código | Tests pasando | 39/39 (100%) | TMMi |
| Clásicas | KLOC | ~1.4 KLOC | Pressman |
| Clásicas | Productividad | 0.28 KLOC/persona | Pressman |
| Proceso | Ciclo de mejora documentado | ✓ Daily MD | TQM |

---

## Deuda técnica reconocida (Sprint 2)

- 🔴 RLS permisivo (`USING (true)`) — primer ticket Sprint 2 endurece políticas por rol
- 🟡 Cliente Supabase sin tipado genérico (compatibilidad con TS 6.0 verbatimModuleSyntax) — codegen pendiente
- 🟡 Locust solo medido en local — falta corrida contra deploy Railway
- 🟡 SonarCloud sin primera pasada — pendiente conectar repo en sonarcloud.io

---

## Referencias

- Documentación Sprint 1: `docs/Obsidian/Sprints/Sprint 1 — Agendamiento de Citas.md`
- Daily semana 2: `docs/Obsidian/Dailys/Daily — Semana 2 — Sprint 1.md`
- Setup guide: `SETUP_SPRINT1.md`
- Dinámica académica: `dailys/Daily_S2_Sprint1_HELIOS.pptx`
