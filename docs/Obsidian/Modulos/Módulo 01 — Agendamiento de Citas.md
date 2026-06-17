# Módulo 01 — Agendamiento de Citas

**Estado:** #activo 
**Fecha inicio:** 2026-05-21 
**Fecha límite:** 2026-06-11 
**Área:** [[MOC — Proyectos]] 
**Sprint:** [[Sprint 1 — Agendamiento de Citas]] 
**Proyecto:** [[Proyecto - HELIOS]]
**Tags:** #helios #modulo-01 #agendamiento #sprint-1 #react #supabase #istqb

---

## ¿Qué es?

Módulo central del sistema HELIOS que permite a los pacientes agendar citas médicas desde el portal web seleccionando sede, especialidad, médico y horario, y al médico ver su agenda actualizada en tiempo real.

---

## Objetivo Principal

El módulo está listo cuando:

- El paciente puede completar el flujo completo de agendamiento en menos de 2 minutos
- La cita queda registrada en Supabase en menos de 2 segundos
- La agenda del médico se actualiza en menos de 5 segundos via Realtime
- Las pruebas funcionales pasan al 100%
- El rendimiento aguanta 100 usuarios concurrentes con 95% de respuestas bajo 2 segundos
- SonarQube no reporta issues críticos
- SUS ≥ 75 sobre 100

---

## Por Qué Lo Hago

Este es el módulo más importante del sistema — todos los demás dependen de él. Sin una cita agendada no hay nada que cancelar, sincronizar ni notificar. Si este módulo falla, todo HELIOS falla. Por eso va primero y con el mayor nivel de detalle.

---

## Historias de Usuario

### HU-01 — Agendamiento desde portal web

**Como** paciente, **quiero** seleccionar sede, especialidad, médico disponible, fecha y hora, **para** agendar una cita médica desde el portal web sin ir físicamente a la clínica.

**Criterios de aceptación:**

- [ ] Muestra solo médicos disponibles según sede y especialidad seleccionada
- [ ] No permite seleccionar fecha u hora ya reservada
- [ ] Cita registrada en Supabase en menos de 2 segundos
- [ ] Paciente recibe confirmación visual inmediata en pantalla
- [ ] Cita aparece en agenda del médico en menos de 5 segundos

---

### HU-02 — Agenda del médico en tiempo real

**Como** médico, **quiero** ver mi agenda actualizada automáticamente, **para** conocer mis citas sin recargar la pantalla manualmente.

**Criterios de aceptación:**

- [ ] Cambios visibles en menos de 5 segundos via Supabase Realtime
- [ ] Muestra nombre del paciente, hora y sede de cada cita
- [ ] Médico puede filtrar agenda por fecha
- [ ] Interfaz pasa SUS ≥ 75 sobre 100

---

## Flujo del Proceso

```
[Paciente abre el portal web]
        ↓
[Selecciona sede]
        ↓
[Selecciona especialidad médica]
        ↓
[Sistema consulta médicos disponibles en Supabase]
        ↓
[Paciente selecciona médico]
        ↓
[Sistema consulta horarios disponibles]
        ↓
[Paciente selecciona fecha y hora]
        ↓
[Sistema valida disponibilidad en tiempo real]
        ↓
[Paciente confirma la cita]
        ↓
[Sistema registra la cita en Supabase]
        ↓
[Supabase Realtime notifica al frontend del médico]
        ↓
[Paciente ve confirmación en pantalla]
[Médico ve la nueva cita en su agenda]
```

---

## Arquitectura del Módulo

### Capas involucradas

```
┌─────────────────────────────────────────┐
│           CAPA DE CLIENTE               │
│   React + TypeScript (Web Responsive)   │
│                                         │
│  AgendarCita.tsx   AgendaMedico.tsx     │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         CAPA DE SERVICIOS               │
│      agendamiento.service.ts            │
│                                         │
│  getMedicosDisponibles()                │
│  getHorariosDisponibles()               │
│  crearCita()                            │
│  suscribirAgendaMedico()  ← Realtime    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│            SUPABASE                     │
│                                         │
│  PostgREST API  →  citas                │
│  PostgREST API  →  medicos              │
│  PostgREST API  →  disponibilidad       │
│  Realtime       →  channel agenda       │
│  Auth           →  RLS por rol          │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           BASE DE DATOS                 │
│           PostgreSQL                    │
│                                         │
│  sedes · medicos · disponibilidad       │
│  pacientes · citas                      │
└─────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
frontend/src/
├── pages/
│   ├── AgendarCita.tsx           ← página principal del flujo
│   └── AgendaMedico.tsx          ← vista de agenda del médico
├── components/
│   └── agendamiento/
│       ├── SelectorSede.tsx
│       ├── SelectorEspecialidad.tsx
│       ├── SelectorMedico.tsx
│       ├── SelectorHorario.tsx
│       └── ConfirmacionCita.tsx
│   └── agenda/
│       ├── AgendaDia.tsx
│       └── TarjetaCita.tsx
├── services/
│   └── agendamiento.service.ts   ← llamadas a Supabase
├── types/
│   └── cita.types.ts             ← tipos TypeScript del módulo
└── __tests__/
    └── agendamiento.test.tsx     ← pruebas Vitest
```

---

## Base de Datos — Tablas del Módulo

### Tablas involucradas

```sql
-- TABLA: sedes
create table sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  activa boolean default true
);

-- TABLA: medicos
create table medicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  sede_id uuid references sedes(id),
  nombre text not null,
  especialidad text not null,
  disponible boolean default true,
  created_at timestamp default now()
);

-- TABLA: disponibilidad
create table disponibilidad (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid references medicos(id),
  dia_semana int check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  activo boolean default true
);

-- TABLA: citas
create table citas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id),
  medico_id uuid references medicos(id),
  sede_id uuid references sedes(id),
  fecha_hora timestamp not null,
  estado text check (
    estado in ('confirmada','cancelada','reprogramada','completada')
  ) default 'confirmada',
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### RLS — Seguridad por roles

```sql
alter table citas enable row level security;

-- Paciente ve solo sus citas
create policy "paciente_sus_citas"
on citas for select
using (auth.uid() = (
  select user_id from pacientes where id = paciente_id
));

-- Paciente puede crear citas
create policy "paciente_crear_cita"
on citas for insert
with check (auth.uid() = (
  select user_id from pacientes where id = paciente_id
));

-- Médico ve sus propias citas
create policy "medico_sus_citas"
on citas for select
using (auth.uid() = (
  select user_id from medicos where id = medico_id
));

-- Todos pueden ver sedes activas
create policy "ver_sedes"
on sedes for select
using (activa = true);

-- Todos pueden ver médicos disponibles
create policy "ver_medicos"
on medicos for select
using (disponible = true);

-- Todos pueden ver disponibilidad activa
create policy "ver_disponibilidad"
on disponibilidad for select
using (activo = true);
```

---

## Implementación — Servicios Supabase

```typescript
// services/agendamiento.service.ts
import { supabase } from '../lib/supabase'

// Obtener médicos disponibles por sede y especialidad
export async function getMedicosDisponibles(
  sedeId: string,
  especialidad: string
) {
  const { data, error } = await supabase
    .from('medicos')
    .select('*')
    .eq('sede_id', sedeId)
    .eq('especialidad', especialidad)
    .eq('disponible', true)

  if (error) throw error
  return data
}

// Obtener horarios disponibles de un médico en una fecha
export async function getHorariosDisponibles(
  medicoId: string,
  fecha: string
) {
  const { data, error } = await supabase
    .from('citas')
    .select('fecha_hora')
    .eq('medico_id', medicoId)
    .gte('fecha_hora', `${fecha}T00:00:00`)
    .lte('fecha_hora', `${fecha}T23:59:59`)
    .eq('estado', 'confirmada')

  if (error) throw error
  return data
}

// Registrar nueva cita
export async function crearCita(cita: {
  paciente_id: string
  medico_id: string
  sede_id: string
  fecha_hora: string
}) {
  const { data, error } = await supabase
    .from('citas')
    .insert([cita])
    .select()
    .single()

  if (error) throw error
  return data
}

// Realtime — escuchar nuevas citas del médico
export function suscribirAgendaMedico(
  medicoId: string,
  callback: (cita: any) => void
) {
  return supabase
    .channel('agenda-medico')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'citas',
      filter: `medico_id=eq.${medicoId}`
    }, (payload) => callback(payload.new))
    .subscribe()
}
```

---

## Estrategia de Pruebas (ISTQB)

### Pruebas Funcionales — Vitest + RTL

```typescript
// __tests__/agendamiento.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgendarCita } from '../pages/AgendarCita'

describe('Módulo Agendamiento — Pruebas Funcionales', () => {

  test('HU-01: muestra solo médicos disponibles', async () => {
    render(<AgendarCita />)
    fireEvent.change(screen.getByLabelText('Sede'), {
      target: { value: 'sede-1' }
    })
    await waitFor(() => {
      expect(screen.getByText('Dr. García')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Ausente')).not.toBeInTheDocument()
    })
  })

  test('HU-01: cita registrada en menos de 2 segundos', async () => {
    const inicio = Date.now()
    await crearCita({
      paciente_id: 'p1',
      medico_id: 'm1',
      sede_id: 's1',
      fecha_hora: '2026-06-15T09:00:00'
    })
    expect(Date.now() - inicio).toBeLessThan(2000)
  })

  test('HU-02: agenda médico se actualiza con nueva cita', async () => {
    render(<AgendaMedico medicoId="m1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

})
```

### Pruebas de Rendimiento — Python

```python
# qa/tests/test_rendimiento_agendamiento.py
import time, threading, requests

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-anon-key"

def agendar_cita(usuario_id):
    inicio = time.time()
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/citas",
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        },
        json={
            "paciente_id": f"paciente-{usuario_id}",
            "medico_id": "medico-1",
            "sede_id": "sede-1",
            "fecha_hora": "2026-06-15T09:00:00",
            "estado": "confirmada"
        }
    )
    return time.time() - inicio, response.status_code

def test_carga_hora_pico():
    """
    Simula 100 usuarios concurrentes.
    Criterio: 95% de respuestas en menos de 2 segundos.
    """
    resultados = []
    hilos = [
        threading.Thread(
          target=lambda i=i: resultados.append(agendar_cita(i))
        )
        for i in range(100)
    ]
    for h in hilos: h.start()
    for h in hilos: h.join()

    tiempos = [r[0] for r in resultados]
    pct = sum(1 for t in tiempos if t < 2.0) / len(tiempos) * 100

    print(f"Promedio: {sum(tiempos)/len(tiempos):.2f}s")
    print(f"Bajo 2s: {pct:.1f}%")
    assert pct >= 95, f"Falla: solo {pct:.1f}% respondió en < 2s"

if __name__ == "__main__":
    test_carga_hora_pico()
```

### Pruebas de Usabilidad — SUS

Aplicar a 5 médicos tras usar el módulo. Criterio: **SUS ≥ 75**.

|#|Pregunta|Escala|
|---|---|---|
|1|Creo que me gustaría usar este sistema frecuentemente|1–5|
|2|Encontré el sistema innecesariamente complejo|1–5|
|3|Pensé que el sistema era fácil de usar|1–5|
|4|Creo que necesitaría apoyo técnico para usarlo|1–5|
|5|Las funciones del sistema están bien integradas|1–5|
|6|Había demasiada inconsistencia en el sistema|1–5|
|7|La mayoría aprendería a usarlo muy rápido|1–5|
|8|Encontré el sistema muy incómodo de usar|1–5|
|9|Me sentí seguro usando el sistema|1–5|
|10|Necesité aprender muchas cosas antes de usarlo|1–5|

**Fórmula:** (suma impares − 5) + (25 − suma pares) × 2.5

---

## Criterios de Aceptación del Sprint 1

| Criterio                | Métrica                            | Estado    |
| ----------------------- | ---------------------------------- | --------- |
| Flujo completo funciona | Pruebas funcionales 100%           | Pendiente |
| Rendimiento en carga    | 95% respuestas < 2s / 100 usuarios | Pendiente |
| Agenda en tiempo real   | Cambio visible < 5s                | Pendiente |
| Calidad de código       | SonarQube 0 issues críticos        | Pendiente |
| Usabilidad              | SUS ≥ 75                           | Pendiente |
| Despliegue              | Sistema corriendo en Railway       | Pendiente |

---

## Tareas

### En Progreso

- [ ] Crear proyecto React con pnpm + TypeScript
- [ ] Crear `lib/supabase.ts` con credenciales
- [ ] Construir componentes del flujo de agendamiento con Claude Code

### Pendiente

- [ ] Crear `agendamiento.service.ts`
- [ ] Conectar Supabase Realtime a `AgendaMedico.tsx`
- [ ] Escribir pruebas funcionales con Vitest
- [ ] Correr script Python de rendimiento
- [ ] Aplicar SUS a equipo (simulado)
- [ ] Revisar con SonarQube
- [ ] Desplegar en Railway
- [ ] Documentar daily semana 1

### Completado

- [x] Definir historias de usuario HU-01 y HU-02
- [x] Diseñar flujo del proceso
- [x] Crear tablas SQL en Supabase
- [x] Configurar RLS en Supabase
- [x] Definir estructura de carpetas

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Supabase Realtime para agenda del médico|Evita polling, más eficiente y en tiempo real sin backend propio|2026-05-21|
|RLS en lugar de validación solo en frontend|Seguridad a nivel de base de datos, no depende del cliente|2026-05-21|
|Un servicio por módulo|Separación de responsabilidades, Claude Code puede trabajar módulo por módulo|2026-05-21|
|SUS como instrumento de usabilidad|Estándar publicado y validado por la industria (Brooke, 1996)|2026-05-21|

---

## Instrucciones para Claude Desktop

> Estas instrucciones son para que Claude Desktop pueda construir este módulo con toda la información necesaria.

**Contexto del proyecto:**

- Sistema: HELIOS — plataforma web de citas médicas
- Stack: React + TypeScript, Supabase, pnpm, Vitest + RTL
- Gestor de paquetes: pnpm (NO usar npm)
- Módulo actual: 01 — Agendamiento de Citas

**Lo que debe construir:**

1. Los componentes listados en la sección de estructura de carpetas
2. El servicio `agendamiento.service.ts` con las funciones definidas
3. Las pruebas funcionales en `__tests__/agendamiento.test.tsx`
4. Los tipos TypeScript en `cita.types.ts`

**Restricciones:**

- Usar TypeScript estricto en todo el código
- Usar pnpm, nunca npm
- Seguir la estructura de carpetas definida exactamente
- Todo componente debe tener su tipo definido en `cita.types.ts`
- Las llamadas a Supabase van solo en el archivo de servicios, nunca directo en los componentes
- El Realtime debe desuscribirse en el `useEffect` cleanup para evitar memory leaks

**Archivos de referencia:**

- [[Proyecto - HELIOS]] — nota general del proyecto
- [[Arquitectura General]] — `docs/arquitectura-helios.html` en GitHub
- [[Módulo 02 — Cancelación y Reprogramación]] — para entender cómo se relacionan los módulos

---

## Recursos y Referencias

- [[Proyecto - HELIOS]]← proyecto padre
- [[Sprint 1 — Agendamiento de Citas]]
- [[Daily — Semana 1 — Sprint 0]]
- [[Sprint 2 — Cancelación y Reprogramación]]
- [[Daily — Semana 3 — Sprint 1]]
- [[Módulo 02 — Cancelación y Reprogramación]]
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Vitest Docs](https://vitest.dev/)
- [SUS — Brooke (1996)](https://www.usability.gov/how-to-and-tools/methods/system-usability-scale.html)

---

## Reflexiones del Módulo

_(Llenar después de cada semana de trabajo)_

**2026-05-21 — Inicio** Módulo más importante del sistema. Toda la arquitectura, base de datos y flujo están definidos antes de escribir código. El reto principal va a ser el Realtime de Supabase — nunca lo hemos usado en el equipo.

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_