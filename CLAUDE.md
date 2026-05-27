# CLAUDE.md — Reglas del proyecto HELIOS

> Este archivo lo lee Claude Code automáticamente al abrir el repo.
> Aplica a TODAS las sesiones de Claude trabajando en HELIOS.

---

## Identidad del proyecto

**HELIOS** es el sistema unificado de citas médicas del Grupo HELIOS (UTP Calidad de Software 2026).

**Equipo:**
- José Brown — Product Owner (brownjose540@gmail.com)
- Ethan Gonzalez — Dev Frontend
- Alejandro Saenz — Tech Lead / Backend
- Ashley Martinez — QA Engineer
- Marian Barba — Scrum Master / DevOps

**Stack:** React 19 + TypeScript 6 + Vite 8 + Tailwind 3 + Supabase 2 + React Router 7 + FullCalendar 6

**Deploy:** Railway (`https://helios-web-production.up.railway.app`)
**BD:** Supabase (`uobhbikcctausgpnzsph`)
**Repo:** `MarianC-programing/Helios`

---

## 🚨 Reglas OBLIGATORIAS para cualquier cambio en HELIOS

Antes de modificar código DEBE seguirse este flujo. Saltarse cualquier paso requiere justificación explícita y aprobación del Product Owner (José).

### 1. Plan Mode primero
Ningún cambio sin plan aprobado. Para cambios triviales (typo, comentario, <10 líneas) se puede saltar este paso.

### 2. Análisis con `helios-team-orchestrator`
SIEMPRE invocar primero ante cualquier cambio no-trivial. El orchestrator decide qué agentes lanzar y en qué orden.

```
Task({
  description: "Coordinar cambio X",
  subagent_type: "helios-team-orchestrator",
  prompt: "..."
})
```

### 3. Implementación con agente especializado
Según el tipo de cambio:
- **UI / hooks / componentes** → `helios-frontend-expert`
- **Detección de bugs** → `helios-bug-hunter`
- **Refactor / limpieza** → `helios-clean-code`
- **Tests** → `helios-test-engineer`

### 4. Code review obligatorio
Antes de cualquier push:
```
Task({
  description: "Revisar cambios antes de push",
  subagent_type: "pr-review-toolkit:code-reviewer",
  prompt: "Revisa el diff actual..."
})
```

### 5. Tests deben pasar
Antes de cualquier deploy:
- `pnpm vitest run` → los 39+ tests deben pasar
- `pnpm vitest run --coverage` → cobertura ≥60% statements
- `pnpm build` → compilación limpia

### 6. Git push con confirmación
NUNCA hacer push sin confirmación explícita del usuario. Esto está en la regla global de José.

### 7. Documentar bugs en métricas
Cada bug encontrado debe registrarse en `docs/PLAN_EJECUCION_SPRINT_0_Y_1.md` sección "Defectos detectados" con:
- ID (B-XX)
- Archivo afectado
- Causa raíz
- Fix aplicado
- Commit hash

---

## 📂 Estructura del repo

```
helios-repo/
├── .claude/agents/              ← Equipo de agentes (activar manualmente)
├── .vscode/extensions.json      ← Extensiones recomendadas
├── backend/                     ← Vacío (Supabase reemplaza backend propio)
├── dailys/                      ← PPTX + reportes + QR demo
├── docs/
│   ├── agentes/                 ← Definiciones del equipo de agentes
│   ├── EQUIPO_DE_AGENTES_HELIOS.md
│   ├── PLAN_EJECUCION_SPRINT_0_Y_1.md  ← Historia completa del proyecto
│   ├── METRICAS_EXPLICADAS.md
│   ├── METRICAS_FACILES_CON_EJEMPLOS.md
│   ├── FUENTE_DE_METRICAS.md
│   ├── GUION_PRESENTACION_SPRINT1.md
│   ├── GLOSARIO_HELIOS.md
│   ├── JIRA_ISSUES_BUGS_SPRINT1.md
│   └── Obsidian/                ← SRS, ADR, wireframes, daily MD
├── frontend/                    ← App React
│   ├── src/
│   │   ├── components/{agendamiento,auth,layout,shared}/
│   │   ├── hooks/               ← useAuth, useCitas, useSedes, etc.
│   │   ├── lib/                 ← supabase.ts, types.ts, cedula.ts
│   │   ├── pages/
│   │   └── test/                ← setup + supabase-mock
│   ├── package.json
│   ├── vite.config.ts           ← Vitest + coverage thresholds
│   └── tailwind.config.js       ← Tema HELIOS (teal #0A8478)
├── scripts/                     ← Python (seed, locust, pptx, pdfs)
├── supabase/schema.sql          ← Schema ejecutable
├── Dockerfile                   ← Multi-stage para Railway
├── README.md
└── CLAUDE.md                    ← Este archivo
```

---

## 🎨 Tema visual HELIOS

Colores definidos en `frontend/tailwind.config.js`:

| Variable | Hex | Uso |
|---|---|---|
| `helios-primary` | `#0A8478` | Botones, headers, links activos |
| `helios-primary-dark` | `#066F66` | Hover de botones primarios |
| `helios-primary-light` | `#1FA89B` | Variantes claras |
| `helios-deep` | `#0A4F6B` | Títulos H1 |
| `helios-accent` | `#3DDC97` | CTAs especiales |
| `helios-ink` | `#0F2A36` | Texto principal |
| `helios-mist` | `#F4F7F8` | Fondo de página |

---

## 🛡️ Política de secretos

**NUNCA aceptar API keys/tokens/passwords en chat ni guardarlos en archivos planos commiteados.**

Los archivos `.env.local`, `.env`, `scripts/.env` están en `.gitignore`. Si una key aparece accidentalmente en un commit, rotarla inmediatamente en Supabase Dashboard.

---

## 🔥 Defectos conocidos resueltos (Sprint 1)

Referencia rápida — NO repetir estos patrones:

| ID | Patrón | Archivo | Fix |
|---|---|---|---|
| B-01 | Regex cédula muy estricto | `lib/cedula.ts` | Simplificado a 5-12 dígitos |
| B-02 | `vi.mock` con vars externas | tests | `vi.hoisted()` |
| B-03 | Faker locale `es_PA` inexistente | `scripts/seed_data.py` | `es_MX` |
| B-04 | Auth sin paciente → form en blanco | `pages/Register.tsx` | Detectar 3 escenarios + UI "Completa tu perfil" |
| B-05 | NavLinks no responden | `components/layout/AppLayout.tsx` | `sticky top-0 z-50` |
| B-06 | Seed destructivo | `scripts/seed_data.py` | Solo borra catálogo |
| B-07 | useAuth loading infinito | `hooks/useAuth.tsx` | try/catch/finally + race condition fix con useRef |
| B-08 | 5 hooks de datos sin try/catch | `hooks/use*.ts` | Patrón IIFE async con try/catch/finally |
| B-09 | localStorage para auth | `lib/supabase.ts` | `storage: sessionStorage` |

---

## 📈 Métricas del Sprint 1 (a defender el viernes)

- **Cobertura:** 65.26% statements / 81.72% lines / 89.28% functions
- **Tests:** 39/39 pasando
- **KLOC:** 1.71 (producto: frontend + SQL)
- **P95 latencia:** 300 ms (Locust 200 usuarios)
- **Tasa defectos:** 5.26 bugs/KLOC (9 bugs / 1.71 KLOC) — industria considera bueno <5

---

## 🚀 Cómo deployar (Marian / DevOps)

```bash
# 1. Tests pasan
cd frontend && pnpm vitest run

# 2. Build limpio
pnpm build

# 3. Code review obligatorio
# (invocar pr-review-toolkit:code-reviewer)

# 4. Confirmar con José (push)
git push origin sprint1/bootstrap

# 5. Deploy
railway up --service helios-web --ci

# 6. Verificar
curl -sf https://helios-web-production.up.railway.app
```

---

## 📞 Contacto y soporte

- Issues técnicos: abrir en GitHub `MarianC-programing/Helios/issues`
- Backlog: Jira `helios-group.atlassian.net` proyecto HELL
- Comunicación equipo: WhatsApp group "Grupo HELIOS"

---

_CLAUDE.md mantenido por Marian Barba (DevOps) — Última actualización: Sprint 1 semana 2._
