# Módulo 01 — Agendamiento de Citas

## Información General

| Campo | Detalle |
|-------|---------|
| **Módulo** | 01 — Agendamiento de Citas |
| **Sprint** | Sprint 1 |
| **Fecha límite** | 11 de junio de 2026 |
| **Responsable Dev** | Ethan Gonzalez (Frontend) · Alejandro Saenz (Backend) |
| **Responsable QA** | Ashley Martinez |
| **Stack** | React + TypeScript · Supabase · Vitest + RTL · Python · SonarQube |

---

## Descripción del Módulo

El módulo de agendamiento es el proceso central y de mayor volumen del sistema HELIOS. Permite a los pacientes reservar citas médicas desde el portal web, seleccionando sede, especialidad, médico y horario disponible. El médico, por su parte, puede ver su agenda actualizada en tiempo real sin necesidad de recargar la pantalla.

Este módulo es el primero en desarrollarse porque todos los demás módulos dependen de él: no puede haber cancelación, sincronización ni notificación sin una cita previamente agendada.

---

## Historias de Usuario

### HU-01 — Agendamiento desde portal web
**Como** paciente,
**quiero** seleccionar sede, especialidad, médico disponible, fecha y hora,
**para** agendar una cita médica desde el portal web sin necesidad de ir físicamente a la clínica.

**Criterios de aceptación:**
- [ ] El sistema muestra únicamente los médicos disponibles según la sede y especialidad seleccionada
- [ ] El paciente no puede seleccionar una fecha u hora ya reservada
- [ ] La cita queda registrada en Supabase en menos de 2 segundos
- [ ] El paciente recibe una confirmación visual inmediata en pantalla
- [ ] La cita aparece en la agenda del médico en menos de 5 segundos (Realtime)

---

### HU-02 — Agenda del médico en tiempo real
**Como** médico,
**quiero** ver mi agenda del día actualizada automáticamente,
**para** conocer mis citas sin necesidad de recargar la pantalla manualmente.

**Criterios de aceptación:**
- [ ] Los cambios en la agenda se reflejan en menos de 5 segundos via Supabase Realtime
- [ ] La interfaz muestra nombre del paciente, hora y sede de cada cita
- [ ] El médico puede filtrar su agenda por fecha
- [ ] La interfaz pasa validación SUS ≥ 75 sobre 100

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

## Estructura de Base de Datos

### Tablas involucradas

```sql
-- Tabla: sedes
create table sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  activa boolean default true
);

-- Tabla: medicos
create table medicos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid references sedes(id),
  nombre text not null,
  especialidad text not null,
  disponible boolean default true,
  created_at timestamp default now()
);

-- Tabla: disponibilidad
create table disponibilidad (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid references medicos(id),
  dia_semana int check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  activo boolean default true
);

-- Tabla: citas
create table citas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id),
  medico_id uuid references medicos(id),
  sede_id uuid references sedes(id),
  fecha_hora timestamp not null,
  estado text check (estado in ('confirmada', 'cancelada', 'reprogramada', 'completada')) default 'confirmada',
  created_at timestamp default now()
);
```

### Row Level Security (RLS)

```sql
-- Solo el paciente dueño puede ver sus citas
alter table citas enable row level security;

create policy "paciente_ver_sus_citas"
on citas for select
using (auth.uid() = paciente_id);

-- El médico solo ve sus propias citas
create policy "medico_ver_sus_citas"
on citas for select
using (auth.uid() = medico_id);
```

---

## Estructura de Carpetas del Módulo

```
frontend/src/
├── pages/
│   ├── AgendarCita.tsx          ← página principal del flujo
│   └── AgendaMedico.tsx         ← vista de agenda del médico
├── components/
│   ├── agendamiento/
│   │   ├── SelectorSede.tsx
│   │   ├── SelectorEspecialidad.tsx
│   │   ├── SelectorMedico.tsx
│   │   ├── SelectorHorario.tsx
│   │   └── ConfirmacionCita.tsx
│   └── agenda/
│       ├── AgendaDia.tsx
│       └── TarjetaCita.tsx
├── services/
│   └── agendamiento.service.ts  ← llamadas a Supabase
└── types/
    └── cita.types.ts            ← tipos TypeScript del módulo
```

---

## Implementación — Servicios Supabase

```typescript
// services/agendamiento.service.ts

import { supabase } from '../lib/supabase'

// Obtener médicos disponibles por sede y especialidad
export async function getMedicosDisponibles(sedeId: string, especialidad: string) {
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
export async function getHorariosDisponibles(medicoId: string, fecha: string) {
  const { data: citas } = await supabase
    .from('citas')
    .select('fecha_hora')
    .eq('medico_id', medicoId)
    .gte('fecha_hora', `${fecha}T00:00:00`)
    .lte('fecha_hora', `${fecha}T23:59:59`)
    .eq('estado', 'confirmada')

  return citas
}

// Registrar una nueva cita
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

// Escuchar cambios en tiempo real (para la agenda del médico)
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

### Pruebas Funcionales — Vitest + React Testing Library

```typescript
// __tests__/agendamiento.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgendarCita } from '../pages/AgendarCita'

describe('Módulo Agendamiento — Pruebas Funcionales', () => {

  test('HU-01: muestra solo médicos disponibles de la sede seleccionada', async () => {
    render(<AgendarCita />)
    fireEvent.change(screen.getByLabelText('Sede'), { target: { value: 'sede-1' } })
    await waitFor(() => {
      expect(screen.getByText('Dr. García')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Ausente')).not.toBeInTheDocument()
    })
  })

  test('HU-01: cita queda registrada en menos de 2 segundos', async () => {
    const inicio = Date.now()
    await crearCita({ paciente_id: 'p1', medico_id: 'm1', sede_id: 's1', fecha_hora: '2026-06-15T09:00:00' })
    const fin = Date.now()
    expect(fin - inicio).toBeLessThan(2000)
  })

  test('HU-02: agenda médico se actualiza al recibir nueva cita', async () => {
    render(<AgendaMedico medicoId="m1" />)
    // Simular inserción via Realtime
    await waitFor(() => {
      expect(screen.getByText('Paciente: Juan Pérez')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

})
```

### Pruebas de Rendimiento — Python

```python
# qa/tests/test_rendimiento_agendamiento.py

import time
import threading
import requests

SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL=https://uobhbikcctausgpnzsph.supabase.co"
SUPABASE_KEY =                                           "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zrtmuwjriEJcMfYbawtHhQ_7oPs8FsQNEXT_PUBLIC_SUPABASE_URL=https://uobhbikcctausgpnzsph.supabase.co"

def agendar_cita(usuario_id):
    inicio = time.time()
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/citas",
        headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
        json={
            "paciente_id": f"paciente-{usuario_id}",
            "medico_id": "medico-1",
            "sede_id": "sede-1",
            "fecha_hora": "2026-06-15T09:00:00",
            "estado": "confirmada"
        }
    )
    fin = time.time()
    return fin - inicio, response.status_code

def test_carga_hora_pico():
    """
    Simula 100 usuarios concurrentes agendando citas.
    Criterio: 95% de respuestas en menos de 2 segundos.
    """
    resultados = []
    hilos = []

    for i in range(100):
        hilo = threading.Thread(target=lambda: resultados.append(agendar_cita(i)))
        hilos.append(hilo)

    for hilo in hilos:
        hilo.start()
    for hilo in hilos:
        hilo.join()

    tiempos = [r[0] for r in resultados]
    exitosos = sum(1 for t in tiempos if t < 2.0)
    porcentaje = (exitosos / len(tiempos)) * 100

    print(f"Tiempo promedio: {sum(tiempos)/len(tiempos):.2f}s")
    print(f"Respuestas < 2s: {porcentaje:.1f}%")

    assert porcentaje >= 95, f"Falla: solo {porcentaje:.1f}% respondió en < 2s"

if __name__ == "__main__":
    test_carga_hora_pico()
```

### Pruebas de Usabilidad — SUS

Aplicar el cuestionario SUS (System Usability Scale) a una muestra de 5 médicos tras usar el módulo.

**Criterio de aceptación:** Puntaje SUS ≥ 75 sobre 100.

**Las 10 preguntas SUS (escala 1-5):**
1. Creo que me gustaría usar este sistema frecuentemente.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría el apoyo de un técnico para usar este sistema.
5. Encontré que las funciones del sistema están bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Me imagino que la mayoría de las personas aprendería a usar este sistema muy rápidamente.
8. Encontré el sistema muy incómodo de usar.
9. Me sentí muy seguro usando el sistema.
10. Necesité aprender muchas cosas antes de poder empezar a usar el sistema.

**Fórmula:** Sumar puntajes impares menos 1, restar puntajes pares de 5, multiplicar total por 2.5.

---

## Criterios de Aceptación del Sprint 1

| Criterio | Métrica | Estado |
|----------|---------|--------|
| Flujo completo de agendamiento funciona | Pruebas funcionales 100% pasan | Pendiente |
| Rendimiento en carga | 95% respuestas < 2s con 100 usuarios | Pendiente |
| Agenda médico en tiempo real | Cambio visible < 5s | Pendiente |
| Calidad de código | SonarQube 0 issues críticos | Pendiente |
| Usabilidad | SUS ≥ 75 | Pendiente |
| Despliegue | Sistema corriendo en Railway | Pendiente |

---

## Política de Calidad del Módulo

- Todo código nuevo debe pasar SonarQube antes de hacer merge
- Ningún PR se aprueba sin pruebas unitarias del flujo cubierto
- El flujo completo de agendamiento debe funcionar end-to-end antes del daily semanal
- Los criterios de aceptación de cada HU deben estar verificados antes de cerrar el sprint

---

## Referencias

- ISTQB Foundation Level Syllabus (2018) — Tipos de pruebas aplicados
- ISO/IEC 25010:2011 — Dimensiones: eficiencia de desempeño, usabilidad, fiabilidad
- Brooke, J. (1996) — SUS: A quick and dirty usability scale
- Supabase Docs — Realtime, RLS, PostgREST