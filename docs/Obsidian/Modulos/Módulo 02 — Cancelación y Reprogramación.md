# Módulo 02 — Cancelación y Reprogramación

**Estado:** #pendiente 
**Fecha inicio:** Por definir (depende de cierre del Sprint 1) 
**Fecha límite:** Por definir 
**Área:** [[MOC — Proyectos]] 
**Sprint:** [[Sprint 2 — Cancelación]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #modulo-02 #cancelacion #reprogramacion #sprint-2 #react #supabase #istqb

---

## ¿Qué es?

Módulo que permite al paciente cancelar o reprogramar una cita previamente confirmada desde la sección "Mis Citas", aplicando reglas de negocio (mínimo 24h de anticipación) y notificando automáticamente al médico afectado.

---

## Objetivo Principal

El módulo está listo cuando:

- El paciente puede cancelar una cita en máximo 2 clics
- El slot liberado queda disponible en la agenda en menos de 5 segundos
- La reprogramación redirige correctamente al flujo de agendamiento manteniendo médico y especialidad
- El médico recibe notificación del cambio en menos de 5 segundos
- Las pruebas funcionales y de integración pasan al 100%
- SonarQube no reporta issues críticos

---

## Por Qué Lo Hago

Este módulo depende directamente del Módulo 01. Sin citas agendadas no hay nada que cancelar. Es el segundo en importancia porque el 30-55% de los pacientes en Panamá no asiste a sus citas — tener un flujo limpio de cancelación y reprogramación reduce ese índice y optimiza la agenda de los médicos.

---

## Dependencias

> ⚠️ Este módulo no puede iniciarse hasta que el Módulo 01 esté completo y desplegado.

- [[Módulo 01 — Agendamiento de Citas]] — las tablas `citas`, `medicos`, `sedes` y `pacientes` deben existir
- Supabase Realtime activo (configurado en módulo 01)
- Sistema de notificaciones básico (se completa en módulo 04)

---

## Historias de Usuario

### HU-03 — Cancelar una cita

**Como** paciente, **quiero** cancelar una cita desde "Mis Citas", **para** liberar el espacio si no puedo asistir sin tener que llamar a la clínica.

**Criterios de aceptación:**

- [ ] Solo se puede cancelar con mínimo 24 horas de anticipación
- [ ] El sistema muestra advertencia si no cumple el tiempo mínimo
- [ ] El slot queda disponible en la agenda en menos de 5 segundos
- [ ] El médico recibe notificación del cambio
- [ ] El estado de la cita cambia a `cancelada` en Supabase
- [ ] La cita cancelada aparece en historial del paciente con estado visible

---

### HU-04 — Reprogramar una cita

**Como** paciente, **quiero** reprogramar una cita sin cancelarla manualmente y crear una nueva, **para** hacerlo en un solo flujo sin perder mis datos.

**Criterios de aceptación:**

- [ ] El sistema redirige al flujo de agendamiento manteniendo sede, especialidad y médico
- [ ] La cita anterior cambia a estado `reprogramada`
- [ ] La nueva cita queda registrada como `confirmada`
- [ ] El cambio se refleja en todas las sedes en menos de 3 segundos
- [ ] El médico recibe notificación de la reprogramación

---

### HU-05 — Ver historial de citas

**Como** paciente, **quiero** ver mis citas pasadas y sus estados, **para** tener un registro de mi historial médico de citas.

**Criterios de aceptación:**

- [ ] Lista de citas ordenada por fecha descendente
- [ ] Cada cita muestra: fecha, hora, médico, sede y estado
- [ ] Estados visibles: confirmada, cancelada, reprogramada, completada
- [ ] Filtro por estado disponible

---

## Flujo del Proceso

### Cancelación

```
[Paciente accede a "Mis Citas"]
        ↓
[Sistema carga citas confirmadas del paciente desde Supabase]
        ↓
[Paciente selecciona cita a cancelar]
        ↓
[Sistema valida: ¿faltan más de 24h para la cita?]
        ↓
   [SÍ]                          [NO]
    ↓                              ↓
[Muestra confirmación]    [Muestra error: tiempo mínimo
    ↓                      de cancelación no cumplido]
[Paciente confirma]
    ↓
[Sistema actualiza estado a "cancelada" en Supabase]
    ↓
[Supabase Realtime notifica al frontend del médico]
    ↓
[Slot liberado en disponibilidad]
    ↓
[Paciente ve confirmación de cancelación]
[Médico ve cita cancelada en su agenda]
```

### Reprogramación

```
[Paciente selecciona "Reprogramar" en una cita]
        ↓
[Sistema guarda datos de la cita actual]
        ↓
[Sistema actualiza estado a "reprogramada"]
        ↓
[Redirige a flujo de agendamiento]
[Pre-carga: sede, especialidad y médico de la cita anterior]
        ↓
[Paciente selecciona nueva fecha y hora]
        ↓
[Sistema registra nueva cita como "confirmada"]
        ↓
[Médico recibe notificación de reprogramación]
        ↓
[Paciente ve confirmación de nueva cita]
```

---

## Arquitectura del Módulo

### Capas involucradas

```
┌─────────────────────────────────────────┐
│           CAPA DE CLIENTE               │
│   React + TypeScript (Web Responsive)   │
│                                         │
│  MisCitas.tsx      HistorialCitas.tsx   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         CAPA DE SERVICIOS               │
│      cancelacion.service.ts             │
│                                         │
│  getCitasPaciente()                     │
│  cancelarCita()                         │
│  reprogramarCita()                      │
│  validarTiempoMinimo()                  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│            SUPABASE                     │
│                                         │
│  PostgREST API  →  citas (update)       │
│  PostgREST API  →  citas (select)       │
│  Realtime       →  channel agenda       │
│  Auth           →  RLS por rol          │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           BASE DE DATOS                 │
│           PostgreSQL                    │
│                                         │
│  citas (update estado)                  │
│  disponibilidad (liberar slot)          │
└─────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
frontend/src/
├── pages/
│   ├── MisCitas.tsx               ← lista de citas del paciente
│   └── HistorialCitas.tsx         ← historial con filtros
├── components/
│   └── cancelacion/
│       ├── TarjetaCita.tsx        ← card de cada cita con acciones
│       ├── ModalCancelar.tsx      ← confirmación de cancelación
│       ├── ModalReprogramar.tsx   ← inicio del flujo de reprogramación
│       └── BadgeEstado.tsx        ← chip visual del estado de la cita
├── services/
│   └── cancelacion.service.ts    ← llamadas a Supabase
├── types/
│   └── cancelacion.types.ts      ← tipos TypeScript del módulo
└── __tests__/
    └── cancelacion.test.tsx      ← pruebas Vitest
```

---

## Base de Datos — Cambios del Módulo

> Las tablas ya existen desde el Módulo 01. Este módulo solo hace UPDATE sobre `citas`.

### Queries principales

```sql
-- Ver citas activas del paciente
select
  c.id,
  c.fecha_hora,
  c.estado,
  m.nombre as medico,
  m.especialidad,
  s.nombre as sede
from citas c
join medicos m on c.medico_id = m.id
join sedes s on c.sede_id = s.id
where c.paciente_id = $1
  and c.estado in ('confirmada', 'reprogramada')
order by c.fecha_hora asc;

-- Cancelar cita (validar 24h en servicio antes de ejecutar)
update citas
set estado = 'cancelada', updated_at = now()
where id = $1
  and paciente_id = $2
  and estado = 'confirmada';

-- Reprogramar cita (marcar anterior + crear nueva)
update citas
set estado = 'reprogramada', updated_at = now()
where id = $1;

insert into citas (paciente_id, medico_id, sede_id, fecha_hora)
values ($1, $2, $3, $4);
```

### RLS adicional

```sql
-- Paciente puede actualizar (cancelar/reprogramar) solo sus citas
create policy "paciente_actualizar_cita"
on citas for update
using (
  auth.uid() = (select user_id from pacientes where id = paciente_id)
  and estado = 'confirmada'
);
```

---

## Implementación — Servicios Supabase

```typescript
// services/cancelacion.service.ts
import { supabase } from '../lib/supabase'

// Obtener citas activas del paciente
export async function getCitasPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id, fecha_hora, estado,
      medicos (nombre, especialidad),
      sedes (nombre)
    `)
    .eq('paciente_id', pacienteId)
    .in('estado', ['confirmada', 'reprogramada'])
    .order('fecha_hora', { ascending: true })

  if (error) throw error
  return data
}

// Validar si la cita puede cancelarse (min 24h)
export function validarTiempoMinimo(fechaHoraCita: string): boolean {
  const ahora = new Date()
  const cita = new Date(fechaHoraCita)
  const diferenciaHoras = (cita.getTime() - ahora.getTime()) / (1000 * 60 * 60)
  return diferenciaHoras >= 24
}

// Cancelar cita
export async function cancelarCita(citaId: string) {
  const { data, error } = await supabase
    .from('citas')
    .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
    .eq('id', citaId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Reprogramar cita (marca anterior + crea nueva)
export async function reprogramarCita(
  citaId: string,
  nuevaCita: {
    paciente_id: string
    medico_id: string
    sede_id: string
    fecha_hora: string
  }
) {
  // Marcar cita anterior como reprogramada
  const { error: errorUpdate } = await supabase
    .from('citas')
    .update({ estado: 'reprogramada', updated_at: new Date().toISOString() })
    .eq('id', citaId)

  if (errorUpdate) throw errorUpdate

  // Crear nueva cita
  const { data, error: errorInsert } = await supabase
    .from('citas')
    .insert([nuevaCita])
    .select()
    .single()

  if (errorInsert) throw errorInsert
  return data
}

// Obtener historial completo del paciente
export async function getHistorialCitas(pacienteId: string) {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id, fecha_hora, estado, created_at,
      medicos (nombre, especialidad),
      sedes (nombre)
    `)
    .eq('paciente_id', pacienteId)
    .order('fecha_hora', { ascending: false })

  if (error) throw error
  return data
}
```

---

## Estrategia de Pruebas (ISTQB)

### Pruebas Funcionales — Vitest + RTL

```typescript
// __tests__/cancelacion.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MisCitas } from '../pages/MisCitas'
import { validarTiempoMinimo } from '../services/cancelacion.service'

describe('Módulo Cancelación — Pruebas Funcionales', () => {

  test('HU-03: no permite cancelar con menos de 24h de anticipación', () => {
    const fechaManana = new Date()
    fechaManana.setHours(fechaManana.getHours() + 12) // 12h desde ahora
    expect(validarTiempoMinimo(fechaManana.toISOString())).toBe(false)
  })

  test('HU-03: permite cancelar con más de 24h de anticipación', () => {
    const fechaPasada = new Date()
    fechaPasada.setHours(fechaPasada.getHours() + 48) // 48h desde ahora
    expect(validarTiempoMinimo(fechaPasada.toISOString())).toBe(true)
  })

  test('HU-03: slot queda liberado en menos de 5 segundos', async () => {
    const inicio = Date.now()
    await cancelarCita('cita-test-id')
    expect(Date.now() - inicio).toBeLessThan(5000)
  })

  test('HU-04: reprogramación mantiene datos del médico', async () => {
    render(<MisCitas pacienteId="p1" />)
    const btnReprogramar = await screen.findByText('Reprogramar')
    fireEvent.click(btnReprogramar)
    await waitFor(() => {
      expect(screen.getByText('Dr. García')).toBeInTheDocument()
      expect(screen.getByText('Medicina General')).toBeInTheDocument()
    })
  })

  test('HU-05: historial muestra todos los estados', async () => {
    render(<MisCitas pacienteId="p1" />)
    await waitFor(() => {
      expect(screen.getByText('confirmada')).toBeInTheDocument()
      expect(screen.getByText('cancelada')).toBeInTheDocument()
    })
  })

})
```

### Pruebas de Integración — Vitest

```typescript
// __tests__/integracion-cancelacion.test.ts
import { cancelarCita, getCitasPaciente } from '../services/cancelacion.service'

describe('Integración — Cancelación y Base de Datos', () => {

  test('cancelar cita actualiza estado en Supabase', async () => {
    const cita = await cancelarCita('cita-test-id')
    expect(cita.estado).toBe('cancelada')
    expect(cita.updated_at).toBeDefined()
  })

  test('cita cancelada no aparece en citas activas', async () => {
    await cancelarCita('cita-test-id')
    const citas = await getCitasPaciente('paciente-test-id')
    const citaCancelada = citas?.find(c => c.id === 'cita-test-id')
    expect(citaCancelada).toBeUndefined()
  })

  test('reprogramación crea nueva cita y marca anterior', async () => {
    const nueva = await reprogramarCita('cita-vieja-id', {
      paciente_id: 'p1',
      medico_id: 'm1',
      sede_id: 's1',
      fecha_hora: '2026-06-20T10:00:00'
    })
    expect(nueva.estado).toBe('confirmada')
  })

})
```

### Pruebas de Regresión

Correr el suite completo del Módulo 01 después de cada cambio en este módulo para asegurar que el agendamiento sigue funcionando correctamente.

```bash
pnpm vitest run __tests__/agendamiento.test.tsx
pnpm vitest run __tests__/cancelacion.test.tsx
```

---

## Criterios de Aceptación del Sprint 2

|Criterio|Métrica|Estado|
|---|---|---|
|Cancelación completa funciona|Pruebas funcionales 100%|⏳ Pendiente|
|Regla de 24h aplicada|Validación en servicio + UI|⏳ Pendiente|
|Slot liberado en tiempo|< 5 segundos|⏳ Pendiente|
|Reprogramación mantiene datos|Prueba de integración pasa|⏳ Pendiente|
|Módulo 01 no regresiona|Suite módulo 01 pasa al 100%|⏳ Pendiente|
|Calidad de código|SonarQube 0 issues críticos|⏳ Pendiente|
|Despliegue actualizado|Railway con módulo 02 activo|⏳ Pendiente|

---

## Tareas

### En Progreso

- [ ] —

### Pendiente

- [ ] Crear `MisCitas.tsx` y `HistorialCitas.tsx`
- [ ] Crear componentes de cancelacion/
- [ ] Crear `cancelacion.service.ts`
- [ ] Crear tipos en `cancelacion.types.ts`
- [ ] Escribir pruebas funcionales
- [ ] Escribir pruebas de integración
- [ ] Correr suite de regresión del módulo 01
- [ ] Revisar con SonarQube
- [ ] Actualizar despliegue en Railway
- [ ] Documentar daily

### Completado

- [x] Definir historias de usuario HU-03, HU-04, HU-05
- [x] Diseñar flujo de cancelación y reprogramación
- [x] Definir queries SQL del módulo
- [x] Definir estructura de carpetas

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Validar 24h en el servicio, no en la BD|El servicio puede dar feedback inmediato al usuario antes de ir a Supabase|2026-05-21|
|Reprogramar = update + insert (no delete)|Conservar historial completo de la cita original por trazabilidad|2026-05-21|
|Pre-cargar datos del médico en reprogramación|Mejor UX, el paciente no repite selecciones innecesarias|2026-05-21|
|Pruebas de regresión del módulo 01 obligatorias|Cualquier cambio en `citas` puede afectar el agendamiento|2026-05-21|

---

## Instrucciones para Claude Desktop

> Estas instrucciones son para que Claude Desktop pueda construir este módulo con toda la información necesaria.

**Contexto del proyecto:**

- Sistema: HELIOS — plataforma web de citas médicas
- Stack: React + TypeScript, Supabase, pnpm, Vitest + RTL
- Gestor de paquetes: pnpm (NO usar npm)
- Módulo actual: 02 — Cancelación y Reprogramación
- Módulo previo completado: [[Módulo 01 — Agendamiento de Citas]]

**Lo que debe construir:**

1. Página `MisCitas.tsx` con lista de citas activas y acciones
2. Página `HistorialCitas.tsx` con filtros por estado
3. Componentes en `cancelacion/`: TarjetaCita, ModalCancelar, ModalReprogramar, BadgeEstado
4. Servicio `cancelacion.service.ts` con todas las funciones definidas
5. Pruebas funcionales y de integración en `__tests__/cancelacion.test.tsx`
6. Tipos en `cancelacion.types.ts`

**Restricciones:**

- Usar TypeScript estricto en todo el código
- Usar pnpm, nunca npm
- Seguir la estructura de carpetas definida exactamente
- La validación de 24h va en el servicio, no en el componente
- Las llamadas a Supabase van solo en el archivo de servicios
- Al reprogramar: marcar cita anterior como `reprogramada` ANTES de crear la nueva
- Correr suite de regresión del módulo 01 antes de hacer commit

**Archivos de referencia:**

- [[Proyecto - HELIOS]] — nota general del proyecto
- [[Módulo 01 — Agendamiento de Citas]] — módulo previo, tablas ya creadas
- [[Módulo 03 — Sincronización entre Sedes]] — siguiente módulo

---

## Recursos y Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 01 — Agendamiento de Citas]] ← módulo previo
- [[Módulo 03 — Sincronización entre Sedes]] ← siguiente módulo
- [[Sprint 2 — Cancelación]]
- [[Daily — Semana 1 — Sprint 2]]
- [Supabase Update Docs](https://supabase.com/docs/reference/javascript/update)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Vitest Docs](https://vitest.dev/)

---

## Reflexiones del Módulo

_(Llenar después de cada semana de trabajo)_

**2026-05-21 — Planificación** Módulo más lógico del sistema. El reto principal es la regla de negocio de 24h y asegurar que la reprogramación no deje datos huérfanos en la base de datos. Las pruebas de integración van a ser clave aquí.

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_