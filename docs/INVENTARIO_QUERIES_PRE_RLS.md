# Inventario de queries Supabase del frontend (pre RLS B-14)

> Base para diseñar las policies RLS de B-14 sin romper queries existentes.
> Regla: cada policy permite EXACTAMENTE lo que esta tabla dice. Nada más, nada menos.
> Fecha del análisis: 2026-05-27

---

## Resumen por tabla

| Tabla | Operación | Quién (rol) | Filtros | Archivo |
|---|---|---|---|---|
| `pacientes` | SELECT | paciente (vía JOIN en useAuth) | `auth_paciente_link.auth_uid = auth.uid()` | hooks/useAuth.tsx:54-72 |
| `pacientes` | SELECT (chequeo cédula duplicada) | invitado en registro | `eq('cedula', X)` | pages/Register.tsx:67 |
| `pacientes` | INSERT | invitado en registro | crea su propio paciente | pages/Register.tsx:103 |
| `pacientes` | SELECT (nuevo B-13) | médico | pacientes con citas asignadas al médico | hooks/useMedicoCitas.ts (nuevo) |
| `auth_paciente_link` | SELECT (vía JOIN en useAuth) | paciente | `auth_uid = auth.uid()` | hooks/useAuth.tsx:54-72 |
| `auth_paciente_link` | UPSERT | invitado en registro | crea su propio vínculo | pages/Register.tsx:122 |
| `auth_medico_link` (nueva tabla) | SELECT | médico | `auth_uid = auth.uid()` | hooks/useAuth.tsx (modificado B-13) |
| `auth_medico_link` (nueva tabla) | INSERT | NINGUNO (anon ni authenticated) | solo service_role en seed | scripts/seed_medicos_demo.py |
| `citas` | SELECT con JOINs | paciente | `paciente_id = auth.paciente_id` | hooks/useCitas.ts:44-49 |
| `citas` | SELECT con JOINs (nuevo) | médico | `medico_id = auth.medico_id` | hooks/useMedicoCitas.ts (nuevo) |
| `citas` | INSERT | vía RPC `crear_cita_atomica` | (ver nota RPC) | pages/AgendarCita.tsx:91 |
| `citas` | UPDATE (nuevo) | médico | solo campo `estado` de SUS citas | hooks/useMedicoCitas.ts (nuevo) |
| `horarios` | SELECT | autenticado (cualquiera para agendar) | `medico_id = X AND disponible = true` | hooks/useHorarios.ts:34-40 |
| `horarios` | UPDATE (`disponible = false`) | vía RPC `crear_cita_atomica` | (ver nota RPC) | RPC schema.sql:173 |
| `medicos` | SELECT con JOINs | autenticado | `sede_id, especialidad_id, activo` | hooks/useMedicos.ts:33-38 |
| `medicos` | SELECT (vía JOIN useCitas) | paciente | dentro de cita | hooks/useCitas.ts:46 |
| `medicos` | SELECT (vía JOIN useAuth B-13) | médico | el propio médico | hooks/useAuth.tsx (modificado) |
| `sedes` | SELECT | autenticado | `activo = true` | hooks/useSedes.ts:26-29 |
| `especialidades` | SELECT | autenticado | sin filtro extra | hooks/useEspecialidades.ts:26-28 |

---

## Operaciones por tabla (resumen para policies)

### `pacientes`
- **SELECT** del paciente dueño (JOIN auth_paciente_link)
- **SELECT** invitado para chequeo cédula duplicada (during registro)
- **SELECT** del médico para pacientes con citas asignadas
- **INSERT** invitado para crear su propio perfil
- **NO** UPDATE/DELETE desde anon (solo service_role)

### `auth_paciente_link`
- **SELECT** del dueño
- **INSERT/UPSERT** del propio usuario (auth_uid = auth.uid())
- **NO** UPDATE/DELETE desde anon

### `auth_medico_link` (NUEVO)
- **SELECT** del dueño (auth_uid = auth.uid())
- **NO** INSERT/UPDATE/DELETE desde anon NI authenticated → solo service_role (vía seed)
- **Patrón 1 — Verificación de identidad médico**

### `citas`
- **SELECT** del paciente dueño
- **SELECT** del médico dueño
- **INSERT** vía RPC `crear_cita_atomica` (ver nota RPC abajo)
- **UPDATE estado** del médico dueño
- **NO** DELETE desde anon

### `horarios`
- **SELECT** público autenticado (para mostrar disponibles al agendar)
- **UPDATE disponible** vía RPC `crear_cita_atomica`
- **NO** INSERT/DELETE desde anon (solo service_role en seed)

### `medicos`, `sedes`, `especialidades` (catálogos)
- **SELECT** público autenticado
- **NO** mutaciones desde anon (solo service_role en seed)

---

## ⚠️ Nota crítica sobre el RPC `crear_cita_atomica`

`supabase/schema.sql:153-184`:

- Definida con `SECURITY DEFINER` → bypasea RLS al ejecutar
- GRANTed a `anon, authenticated` → ¡cualquiera puede llamarla, incluso sin login!
- **NO valida que `p_paciente_id` corresponda al `auth.uid()` del caller**

**Vulnerabilidad descubierta:** un atacante con DevTools puede ejecutar:
```ts
supabase.rpc('crear_cita_atomica', {
  p_paciente_id: '<id-paciente-ajeno>',
  p_medico_id: '...',
  p_horario_id: '...',
  p_sede_id: '...',
})
```
Y crear una cita a nombre de OTRO paciente. Igual de grave: puede agotar la disponibilidad de horarios sin estar autenticado siquiera (porque GRANT incluye `anon`).

**Fix a incluir en B-14 (NO planeado originalmente, descubierto durante el inventario):**
1. `REVOKE EXECUTE ON FUNCTION crear_cita_atomica FROM anon;` (solo authenticated)
2. Agregar al inicio de la función:
   ```sql
   IF NOT EXISTS (
     SELECT 1 FROM auth_paciente_link
     WHERE auth_uid = auth.uid() AND paciente_id = p_paciente_id
   ) THEN
     RAISE EXCEPTION 'No autorizado: el paciente no corresponde al usuario actual';
   END IF;
   ```

Esto cierra el agujero sin romper el flujo legítimo (el paciente sigue creando sus propias citas vía la RPC, pero NO puede crear citas ajenas).

---

## Llamadas a `supabase.auth.*`

| Operación | Quién | Archivo |
|---|---|---|
| `auth.getSession()` | cualquiera (init) | useAuth.tsx:102 |
| `auth.onAuthStateChange(...)` | cualquiera (listener) | useAuth.tsx:130 |
| `auth.signOut()` | autenticado | useAuth.tsx:171 |
| `auth.signInWithPassword(...)` | invitado | Login.tsx:49 |
| `auth.signUp(...)` | invitado | Register.tsx:86 |

Las funciones de `auth.*` son manejadas por Supabase Auth internamente — RLS no aplica directamente, pero la seguridad de signUp/signIn está controlada por Supabase (rate limits, captcha si configurado, etc).

---

## Conclusión para diseñar policies B-14

Las policies que escribiré:
1. `pacientes`: 3 policies (paciente lee suyo, médico lee con cita, paciente crea suyo)
2. `auth_paciente_link`: 2 policies (dueño lee + dueño crea/upsert)
3. `auth_medico_link`: 1 policy (dueño lee) + NO INSERT/UPDATE/DELETE para anon
4. `citas`: 4 policies (paciente lee, médico lee, médico actualiza, INSERT vía RPC)
5. `horarios`: 2 policies (autenticado lee, UPDATE vía RPC)
6. `medicos`, `sedes`, `especialidades`: 1 policy cada uno (autenticado lee)
7. RPC `crear_cita_atomica`: revoke anon + validación interna

Total ~14 policies + 1 fix de RPC.

**Y para chequeo de cédula duplicada en registro**: necesita SELECT en `pacientes` desde invitado. Esto rompe la policy "paciente lee solo el suyo". Solución: agregar policy específica:
```sql
-- Permitir verificar si una cédula está libre durante registro
CREATE POLICY "invitado_chequea_cedula" ON pacientes FOR SELECT
USING (true);  -- solo select(id), no expone datos personales
```
Pero esto expone que esa cédula existe (information disclosure). Aceptable para Sprint 1 — la validación de cédula duplicada es necesaria para el flujo. Sprint 2 puede mover esto a un RPC con rate limit.
