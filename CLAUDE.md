# CLAUDE.md — Reglas del proyecto HELIOS

> Este archivo lo lee Claude Code automáticamente al abrir el repo.
> Aplica a TODAS las sesiones de Claude trabajando en HELIOS.

---

## 🧠 PRIMER PASO OBLIGATORIO (al iniciar sesión)

**ANTES de hacer cualquier cosa, lee este archivo:**

```
docs/CONTEXTO_SESION_ULTIMA.md
```

Ahí está el **estado exacto donde se quedó la última sesión**: qué bugs se arreglaron, qué falta hacer, qué tests pasaron, qué deploy está vivo, y qué pendientes hay para José.

No empezar a trabajar sin haber leído ese archivo primero. Es la "memoria viva" del proyecto entre sesiones.

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
| B-10 | Login/Register spinner eterno si Supabase tarda | `pages/Login.tsx`, `pages/Register.tsx`, `lib/withTimeout.ts` (nuevo) | Helper `withTimeout` (Promise.race con 15s) + `try/catch/finally` en handlers → garantiza `setSubmitting(false)` y mensaje claro al usuario |
| B-11 | "Verificando sesión…" eterno tras F5 o navegación | `hooks/useAuth.tsx`, `hooks/useAuth.test.tsx` (nuevo) | Discriminar `event` en `onAuthStateChange` (TOKEN_REFRESHED y USER_UPDATED ya NO recargan paciente) + `withTimeout` en `loadPaciente` y `getSession` → spinner nunca queda eterno, max 15s |
| B-12 | Spinner aún tardaba ~10s tras B-11 | `hooks/useAuth.tsx` | `loadPaciente` reducido de 2 queries serializadas a 1 JOIN nativo Supabase (`auth_paciente_link!inner → pacientes!inner`). De ~10s a <2s |
| B-13 | Sprint 1 sin pantalla para médicos | `pages/MedicoDashboard.tsx`, `hooks/useMedicoCitas.ts`, `components/medico/*` (NUEVOS), `hooks/useAuth.tsx`, `App.tsx`, `Login.tsx`, `AppLayout.tsx`, `ProtectedRoute.tsx` | Dashboard médico con agenda hoy, marcar completada/no_asistió, ficha del paciente, historial. `useAuth` resuelve rol paciente XOR médico vía 2 queries Promise.all. `ProtectedRoute` con prop `requireRole`. Verificación identidad: Patrón 1 (sin auto-registro, solo admin via seed) |
| B-14 | RLS `allow_all_dev` permisivo en todas las tablas | `supabase/migrations/B-13`, `B-14`, `rollback_B-14` | Policies estrictas por rol en `auth_*_link`, `pacientes`, `citas`, `horarios`, `medicos`, `sedes`, `especialidades`. Patrón 1 (no auto-registro médico). Fix de `crear_cita_atomica` (era anon + sin validación → ahora authenticated + valida `auth.uid()` es dueño del paciente) |
| B-15 | Spinner >10s tras B-14 por RLS sin índice | `supabase/migrations/B-15_indices_rls.sql` (NUEVO) | Agregar `CREATE INDEX idx_citas_medico ON citas(medico_id)`. Policies `medico_ve_sus_citas` hacían full table scan. Con índice: <100ms. De >10s a <2s |
| B-16 | Flash "Completa tu perfil" durante loading del médico | `components/layout/AppLayout.tsx`, `pages/Login.tsx`, `pages/Register.tsx` | Durante `loading=true`, AppLayout NO muestra NavItem por rol (evita flash cuando `role=null` transitorio). Login espera role antes de Navigate. Register redirige a /medico si user es médico (cinturón y tirantes) |
| B-17 | F5 en /medico tarda >10s + flash "Completa tu perfil" si loadPerfil falla | `hooks/useAuth.tsx`, `components/auth/ProtectedRoute.tsx`, `pages/Register.tsx` | (1) Filtrar `INITIAL_SESSION` en `onAuthStateChange` (evita doble `loadPerfil` al F5). (2) Idempotencia por `authUid` (evita reload en cambio de pestaña). (3) Flag `loadPerfilFailed` expuesto en context → ProtectedRoute muestra pantalla error + Reintentar en lugar de Navigate ciego a /registro |
| B-18 | Calendario FullCalendar ilegible en móvil | `components/agendamiento/CalendarioCitas.tsx`, `CalendarioCitasLista.tsx` (NUEVO), `hooks/useIsMobile.ts` (NUEVO) | Vista lista agrupada por día en pantallas <768px. `useIsMobile` con `matchMedia` + listener. `formatFechaLarga` con `split('-').map(Number)` para evitar desfase de timezone |
| B-19 | signUp con session=null deja paciente huérfano | `pages/Register.tsx` | Tras signUp si `authData.session` es null, hacer `signInWithPassword` explícito ANTES de los inserts para garantizar JWT activo (RLS `auth_paciente_link` requiere `auth.uid() = auth_uid`). **Fix incompleto** — B-20 lo redisena |
| B-20 | B-19 aún fallaba: register termina en "Completa tu perfil" | `pages/Register.tsx`, `pages/Login.tsx`, `hooks/useAuth.tsx`, `supabase/cleanup_B-20_huerfanos.sql` (NUEVO) | **4 iteraciones** para llegar al fix real (cada una detectada en uso real por PO): **B-20** Separar registro de login (Register: signUp + sessionStorage + redirect; Login: completarRegistroPendiente tras signIn) + fix C-1 pasar refreshPerfil. **B-20.1** signOut tras signUp para evitar auto-login que mostraba "Completa tu perfil" sin pasar por Login. **B-20.2** polling getSession (3s) para esperar JWT propagado + errores visibles en pantalla (no más silent fail). **B-20.3** (fix DEFINITIVO) mover completarRegistroPendiente DENTRO de useAuth.onAuthStateChange (corre secuencial ANTES de loadPerfil; sin race con setSession de React state). Causa raíz real: race React closure de `refreshPerfil` con dep `session?.user?.id` veía null porque setSession del listener aún pendiente |
| B-21 | Calendario desktop: "12:30" se agendaba/posicionaba en otra hora (timezone) | `components/agendamiento/CalendarioCitas.tsx`, `CalendarioCitasLista.tsx`, `hooks/useHorarios.ts`, `hooks/useMedicoCitas.ts`, `package.json` | FullCalendar construía eventos con `start: \`${fecha}T${hora}\`` (ISO sin zona) → `Date` aplicaba offset (Panamá UTC-5), el bloque visual no coincidía con el título. FIX: usar SIEMPRE la vista de botones (timezone-safe, `slice` de string, sin `Date`) en móvil Y desktop → elimina la clase entera de bugs de zona horaria. Bonus: se quitó FullCalendar (bundle 754→496 KB). Además `useHorarios`/`useMedicoCitas` usaban `toISOString()` (fecha UTC) → cambiado a fecha local |
| B-22 | Validador de cédula rechazaba cédulas válidas cortas (ej. PE-5-687) | `lib/cedula.ts`, `lib/cedula.test.ts` | El regex exigía ≥5 dígitos tras quitar prefijo → `PE-5-687` (4 dígitos) se rechazaba. Reescrito: valida ESTRUCTURA por tipo (natural 1-13, PE, N, E, PI) con fallback de dígitos puros 5-13. Agregado `detectarTipoCedula()` (muestra el tipo en vivo) y `EJEMPLOS_CEDULA` (ejemplos en la UI). Investigado vs. Tribunal Electoral de Panamá |
| B-23 | Sin doble confirmación de cédula/contraseña → errores de tipeo | `pages/Register.tsx`, `pages/Register.test.tsx` | Agregados campos "Confirmar cédula" y "Confirmar contraseña"; deben coincidir o se bloquea el registro con mensaje claro. La cédula-confirm tiene `onPaste` deshabilitado para forzar re-escritura real |
| B-24 | Sin validación de teléfono/nombre/correo → datos basura | `lib/validaciones.ts` (NUEVO) + `validaciones.test.ts`, `pages/Register.tsx` | `validarTelefonoPanama` (móvil 8 díg/fijo 7, opcional +507, rechaza letras), `validarNombre` (solo letras/acentos/espacios), `validarEmail` (regex estándar). Inputs con `inputMode`/`type` correctos para teclado móvil |
| B-25 | Calendario dejaba agendar slots de HOY cuya hora ya pasó (ej. 7 AM por la tarde) | `hooks/useHorarios.ts`, `hooks/useHorarios.test.ts` (NUEVO) | El filtro `gte('fecha', hoy)` solo excluía días pasados, no horas pasadas de hoy. NUEVO `filtrarSlotsFuturos(horarios, ahora)`: descarta slots con `fecha === hoy && hora_inicio <= horaActual`. Comparación local en strings (sin Date/UTC), timezone-safe |
| B-26 | RLS permisiva `sprint1_all` (FOR ALL USING true) seguía en 7 tablas pese a B-14 → cualquier autenticado podía leer/modificar/borrar datos ajenos | `supabase/migrations/sprint2_b26_cerrar_sprint1_all.sql` (NUEVO) | B-14 agregó policies estrictas pero NO borró las `sprint1_all`; como las policies son OR, el hueco persistía (confirmado por PO: 7 tablas). Migración transaccional: re-crea (idempotente) las estrictas de B-14 y LUEGO elimina las `sprint1_all`. Incluye rollback. Cierra la ESCRITURA ajena. Pendiente menor: `chequeo_cedula_en_registro` (SELECT true en pacientes) → mover a RPC en Sprint 5 |
| B-27 | Datos demo caducan: el seed genera horarios solo para 14 días desde que se corre → desde el 9-jun la BD no tenía NI UN slot futuro y el wizard mostraba "Este médico no tiene horarios disponibles" para TODOS los médicos | `scripts/extender_horarios.py` (NUEVO) | Detectado por PO en producción (11-jun-2026). NO era bug de código (useHorarios filtra bien), ni RLS, ni Railway: `fecha_max` en BD era 2026-06-08 (seed corrido el 26-may + 14 días). Fix: script NO destructivo que inserta slots futuros (default 30 días) solo para los médicos activos existentes, con upsert `ignore_duplicates` sobre UNIQUE(medico_id,fecha,hora_inicio) — preserva las 59 citas reales y los slots reservados. ⚠️ NO re-correr `seed_data.py` para esto: borra el catálogo y recrea médicos con IDs nuevos (rompería las FKs de las citas). Operación: correr `python scripts/extender_horarios.py` antes de cada demo si pasaron semanas |
| B-28 | CI roto: `tsc -b` fallaba en `Type check + Build` (TS2593 `beforeEach` no encontrado) + SonarCloud Quality Gate fallaba con `Security Rating on New Code: C` | `frontend/src/components/notificaciones/CampanaNotificaciones.test.tsx`, `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/pnpm-workspace.yaml` (NUEVO), `sonar_log.txt` (eliminado, ahora en `.gitignore`) | (1) El test nuevo usaba `beforeEach` sin importarlo de `vitest` (tsconfig no tiene `vitest/globals`); fix: agregarlo al import, igual que los otros 12 archivos de test. (2) El Quality Gate fallaba por SCA: como era el primer análisis exitoso de SonarCloud, TODO el lockfile contaba como "código nuevo", y `pnpm audit` reportaba 13 vulnerabilidades (high: `undici` vía `jsdom`, `vite` <8.0.16, `react-router` DoS, `nanoid`, `brace-expansion`, `postcss`). Fix: `vite` 8.0.14→8.2.2, `jsdom` 29→30, `@babel/core` 7→8, `react-router-dom` 7.15.1→7.18.3 (corrige DoS que sí corre en producción), + `pnpm-workspace.yaml` con `overrides` para `postcss`/`nanoid`/`minimatch`/`brace-expansion` (pnpm v11 ya no lee `pnpm.overrides` desde `package.json`). Resultado: `pnpm audit` de 13 vulnerabilidades (incl. 8 high) a solo 1 low residual sin ruta a producción. `sonar_log.txt` estaba commiteado y desactualizado (de antes del fix del `SONAR_TOKEN`/`projectKey`) — se eliminó y se agregó a `.gitignore`. Pendiente verificar en la próxima corrida real de SonarCloud si el Security Rating sube a A |

### Sprint 5 — Features y hallazgos (8-jul-2026)

| ID | Feature / hallazgo | Archivos | Detalle |
|---|---|---|---|
| **CI/CD** | Auto-deploy con GitHub Actions (esquiva el bloqueo de Smart App Control sobre `railway.exe` en Windows del PO) | `.github/workflows/deploy-railway.yml` (NUEVO) | Cada push a `main` corre `railway up --service helios-web --ci` en un runner Linux de GitHub → despliega a Railway. Requiere secret **`RAILWAY_TOKEN`** = **project token** de Railway (un account token daba `Unauthorized`). Repo movido a la org `Helios-TeamUTP` (José owner). Verificado: sitio 200 + `/helios-logo.png` 200 |
| **F-01** | Límite de **15 citas por médico por día** (número recomendado por un médico real que probó HELIOS; tope físico) | `supabase/migrations/sprint5_limite_citas_dia.sql` (NUEVO); `hooks/useHorarios.ts`, `components/agendamiento/CalendarioCitas.tsx`, `CalendarioCitasLista.tsx`, `lib/types.ts` (`HorarioAgendable`) | 3 capas: (1) `crear_cita_atomica` rechaza la 16ta cita del día con **advisory lock por (medico, fecha)** que serializa a 2 pacientes en slots distintos (race real); (2) `reprogramar_cita_atomica` valida el tope en el día destino (excluye la propia cita); (3) RPC `horarios_agendables(p_medico_id, p_hoy, p_excluir_cita_id)` SECURITY DEFINER marca `dia_completo` y la UI deshabilita esos días. Conteo `estado <> 'cancelada'` (cuenta confirmada+completada+no_asistio). Tope en `c_max_citas_dia` (constante en las 3 funciones). Verificado adversarialmente (5 lentes) |
| **H-01** | *(cazado en review adversarial, corregido antes del deploy)* `horarios_agendables` con `GRANT anon` reabría lectura de la agenda a anónimos (regresaba B-14) | `sprint5_limite_citas_dia.sql` | `REVOKE anon`, solo `authenticated`; `SET search_path = public, pg_temp` en las 3 funciones |
| **H-02** | *(review adversarial)* Reprogramar el mismo día se bloqueaba en la UI en días al tope (el listado no excluía la propia cita) | `sprint5_limite_citas_dia.sql` + frontend | `p_excluir_cita_id` alinea el conteo del listado con el del backend |
| **H-03** | *(review adversarial)* El tope solo contaba `confirmada` → al marcar `completada` el día se "reabría" y podía superar el tope físico | `sprint5_limite_citas_dia.sql` | Conteo cambiado a `estado <> 'cancelada'` en las 3 funciones |

---

## 📈 Métricas del Sprint 1 (a defender el viernes)

- **Cobertura:** 61.4% statements / 82% lines / 90.9% functions
- **Tests:** 117/117 pasando (65 de Sprint 1 + 52 de Sprint 2: cédula 5 tipos, validaciones, vista botones timezone-safe, doble confirmación, slots futuros, cancelar/reprogramar hooks+componentes+UI)
- **KLOC:** ~2.6 (producto: frontend + SQL + dashboard médico + cancelar/reprogramar + historial)
- **Bundle:** 503 KB / 143 KB gzip (bajó desde 754 KB al quitar FullCalendar en B-21)
- **Features Sprint 2:** Cancelar cita + Reprogramar cita (RPC SQL atómicas + RLS) + tabla de auditoría `citas_historial` + cierre del hueco de seguridad `sprint1_all` (B-26)
- **P95 latencia:** 300 ms (Locust 200 usuarios) + <2s F5 con índice B-15
- **Tasa defectos:** 20 bugs / 2.3 KLOC = **8.70 bugs/KLOC** — sube por bugs detectados en uso real por PO (B-11, B-12, B-15..B-20) en ciclos rápidos Plan→Code→Review→Deploy. Narrativa: "detectamos y arreglamos en la misma jornada gracias a la disciplina del proceso obligatorio del CLAUDE.md". B-20 requirió 4 iteraciones (B-20/.1/.2/.3) — cada una validada en producción con el PO en el mismo día. La causa raíz real (race de React closure con `session?.user?.id` en `useCallback`) sólo se detectó con la pista del PO: *"si cierro sesión y vuelvo a entrar, funciona"*. Demuestra valor del feedback de usuario real vs solo tests automatizados.
- **Features nuevas del Sprint:** Dashboard de médicos (B-13) + seguridad multicapa RLS por rol (B-14) + vista móvil del calendario (B-18) + flow registro→login con paciente automático (B-20)

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
