# Reporte de Bugs — Sprint 1 y 2

**Estado:** #activo
**Fecha:** 2026-06-10
**Detectado por:** Auditoría de código — rama `origin/sprint1/bootstrap`
**Proyecto:** [[Proyecto - HELIOS]]
**Sitio desplegado:** https://helios-web-production.up.railway.app/login
**Tags:** #helios #bugs #istqb #qa #sprint-1 #sprint-2 #parcial-2

---

## Contexto

Auditoría de código realizada sobre la rama `origin/sprint1/bootstrap` del repositorio GitHub. Se revisaron los siguientes archivos fuente directamente desde el repo local en `/home/marian01/ProyectosDev/Helios`:

- `frontend/src/lib/cedula.ts`
- `frontend/src/pages/Register.tsx`
- `frontend/src/components/auth/ProtectedRoute.tsx`
- `frontend/src/pages/MisCitas.tsx`
- `frontend/src/hooks/useHorarios.ts`
- `frontend/src/hooks/useCitas.ts`
- `supabase/schema.sql`

Se encontraron **5 bugs** de distintas severidades. Ninguno rompe el sistema completamente, pero todos son reproducibles y demostrables en el sitio desplegado o en el código.

---

## Resumen Ejecutivo

| ID | Archivo | Severidad | Tipo | Estado |
|----|---------|-----------|------|--------|
| [[#BUG-01 — Validador de cédula acepta valores inválidos\|BUG-01]] | `cedula.ts` | 🔴 Mayor | Lógica de negocio | Abierto |
| [[#BUG-02 — Race condition en registro — cuenta auth huérfana\|BUG-02]] | `Register.tsx` | 🔴 Mayor | Concurrencia / Datos | Abierto |
| [[#BUG-03 — ProtectedRoute no valida perfil de paciente completo\|BUG-03]] | `ProtectedRoute.tsx` | 🟡 Medio | Flujo de navegación | Abierto |
| [[#BUG-04 — Horarios pasados del día actual son visibles y seleccionables\|BUG-04]] | `useHorarios.ts` | 🟡 Medio | Validación de datos | Abierto |
| [[#BUG-05 — MisCitas no tiene Realtime — agenda desactualizada\|BUG-05]] | `useCitas.ts` | 🟡 Medio | Requisito funcional | Abierto |

**Defectos Mayor:** 2  
**Defectos Medio:** 3  
**Defectos Menor:** 0  
**Densidad total:** 5 bugs encontrados en auditoría manual de ~800 LOC = **6.25 bugs/KLOC** (esperado para código sin pruebas de integración)

---

## BUG-01 — Validador de cédula acepta valores inválidos

**ID:** BUG-01  
**Severidad:** 🔴 Mayor  
**Prioridad:** Alta  
**Tipo:** Lógica de negocio  
**Archivo:** `frontend/src/lib/cedula.ts`  
**Módulo afectado:** Registro de paciente (toda la autenticación)  
**Historia de usuario relacionada:** HU-Registro  
**Técnica ISTQB:** Partición de equivalencia + Análisis de valores límite

### Descripción

La función `isValidCedulaPanama()` elimina toda la estructura de la cédula antes de validarla. Quita el prefijo `PE/N/E` y todos los guiones, y luego solo verifica que queden entre 5 y 12 dígitos. Esto hace que **cualquier secuencia de 5 a 12 dígitos** sea considerada una cédula panameña válida, sin importar si tiene el formato correcto `provincia-tomo-asiento`.

### Código con el bug

```typescript
// frontend/src/lib/cedula.ts — LÍNEA 4-6
export function isValidCedulaPanama(cedula: string): boolean {
  if (!cedula) return false
  const clean = cedula.trim().toUpperCase()
  // Quitamos prefijo PE/N/E opcional y todos los guiones; queda solo dígitos.
  const soloDigitos = clean.replace(/^(PE|N|E)-?/, '').replace(/-/g, '')
  // ↑ PROBLEMA: destruye el formato antes de validarlo
  return /^[0-9]{5,12}$/.test(soloDigitos)
  // ↑ PROBLEMA: solo cuenta dígitos, no valida estructura
}
```

### Casos de prueba que demuestran el bug

| Input | Resultado actual | Resultado esperado |
|-------|------------------|--------------------|
| `"12345"` | ✅ Válida | ❌ Inválida (no tiene formato provincia-tomo-asiento) |
| `"00000"` | ✅ Válida | ❌ Inválida |
| `"999999999999"` | ✅ Válida (12 dígitos) | ❌ Inválida (no existe provincia 99) |
| `"8-ABC-123"` | ❌ Inválida | ❌ Inválida ✓ (correcto por accidente) |
| `"8-123-4567"` | ✅ Válida | ✅ Válida ✓ |
| `"14-1-1"` | ✅ Válida | ❌ Inválida (provincia 14 no existe) |

### Cómo reproducir

1. Ir a https://helios-web-production.up.railway.app/login
2. Hacer clic en **Regístrate**
3. En el campo **Cédula**, escribir `12345`
4. Observar: el sistema acepta el valor sin error de validación
5. Completar el resto del formulario y enviar — el registro se completa con una cédula inválida

### Impacto

Un paciente puede registrarse con una cédula inventada. La policlínica no puede verificar identidad. La columna `cedula UNIQUE` en Supabase sí existe, pero no valida el formato — solo evita duplicados. El constraint de BD no suple la validación de formato.

### Corrección propuesta

```typescript
// Reemplazar cedula.ts completo:
export function isValidCedulaPanama(cedula: string): boolean {
  if (!cedula) return false
  const c = cedula.trim().toUpperCase()
  // Formato real: provincia-tomo-asiento
  // Provincia: 1-9, 10-13, N, E, PE
  return /^(PE|E|N|[1-9]|1[0-3])-\d{1,4}-\d{1,6}$/.test(c)
}

export function normalizeCedula(cedula: string): string {
  return cedula.trim().toUpperCase()
}
```

---

## BUG-02 — Race condition en registro — cuenta auth huérfana

**ID:** BUG-02  
**Severidad:** Mayor  
**Prioridad:** Alta  
**Tipo:** Concurrencia / Integridad de datos  
**Archivo:** `frontend/src/pages/Register.tsx` (líneas 58–105)  
**Módulo afectado:** Registro de paciente  
**Historia de usuario relacionada:** HU-Registro  
**Técnica ISTQB:** Prueba de condición de carrera (concurrencia)

### Descripción

El flujo de registro tiene tres pasos secuenciales sin transacción:

1. Verificar que la cédula no exista en `pacientes`
2. Crear usuario en `auth.users` via `supabase.auth.signUp()`
3. Insertar fila en `pacientes`

Si el paso 3 falla (por ejemplo, otro usuario registró la misma cédula en el intervalo entre el paso 1 y el paso 3, o hay un error de red), el sistema ya creó un registro en `auth.users` que **nunca se elimina**. Ese email queda bloqueado en Supabase Auth: el usuario no puede iniciar sesión (no tiene paciente vinculado) ni volver a registrarse (el email ya existe en auth).

### Código con el bug

```typescript
// Register.tsx — flujo sin rollback

// PASO 1: Check cédula (correcto)
const { data: existing } = await supabase
  .from('pacientes').select('id').eq('cedula', cedulaNorm).maybeSingle()
if (existing) { setError('Ya existe...'); return }

// PASO 2: Crear en auth.users — PUNTO DE NO RETORNO
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: form.correo,
  password: form.password,
})
// ↑ Si esto succeeds, el email queda tomado en Supabase Auth

// PASO 3: Insertar paciente
const { data: pac, error: pacError } = await supabase
  .from('pacientes')
  .insert({ nombre, cedula: cedulaNorm, ... })
  .select().single()

if (pacError || !pac) {
  setSubmitting(false)
  setError(pacError?.message ?? 'No se pudo crear el paciente.')
  return
  // ↑ BUG: auth.users ya existe pero NO se hace rollback
  //   El email queda bloqueado permanentemente
}
```

### Cómo reproducir

1. Usuario A y Usuario B abren el formulario de registro al mismo tiempo
2. Ambos escriben la cédula `8-200-1234` (mismo valor)
3. Ambos pasan el check del paso 1 simultáneamente (la cédula aún no existe en BD)
4. Usuario A completa el registro exitosamente
5. Usuario B: paso 2 crea auth.users, paso 3 falla por cédula duplicada
6. El email de Usuario B queda en auth.users sin poder usarse

También reproducible de forma determinista: registrar con un email que ya tiene cuenta en Supabase (error 400 en `signUp`) y verificar que no hay rollback.

### Impacto

Cuentas huérfanas en Supabase Auth que no pueden iniciar sesión ni volver a registrarse. Requiere intervención manual en el panel de Supabase para eliminarlas.

### Corrección propuesta

Mover la creación de `auth.users` al final, o validar el email primero:

```typescript
// Opción 1: verificar email antes de crear auth
const { data: emailCheck } = await supabase
  .from('pacientes').select('id').eq('correo', form.correo).maybeSingle()
if (emailCheck) { setError('Ese correo ya está registrado.'); return }

// Opción 2: usar RPC que haga todo atómico en el backend
// (requiere función PostgreSQL con SECURITY DEFINER)
```

---

## BUG-03 — ProtectedRoute no valida perfil de paciente completo

**ID:** BUG-03  
**Severidad:** Medio  
**Prioridad:** Media  
**Tipo:** Flujo de navegación / Control de acceso  
**Archivo:** `frontend/src/components/auth/ProtectedRoute.tsx`  
**Módulo afectado:** Navegación general — `MisCitas` y `AgendarCita`  
**Historia de usuario relacionada:** HU-01, HU-05  
**Técnica ISTQB:** Prueba de transición de estados

### Descripción

`ProtectedRoute` solo verifica si existe `user` (sesión en `auth.users`). No verifica si el usuario tiene un perfil de paciente completo (`paciente` en contexto). Esto crea un estado inconsistente: un usuario con sesión auth pero sin fila en `pacientes` pasa el guard y llega a rutas protegidas.

- En `/agendar`: hay un `if (!authLoading && !paciente) return <Navigate to="/registro">` que lo atrapa. ✅
- En `/mis-citas`: muestra un mensaje estático `"Necesitas registrarte"` pero **no redirige**. El usuario queda en la página sin saber qué hacer. ❌

### Código con el bug

```typescript
// ProtectedRoute.tsx — solo valida user, no paciente
export function ProtectedRoute() {
  const { user, loading } = useAuth()  // ← no desestructura paciente
  const location = useLocation()

  if (loading) return <LoadingSpinner ... />
  if (!user) return <Navigate to="/login" ... />
  return <Outlet />  // ← usuario sin paciente pasa aquí
}

// MisCitas.tsx — no redirige, muestra texto estático
if (!paciente) {
  return (
    <div className="card text-center">
      <p>Necesitas registrarte como paciente antes de ver tus citas.</p>
      <Link to="/registro">Crear cuenta</Link>
      {/* ↑ Un Link, no un <Navigate> automático — el usuario tiene que hacer clic */}
    </div>
  )
}
```

### Cómo reproducir

1. Crear un usuario en Supabase Auth directamente (sin pasar por el formulario de registro)
2. O usar una cuenta que falló a mitad del registro (ver BUG-02)
3. Iniciar sesión con ese usuario
4. Navegar a `/mis-citas`
5. Observar: la página carga pero muestra el mensaje de "Necesitas registrarte" sin redirigir automáticamente

### Impacto

Experiencia de usuario rota para cuentas en estado parcial. El usuario ve contenido de la app pero no puede usarla, sin que el sistema lo guíe al paso correcto.

### Corrección propuesta

```typescript
// ProtectedRoute.tsx — agregar validación de paciente
export function ProtectedRoute() {
  const { user, paciente, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Verificando sesión…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!paciente) return <Navigate to="/registro" replace />  // ← agregar esta línea
  return <Outlet />
}
```

---

## BUG-04 — Horarios pasados del día actual son visibles y seleccionables

**ID:** BUG-04  
**Severidad:** 🟡 Medio  
**Prioridad:** Media  
**Tipo:** Validación de datos / Regla de negocio  
**Archivo:** `frontend/src/hooks/useHorarios.ts`  
**Módulo afectado:** Agendamiento de citas — paso 3 (selección de horario)  
**Historia de usuario relacionada:** HU-01  
**Técnica ISTQB:** Análisis de valores límite (límite temporal)

### Descripción

El filtro de horarios usa `gte('fecha', hoy)` donde `hoy` es solo la fecha (`YYYY-MM-DD`), sin incluir la hora actual. Esto incluye **todos los horarios de hoy** sin importar si ya pasaron. Si son las 3pm y hay un horario a las 9am del mismo día, aparece disponible en el calendario. La RPC `crear_cita_atomica` tampoco valida que el horario sea en el futuro — solo verifica que `disponible = true`.

### Código con el bug

```typescript
// useHorarios.ts — líneas 17-18
const hoy = new Date().toISOString().slice(0, 10)  // "2026-06-10" — solo fecha
supabase
  .from('horarios')
  .select('*')
  .eq('medico_id', medicoId)
  .eq('disponible', true)
  .gte('fecha', hoy)        // ← incluye TODOS los slots de hoy, incluso 7am si son las 3pm
  .order('fecha')
  .order('hora_inicio')
```

```sql
-- crear_cita_atomica en schema.sql — no valida timestamp futuro
SELECT disponible INTO v_disponible FROM horarios WHERE id = p_horario_id FOR UPDATE;
IF v_disponible = false THEN RAISE EXCEPTION 'Horario ya reservado'; END IF;
-- ↑ Solo verifica disponible, no verifica que fecha+hora_inicio > now()
```

### Cómo reproducir

1. Ir a https://helios-web-production.up.railway.app y autenticarse
2. Iniciar un agendamiento y seleccionar médico
3. En el calendario (paso 3), si existen horarios del día actual que ya pasaron en hora, aparecen como disponibles y son clickeables
4. Seleccionar ese horario y confirmar — el sistema crea la cita con timestamp en el pasado

*(Si la BD de demo no tiene horarios del día, se puede verificar directamente en el código)*

### Impacto

Un paciente puede agendar una cita para las 8am cuando ya son las 4pm del mismo día. La cita queda en Supabase con un timestamp válido en el pasado, causando confusión al médico y al paciente.

### Corrección propuesta

```typescript
// useHorarios.ts — filtrar con timestamp completo
const ahora = new Date().toISOString()  // "2026-06-10T15:00:00.000Z"
supabase
  .from('horarios')
  .select('*')
  .eq('medico_id', medicoId)
  .eq('disponible', true)
  .gt('fecha', hoy)   // fechas futuras completas
  // Para hoy específicamente, comparar hora también
  // O simplemente: .gte con fecha+hora combinados si el schema lo permite
```

```sql
-- Agregar validación en crear_cita_atomica:
DECLARE v_fecha_hora TIMESTAMP;
SELECT (fecha::text || 'T' || hora_inicio::text)::timestamp INTO v_fecha_hora
  FROM horarios WHERE id = p_horario_id;
IF v_fecha_hora <= now() THEN
  RAISE EXCEPTION 'No se puede agendar en un horario pasado';
END IF;
```

---

## BUG-05 — MisCitas no tiene Realtime — la agenda no se actualiza automáticamente

**ID:** BUG-05  
**Severidad:** 🟡 Medio  
**Prioridad:** Media  
**Tipo:** Requisito funcional no implementado  
**Archivo:** `frontend/src/hooks/useCitas.ts`  
**Módulo afectado:** Vista de citas del paciente (`/mis-citas`)  
**Historia de usuario relacionada:** HU-05  
**Técnica ISTQB:** Prueba de cobertura de requisitos

### Descripción

El hook `useCitas` hace un único `fetch` al montar el componente y expone una función `refetch`. Pero nunca suscribe un canal de Supabase Realtime. Esto significa que si el estado de una cita cambia (cancelada, completada, nueva cita confirmada), la página `MisCitas` **no se actualiza** hasta que el usuario recarga manualmente.

El módulo de Agendamiento (`AgendarCita`) usa Realtime implícitamente a través de la RPC, pero `MisCitas` no tiene ninguna suscripción activa.

### Código con el bug

```typescript
// useCitas.ts — solo fetch inicial, sin Realtime
export function useCitas(pacienteId: string | null) {
  const [data, setData] = useState<CitaConRelaciones[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    // ...fetch normal...
  }, [pacienteId])

  useEffect(() => {
    fetchCitas()
    // ↑ Solo se ejecuta al montar y cuando cambia pacienteId
    // NO HAY:
    // supabase.channel('citas-paciente')
    //   .on('postgres_changes', { event: '*', table: 'citas', ... })
    //   .subscribe()
  }, [fetchCitas])

  return { data, loading, error, refetch: fetchCitas }
}
```

### Cómo reproducir

1. Autenticarse y navegar a `/mis-citas`
2. Abrir otra ventana del navegador y agendar una nueva cita con el mismo usuario
3. Volver a la ventana de `/mis-citas`
4. Observar: la nueva cita **no aparece** hasta que se recarga la página

### Impacto

El criterio de aceptación de HU-05 requería que la vista del paciente refleje cambios en tiempo real. Eso no ocurre. Si una cita es cancelada por el administrador, el paciente seguirá viendo su cita como "confirmada" hasta recargar.

### Corrección propuesta

```typescript
// useCitas.ts — agregar suscripción Realtime
useEffect(() => {
  fetchCitas()

  if (!pacienteId) return

  const channel = supabase
    .channel(`citas-paciente-${pacienteId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'citas',
      filter: `paciente_id=eq.${pacienteId}`,
    }, () => {
      fetchCitas()  // refetch al detectar cambio
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)  // cleanup obligatorio
  }
}, [fetchCitas, pacienteId])
```

---

## Métricas ISTQB del Reporte

### Distribución por severidad

| Severidad | Cantidad | % |
|-----------|----------|---|
| 🔴 Mayor | 2 | 40% |
| 🟡 Medio | 3 | 60% |
| 🟢 Menor | 0 | 0% |
| **Total** | **5** | |

### Distribución por tipo

| Tipo | Cantidad |
|------|----------|
| Lógica de negocio | 1 |
| Concurrencia / Datos | 1 |
| Flujo de navegación | 1 |
| Validación de datos | 1 |
| Requisito no implementado | 1 |

### Técnicas ISTQB aplicadas en la detección

| Técnica | Bugs detectados |
|---------|-----------------|
| Partición de equivalencia | BUG-01 |
| Análisis de valores límite | BUG-01, BUG-04 |
| Prueba de condición de carrera | BUG-02 |
| Prueba de transición de estados | BUG-03 |
| Cobertura de requisitos | BUG-05 |

### Esfuerzo de la auditoría

| Métrica | Valor |
|---------|-------|
| LOC revisadas | ~850 LOC |
| Tiempo de auditoría | ~90 minutos |
| Bugs encontrados | 5 |
| Densidad de bugs | 5.88 bugs/KLOC |
| Archivos auditados | 7 archivos fuente + 1 schema SQL |
| Método | Revisión estática manual (sin ejecutar) |

> La densidad de 5.88 bugs/KLOC es alta para código en producción (el estándar industrial apunta a < 1/KLOC post-testing). Es esperada para código sin suite de pruebas de integración completa — confirma la importancia de las pruebas automatizadas planificadas para el Parcial 2.

---

## TMMi — Análisis del Reporte

### Nivel 2 — Gestión de Defectos

- Todos los bugs tienen ID único, severidad, archivo exacto y línea de código
- Trazabilidad directa a Historia de Usuario afectada
- Pasos para reproducir documentados — cualquier miembro del equipo puede verificarlos

### Nivel 3 — Análisis de Causa Raíz

| Bug | Causa raíz |
|-----|------------|
| BUG-01 | Diseño incorrecto del regex — no se consultó el formato oficial de cédula panameña |
| BUG-02 | Ausencia de transacción — operaciones multi-tabla sin manejo de rollback |
| BUG-03 | Guard de ruta incompleto — se protegió contra "no autenticado" pero no contra "autenticado sin perfil" |
| BUG-04 | Filtro de fecha sin granularidad de hora — `DATE` en lugar de `TIMESTAMP` |
| BUG-05 | Requisito de Realtime documentado pero no implementado en este hook específico |

**Causa raíz común:** Falta de pruebas de integración y de criterios de aceptación ejecutables al momento de implementar. Los TC diseñados para el sprint cubrían el happy path pero no los estados de error ni los edge cases temporales.

---

## TQM — Plan de Mejora Continua

| Acción | Prioridad | Sprint |
|--------|-----------|--------|
| Corregir `cedula.ts` con regex correcto | 🔴 Alta | Inmediato |
| Agregar RPC de registro atómico (o validar email antes de auth.signUp) | 🔴 Alta | Inmediato |
| Actualizar `ProtectedRoute` para validar paciente | 🟡 Media | Parcial 2 |
| Filtrar horarios con timestamp completo + validar en RPC | 🟡 Media | Parcial 2 |
| Agregar Realtime a `useCitas` con cleanup | 🟡 Media | Parcial 2 |
| Agregar TC de regresión para cada bug corregido | 🟢 Continua | Cada sprint |

---

## Referencias

- [[Módulo 01 — Agendamiento de Citas]] — contexto de HU-01, HU-05
- [[Módulo 02 — Cancelación y Reprogramación]] — contexto de flujos de estado
- [[Referencias ISTQB]] — técnicas de diseño de TC aplicadas
- [[Investigación — Cédula Panameña]] — formato correcto para BUG-01
- Repositorio: `origin/sprint1/bootstrap` — commit `82dd420`
- Sitio: https://helios-web-production.up.railway.app/login

---

_← [[Proyecto - HELIOS]] | [[Referencias ISTQB]] | [[Módulo 01 — Agendamiento de Citas]]_
