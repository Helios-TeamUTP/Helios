# Módulo 02 — Cancelación y Reprogramación (Sprint 2)

**Estado:** #activo 
**Fecha inicio:** 2026-05-30 
**Fecha fin:** 2026-06-12 
**Sprint:** Sprint 2 
**Proyecto:** [[Proyecto - HELIOS]] 
**URL Producción:** https://helios-web-production.up.railway.app 
**Repo:** https://github.com/MarianC-programing/Helios 
**Jira Epic:** HELL-3 
**Tags:** #helios #modulo-02 #cancelacion #reprogramacion #sprint-2

---

## Contexto del proyecto al inicio del Sprint 2

### Stack tecnológico real (Sprint 1 cerrado)

- **Frontend:** React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 3
- **Backend:** Supabase 2 (PostgreSQL 15 + Auth + REST API automática)
- **Routing:** React Router 7
- **Calendario:** FullCalendar 6 (desktop) + Vista lista custom (mobile)
- **Testing unitario:** Vitest + RTL 4.1
- **Pruebas de carga:** Locust 2.x (Python)
- **Hosting:** Railway (deploy CI automático desde GitHub)
- **Gestor de paquetes:** pnpm (NUNCA usar npm)

### Estado del código al cierre del Sprint 1

- 65 tests automatizados pasando
- Cobertura: 61.4% statements / 82% lines / 90.9% functions
- Latencia P95: 300ms con 200 usuarios concurrentes
- 20 bugs detectados y resueltos (B-01 a B-20)
- Deploy en producción verificado HTTP 200

### Estructura de carpetas existente

```
frontend/src/
├── components/
│   ├── agendamiento/     ← Sprint 1 completo
│   │   ├── SelectorEspecialidad.tsx
│   │   ├── SelectorSede.tsx
│   │   ├── ListaMedicos.tsx
│   │   ├── CalendarioCitas.tsx      ← FullCalendar desktop
│   │   ├── CalendarioCitasLista.tsx ← Vista mobile
│   │   ├── FormularioConfirmacion.tsx
│   │   └── ResumenCita.tsx
│   ├── auth/
│   │   └── ProtectedRoute.tsx       ← con requireRole
│   ├── layout/
│   │   └── AppLayout.tsx            ← sticky top-0 z-50
│   ├── medico/
│   │   └── MedicoDashboard.tsx      ← dashboard médico completo
│   └── shared/
│       ├── Spinner.tsx
│       └── ErrorMessage.tsx
├── hooks/
│   ├── useAuth.tsx        ← con withTimeout, sessionStorage
│   ├── useCitas.ts
│   ├── useMedicoCitas.ts
│   └── useIsMobile.ts
├── lib/
│   ├── supabase.ts        ← sessionStorage (no localStorage)
│   ├── cedula.ts          ← CORREGIR bug B-21 (ver abajo)
│   ├── withTimeout.ts     ← helper timeout 15s
│   └── types.ts
├── pages/
│   ├── Home.tsx
│   ├── AgendarCita.tsx    ← wizard completo
│   ├── MisCitas.tsx       ← listar citas del paciente
│   ├── MedicoDashboard.tsx
│   ├── Login.tsx
│   └── Register.tsx
└── test/
    └── setup.ts           ← mocks de Supabase

supabase/
├── schema.sql             ← esquema principal
└── migrations/            ← migraciones aplicadas

scripts/
├── seed_data.py           ← seed con Locust
└── locustfile.py          ← pruebas de carga

docs/
├── CLAUDE.md              ← LEER PRIMERO — reglas del equipo
├── CONTEXTO_SESION_ULTIMA.md
├── MEMORIA_SPRINT_1_FINAL.md
├── PLAN_SPRINT_2.md
└── PLAN_SPRINT_3.md
```

### Base de datos existente (6 tablas principales)

```
sedes          → 3 registros
especialidades → 5 registros
medicos        → 20 registros (con cuentas demo)
horarios       → 1200+ slots
pacientes      → variable (se crean en producción)
citas          → variable
```

**Tablas de vínculo con auth:**

- `auth_paciente_link` — vincula auth.users con pacientes
- `auth_medico_link` — vincula auth.users con medicos

**Funciones RPC atómicas existentes:**

- `crear_cita_atomica(paciente_id, horario_id, ...)` — mutex a nivel BD

---

## Bugs pendientes a resolver ANTES de empezar el Sprint 2

### B-21: Regex de cédula muy restrictivo

**Síntoma:** La cédula de la profesora (formato corto como `8-123-1`) era rechazada **Causa:** Regex con longitud fija no cubre todos los formatos panameños **Archivo:** `frontend/src/lib/cedula.ts`

**Fix requerido:**

```typescript
// REEMPLAZAR el regex actual con:
const REGEX_CEDULA = /^(PE|E|N|[23456789](?:AV|PI)?|1[0123]?(?:AV|PI)?)-(\d{1,4})-(\d{1,6})$/i

export function validarCedula(cedula: string): boolean {
  if (!cedula || typeof cedula !== 'string') return false
  const limpia = cedula.trim().toUpperCase()
  return REGEX_CEDULA.test(limpia)
}
```

**Formatos válidos en Panamá:**

|Tipo|Formato|Ejemplo|
|---|---|---|
|Nacional|`[1-13]-[1-4 dígitos]-[1-6 dígitos]`|`8-926-1601` o `8-1-1`|
|Panameño exterior|`PE-[tomo]-[asiento]`|`PE-12-345`|
|Extranjero|`E-[tomo]-[asiento]`|`E-8-12345`|
|Naturalizado|`N-[tomo]-[asiento]`|`N-19-12345`|
|Indígena|`[#]PI-[tomo]-[asiento]`|`9PI-123-456`|
|Histórico|`[#]AV-[tomo]-[asiento]`|`3AV-12-345`|

**Tests a agregar en `cedula.test.ts`:**

- `8-123-1` → válida (tomo y asiento cortos)
- `PE-12-345` → válida
- `9PI-123-456` → válida
- `0-123-456` → inválida (provincia 0 no existe)
- `8-1234567-1` → inválida (tomo > 4 dígitos)

---

### B-22: Fechas erróneas en el calendario

**Síntoma:** Al agendar, las fechas mostradas no correspondían al día correcto **Causa probable:** Diferencia de timezone UTC vs America/Panama (UTC-5) **Archivos a revisar:** Componente de calendario + seed_data.py

**Fix requerido en frontend:**

```typescript
// Siempre mostrar fechas en timezone de Panamá
const fechaLocal = new Date(horario.fecha_hora).toLocaleString('es-PA', {
  timeZone: 'America/Panama',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
```

**Fix requerido en seed_data.py:**

```python
from datetime import datetime, timezone
# Guardar horarios en UTC (14:00 UTC = 09:00 Panamá)
fecha = datetime(2026, 6, 10, 14, 0, 0, tzinfo=timezone.utc)
```

---

## Sprint 2 — Historias de Usuario

### HU-06 (HELL-3 ST-4 a ST-7): Cancelar cita confirmada

**Como** paciente autenticado, **quiero** cancelar una de mis citas confirmadas, **para** liberar el horario si no puedo asistir.

**Story Points:** 5

**Criterios de aceptación:**

- [ ] Solo se puede cancelar con mínimo 24 horas de anticipación
- [ ] Si faltan menos de 24h, mostrar mensaje claro con la política
- [ ] Al cancelar: estado de cita → `cancelada`, horario → `disponible = true`
- [ ] Operación atómica (función RPC) — no puede quedar cita cancelada con horario aún reservado
- [ ] El médico ve la cita como cancelada en su dashboard
- [ ] Registro en `citas_historial` con motivo y timestamp
- [ ] Confirmación visual inmediata al paciente
- [ ] Operación completa < 2 segundos

---

### HU-07 (HELL-3 ST-6 a ST-8): Reprogramar cita

**Como** paciente autenticado, **quiero** reprogramar una de mis citas a otro horario disponible, **para** cambiar la fecha/hora sin perder mi turno con el mismo médico.

**Story Points:** 8

**Criterios de aceptación:**

- [ ] Mostrar solo horarios disponibles del mismo médico
- [ ] Al reprogramar: horario anterior → `disponible = true`, nuevo → `disponible = false`
- [ ] Estado de la cita original → `reprogramada`, nueva cita → `confirmada`
- [ ] Operación atómica (función RPC)
- [ ] Registro completo en `citas_historial`
- [ ] Dashboard médico refleja el cambio
- [ ] Confirmación visual con nuevo horario
- [ ] Operación completa < 2 segundos

---

## Tareas técnicas — Sprint 2

### Alejandro (Tech Lead — Backend SQL)

**ST-1: `cancelar_cita_atomica(cita_id, motivo)`** — 2 SP

```sql
-- Función RPC que en una transacción:
-- 1. Verifica que la cita pertenece al paciente autenticado
-- 2. Verifica que faltan > 24h para la cita
-- 3. Actualiza cita.estado = 'cancelada'
-- 4. Actualiza horario.disponible = true
-- 5. Inserta en citas_historial
CREATE OR REPLACE FUNCTION cancelar_cita_atomica(
  p_cita_id uuid,
  p_motivo text DEFAULT 'No especificado'
) RETURNS json ...
```

**ST-2: `reprogramar_cita_atomica(cita_id, nuevo_horario_id)`** — 3 SP

```sql
-- Función RPC que en una transacción:
-- 1. Verifica ownership de la cita
-- 2. Libera horario anterior
-- 3. Reserva nuevo horario
-- 4. Actualiza estado cita original → 'reprogramada'
-- 5. Crea nueva cita con estado 'confirmada'
-- 6. Inserta en citas_historial (dos registros)
CREATE OR REPLACE FUNCTION reprogramar_cita_atomica(
  p_cita_id uuid,
  p_nuevo_horario_id uuid
) RETURNS json ...
```

**ST-3: Tabla `citas_historial` + triggers** — 2 SP

```sql
CREATE TABLE citas_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id uuid REFERENCES citas(id),
  accion text CHECK (accion IN ('creada','cancelada','reprogramada','completada','no_asistio')),
  motivo text,
  horario_anterior_id uuid,
  horario_nuevo_id uuid,
  realizado_por uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now()
);
-- RLS: paciente ve su historial, médico ve historial de sus citas
```

---

### Ethan (Dev Frontend)

**ST-4: Hook `useCancelarCita`** — 1 SP

```typescript
// hooks/useCancelarCita.ts
export function useCancelarCita() {
  // Llama a cancelar_cita_atomica via supabase.rpc()
  // Maneja loading, error, success
  // Invalida cache de useCitas
}
```

**ST-5: Componente `BotonCancelarCita`** — 1 SP

```typescript
// components/cancelacion/BotonCancelarCita.tsx
// Muestra botón "Cancelar cita"
// Abre modal de confirmación con:
//   - Resumen de la cita
//   - Advertencia política 24h
//   - Selector de motivo
//   - Botones: "Confirmar cancelación" (rojo) / "Volver"
// Deshabilita el botón si faltan < 24h
```

**ST-6: Hook + página `ReprogramarCita`** — 3 SP

```typescript
// pages/ReprogramarCita.tsx
// Recibe cita_id como param de ruta
// Muestra: resumen de cita actual + calendario del mismo médico
// Solo muestra horarios futuros disponibles
// Al seleccionar nuevo horario: llama reprogramar_cita_atomica
// Redirige a MisCitas con mensaje de éxito
```

**ST-7: Actualizar `MisCitas.tsx`** — 1 SP

```typescript
// Agregar a cada card de cita:
// - Botón "Cancelar" → BotonCancelarCita
// - Botón "Reprogramar" → navega a /reprogramar/:citaId
// - Badge de estado actualizado (cancelada, reprogramada)
// - Sección "Historial de cambios" expandible
```

---

### Ashley (QA Engineer)

**ST-9: Tests + smoke post-deploy**

Pruebas funcionales requeridas:

```typescript
// __tests__/cancelacion.test.tsx
describe('Cancelación de cita', () => {
  it('muestra botón cancelar en citas confirmadas')
  it('deshabilita cancelar si faltan < 24h')
  it('muestra modal de confirmación al hacer click')
  it('requiere seleccionar motivo antes de confirmar')
  it('muestra mensaje de éxito tras cancelar')
  it('la cita desaparece de citas activas tras cancelar')
})

// __tests__/reprogramacion.test.tsx
describe('Reprogramación de cita', () => {
  it('muestra solo horarios del mismo médico')
  it('no muestra horarios ya ocupados')
  it('no muestra horarios en el pasado')
  it('confirma reprogramación con nuevo horario')
  it('redirige a MisCitas con mensaje de éxito')
})
```

---

### Marian (Scrum Master / DevOps)

**CI/CD — Integrar SonarCloud:**

```yaml
# .github/workflows/ci.yml — agregar:
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Locust — Subir a 300 usuarios:**

```python
# scripts/locustfile.py
# Cambiar: --users 200 → --users 300
# Meta: P95 < 2000ms con 300 usuarios
```

---

## Compromisos del Sprint 2

|Compromiso|Responsable|Criterio|
|---|---|---|
|Bug B-21 cédula corregido|Ethan|Tests nuevos pasando|
|Bug B-22 fechas corregido|Ethan + Alejandro|Fecha correcta en Panamá|
|Cancelar cita funcional|Alejandro + Ethan|RPC atómica + UI|
|Reprogramar cita funcional|Alejandro + Ethan|RPC atómica + UI|
|Tabla citas_historial|Alejandro|Con RLS|
|Tests funcionales|Ashley|≥ 80% cobertura módulo 2|
|SonarCloud en CI|Marian|Pipeline verde|
|Locust 300 usuarios|Marian + Ashley|P95 < 2000ms|
|Tests E2E básicos (Playwright)|Ashley|Al menos flujo cancelar|

---

## Reglas obligatorias del equipo (de CLAUDE.md)

1. **Plan antes de código** — siempre proponer y esperar aprobación antes de tocar archivos
2. **pnpm siempre** — nunca npm ni yarn
3. **TypeScript estricto** — no usar `any`, no ignorar errores de tipos
4. **Llamadas a Supabase solo en hooks o lib/** — nunca directamente en componentes
5. **sessionStorage** para auth (no localStorage)
6. **withTimeout(15s)** en todas las llamadas a Supabase que puedan colgar
7. **try/catch/finally** en todos los hooks de datos
8. **Cada bug nuevo genera su test de regresión**
9. **Code review obligatorio** antes de merge a main
10. **Colores del sistema:** azul `#003087`, rojo `#CE1126`

---

## Instrucciones para Claude Desktop

**Contexto:** Continúas el trabajo del Sprint 1 de HELIOS. El sistema ya está en producción en https://helios-web-production.up.railway.app. Tienes 65 tests pasando y un MVP funcional de agendamiento.

**Lo que debes hacer en el Sprint 2:**

1. Corregir B-21 (cédula) en `lib/cedula.ts`
2. Corregir B-22 (timezone) en el componente de calendario y seed
3. Crear función SQL `cancelar_cita_atomica`
4. Crear función SQL `reprogramar_cita_atomica`
5. Crear tabla `citas_historial` con triggers
6. Crear hook `useCancelarCita`
7. Crear componente `BotonCancelarCita` con modal
8. Crear página `ReprogramarCita`
9. Actualizar `MisCitas.tsx` con los botones de acción
10. Escribir tests funcionales para ambos flujos

**ANTES de escribir cualquier código:**

- Leer `docs/CLAUDE.md` — reglas obligatorias
- Leer `docs/CONTEXTO_SESION_ULTIMA.md` — estado actual
- Leer `docs/MEMORIA_SPRINT_1_FINAL.md` — bugs ya resueltos

**Lo que NO debes hacer:**

- Usar npm o yarn (solo pnpm)
- Usar localStorage (solo sessionStorage para auth)
- Poner lógica de Supabase en componentes (solo en hooks o lib/)
- Usar `any` en TypeScript
- Omitir try/catch/finally en hooks de datos
- Olvidar withTimeout en llamadas a Supabase

---

## Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 01 — Agendamiento de Citas]] ← Sprint 1 completo
- [[Sprint 1 — Agendamiento de Citas]] ← cerrado
- [[Sprint 2 — Cancelación y Reprogramación]]
- [[Daily — Semana 1 — Sprint 0]]
- [Producción](https://helios-web-production.up.railway.app/)
- [GitHub](https://github.com/MarianC-programing/Helios)
- [Jira HELL-3](https://helios-group.atlassian.net/)

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_