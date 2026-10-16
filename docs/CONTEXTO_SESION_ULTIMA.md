# 🧠 CONTEXTO DE LA ÚLTIMA SESIÓN — Memoria viva de HELIOS

> **LEE ESTE ARCHIVO PRIMERO** al abrir una sesión de Claude en el repo.
> Es el estado exacto donde se quedó la última sesión. Lo detallado de cada bug vive en la tabla de `CLAUDE.md`.
>
> **Última actualización:** 2026-10-16 (viernes). **Demo con la profesora de Mantenimiento: lunes 19-oct-2026.**

---

## 🟢 Estado verificado (16-oct-2026)

Todo lo de esta sección se comprobó contra la BD real, el repo y producción, no se dio por bueno por reportes previos.

- **Producción (Railway):** `https://helios-web-production.up.railway.app` → HTTP 200. Corre `main` @ `8611a73` (PR #14). CI, SonarCloud y "Deploy a Railway" en `success` (16-oct 21:48 UTC). El bundle en vivo ya no contiene "Completa tu perfil" ni el andamiaje B-20.x.
- **Código de `main`:** 394/394 tests, `tsc -b` sin errores, lint 0 errores (8 warnings preexistentes), build OK.
- **BD (Supabase `uobhbikcctausgpnzsph`):** registro funcionando de punta a punta; 0 cuentas de auth sin perfil; sin residuos de pruebas. 20 pacientes sin cuenta vinculada (el trigger solo reutiliza los que no tienen citas).
- **Secretos:** ninguno en texto plano en el repo; `.env` ignorado por git.

## 🔧 Qué se resolvió hoy: el registro estaba roto para todos (B-41 y B-42)

- **Síntoma:** al crear cuenta y volver a entrar aparecía "Completa tu perfil", que fallaba con `new row violates row-level security policy for table "pacientes"`. Nadie pudo registrarse desde la multi-tenancy (27-sep); el último paciente con cuenta es del 10-sep.
- **Causa:** (1) `pacientes.clinica_id` usa `DEFAULT clinica_demo_id()` (SECURITY INVOKER) y `clinicas` solo es visible vía `clinica_id_actual()`, que es NULL para un usuario nuevo → `clinica_id` NULL; (2) el `INSERT … RETURNING` exigía una policy de SELECT que ya no existía.
- **Solución actual (arquitectura vigente):** un trigger `on_auth_user_created_crear_paciente` en `auth.users` ejecuta `crear_paciente_desde_signup()` (SECURITY DEFINER) y crea paciente + `auth_paciente_link` en la misma transacción que la cuenta, leyendo `raw_user_meta_data`. `Register.tsx` hace `signUp` con metadata y ya no inserta nada. Se eliminó "Completa tu perfil" y el andamiaje B-20.x (`sessionStorage`, `completarRegistroPendiente`). Una sesión sin perfil ve `CuentaIncompleta`.
- **Cierre de escritura (Fase 2 y 2b):** eliminadas `paciente_crea_su_perfil`, `paciente_crea_su_link`, `paciente_actualiza_su_link`; `paciente_huerfano_id` revocada a `anon`/`authenticated` (solo `service_role`). Se dejan anónimas a propósito `cedula_ya_registrada` y `correo_ya_registrado`.
- **Estado de los PR:** #14 fusionado (frontend + trigger). **#15 abierto** (https://github.com/Helios-TeamUTP/Helios/pull/15, solo SQL): versiona la Fase 2 y 2b, que **ya están aplicadas en producción**. Al momento de escribir esto su CI estaba en curso.

## ⚠️ Riesgos y pendientes (en orden de importancia para el lunes)

1. **Decidir la URL de la demo.** Railway está al día. **Cloudflare (`https://helios.heliosmedic.workers.dev`, rama `demo-cloudflare`) está desactualizado:** 20 commits detrás de `main` y 10 propios (módulo Perfil). Ahí el registro sigue roto y muestra "Completa tu perfil". Si la demo es en Cloudflare, hay que fusionar `main` en `demo-cloudflare`, correr tests, hacer push (con confirmación) y esperar el deploy. **Recomendado: usar Railway.**
2. **Fusionar el PR #15** cuando su CI pase (no afecta al frontend).
3. **Reconstruir las migraciones de multi-tenancy.** El SQL `sprint0_multitenancy_*` (M-06) se aplicó directo en Supabase y hoy no existe en disco, ramas, stash ni `origin/main`. Ese desfase repo↔BD ocultó el bug de hoy. Reconstruirlo desde la BD real (`pg_policies`, `pg_get_functiondef`) y versionarlo. Cuidado: no re-aplicar versiones viejas de `crear_cita_atomica` (ver B-34b).
4. **Protección contra contraseñas filtradas (Auth):** advertencia del asesor de seguridad de Supabase, solo se activa a mano en el panel de Auth (puede requerir plan Pro; guía oficial: https://supabase.com/docs/guides/auth/password-security). **No activarla antes de la demo:** rechazaría contraseñas comunes en el registro (p. ej. `123456`), y el frontend aún no traduce ese error (`weak_password`). Hacerlo después del lunes y añadir el mapeo en `erroresAuth.ts`.
5. **Menor:** `anon`/`authenticated` conservan TRUNCATE/TRIGGER sobre `clinicas` y otras tablas (default de Supabase; la API no los expone). Cerrar junto con una revisión de grants.

## 🚫 Fuera de alcance (decisiones del PO)

- **Recuperar contraseña (RF-04): fuera de la demo.** Existe la rama `feat/rf04-recuperar-password`. El worktree principal (`Helios`, rama local `demo-vercel`, upstream desaparecido) tiene **27 cambios sin commitear** (incluye esa feature) y el stash `wip-antes-de-sync`. **No tocarlos** sin pedirlo.
- **Tokens (`GITHUB_TOKEN`, `SONAR_TOKEN`):** según el reporte de una sesión previa están en texto plano en el `CLAUDE.md` del proyecto de Claude. **Decisión del PO (16-oct-2026): no rotarlos; riesgo aceptado.** No volver a proponerlo salvo que cambie quién tiene acceso.

## 🗺️ Mapa de worktrees y ramas

| Carpeta (`~/ProyectosDev/`) | Rama | Para qué |
|---|---|---|
| `Helios` | `demo-vercel` (local) | Pivote SaaS / Cloudflare. Con WIP sin commitear: no tocar |
| `Helios-cu-demo` | `fix/registro-cerrar-policies-escritura` | PR #15 (Fase 2 y 2b) |
| `Helios-fix-notas` | `feat/rf04-recuperar-password` | Recuperar contraseña (fuera de alcance) |

`fix/registro-paciente-rls` (PR #14) y `fix/cu-demo-19oct` ya están en `main`. El remoto `marian-legacy` es histórico: **no usar para push**.

## 🧪 Cómo verificar el registro (sin ensuciar la BD)

Las pruebas contra producción se hacen con un bloque `DO $$ … $$` que termina siempre en `RAISE EXCEPTION 'RESULTADO: …'`: se revierte solo y el mensaje trae el resultado. Casos de referencia: registro feliz (paciente+link+clínica), cédula duplicada (23505), cuenta sin metadata (sin paciente), el usuario nuevo ve su perfil por RLS, no puede insertar pacientes ni links a mano.

**Smoke test para el lunes (5 min):** registrar un paciente nuevo → debe caer en `/agendar` sin pasar por "Completa tu perfil" → agendar una cita → cerrar sesión e iniciar de nuevo → ver la cita en "Mis citas" → entrar como médico (`docs/CREDENCIALES_DEMO_MEDICOS.md`) y completar la cita. Si hay slots vencidos: `python scripts/extender_horarios.py` (B-27).

## 🛠️ Notas operativas

- El shell de la herramienta es `sh` (no `bash`): no usar `PIPESTATUS` ni `$'…'`.
- PR con `gh pr create` (ya autenticado como `MarianC-programing`). **Nunca push sin confirmación explícita** (regla 6).
- Bugs nuevos van a la tabla de `CLAUDE.md` (último ID: **B-42**). `docs/PLAN_EJECUCION_SPRINT_0_Y_1.md` solo detalla hasta B-16.

## 🔑 Reglas de trabajo (no se saltan)

1. Plan Mode primero (salvo cambios triviales). 2. `helios-team-orchestrator` en cambios no triviales. 3. Agente especializado para implementar. 4. Code review antes de cualquier push. 5. `pnpm vitest run`, cobertura ≥60% y `pnpm build` antes de deploy. 6. Push solo con confirmación explícita. 7. Documentar cada bug (ID, archivo, causa raíz, fix).

---

_Última sesión: 2026-10-16 — registro reparado y verificado en producción; PR #15 abierto; pendiente decidir la URL de la demo._
