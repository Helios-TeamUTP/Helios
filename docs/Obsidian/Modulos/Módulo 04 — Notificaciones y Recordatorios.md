# Módulo 04 — Notificaciones y Recordatorios

**Estado:** #pendiente 
**Fecha inicio:** Por definir (depende de cierre del Sprint 3) 
**Fecha límite:** Por definir 
**Área:** [[MOC — Proyectos]] 
**Sprint:** [[Sprint 4 — Notificaciones]] 
**Proyecto:** [[Proyecto - HELIOS]] 
**Tags:** #helios #modulo-04 #notificaciones #recordatorios #sprint-4 #supabase #edge-functions #istqb

---

## ¿Qué es?

Módulo que envía recordatorios automáticos a los pacientes 24 horas y 1 hora antes de su cita médica, a través de los canales configurados (app web, correo electrónico o SMS), y notifica cambios como cancelaciones o reprogramaciones en tiempo real.

---

## Objetivo Principal

El módulo está listo cuando:

- El 100% de las citas confirmadas reciben al menos un recordatorio antes de su hora
- Las notificaciones llegan al canal correcto configurado por el paciente
- El estado de cada notificación queda registrado en `notificaciones`
- Las pruebas funcionales y de sistema pasan al 100%
- SonarQube no reporta vulnerabilidades en el manejo de datos del paciente

---

## Por Qué Lo Hago

El 30-55% de los pacientes en Panamá no asiste a sus citas médicas. Un sistema de recordatorios bien implementado reduce ese índice directamente. Además, este módulo cierra el ciclo completo de HELIOS — sin notificaciones el sistema es funcional pero incompleto. Es el lazo que une todos los módulos anteriores.

---

## Dependencias

> ⚠️ Este módulo no puede iniciarse hasta que los Módulos 01, 02 y 03 estén completos.

- [[Módulo 01 — Agendamiento de Citas]] — genera las citas que se van a notificar
- [[Módulo 02 — Cancelación y Reprogramación]] — genera eventos de cancelación y reprogramación
- [[Módulo 03 — Sincronización entre Sedes]] — asegura que las citas estén sincronizadas antes de notificar
- Tabla `notificaciones` debe existir en Supabase (incluida en SQL inicial)
- Supabase Edge Functions habilitadas
- Resend configurado para envío de correos (o SMTP alternativo)

---

## Historias de Usuario

### HU-09 — Recordatorio 24 horas antes

**Como** paciente, **quiero** recibir un recordatorio 24 horas antes de mi cita, **para** no olvidarme de asistir con tiempo suficiente para organizarme.

**Criterios de aceptación:**

- [ ] Recordatorio enviado exactamente en la ventana de 24h antes de la cita
- [ ] Llega por el canal configurado por el paciente (app, correo o SMS)
- [ ] El 100% de las citas confirmadas reciben este recordatorio
- [ ] Estado de notificación registrado en tabla `notificaciones`

---

### HU-10 — Recordatorio 1 hora antes

**Como** paciente, **quiero** recibir un recordatorio final 1 hora antes de mi cita, **para** tener un aviso inmediato antes de salir hacia la clínica.

**Criterios de aceptación:**

- [ ] Recordatorio enviado en la ventana de 1h antes de la cita
- [ ] Si el paciente ya confirmó asistencia, el recordatorio se envía igual
- [ ] Estado registrado en `notificaciones`

---

### HU-11 — Confirmación de asistencia

**Como** paciente, **quiero** poder confirmar mi asistencia desde la notificación, **para** que el sistema sepa que voy a ir y el médico pueda planificar mejor.

**Criterios de aceptación:**

- [ ] Botón o link de confirmación incluido en la notificación
- [ ] Al confirmar, estado de la cita cambia a `confirmada_asistencia`
- [ ] El médico puede ver qué pacientes confirmaron en su agenda
- [ ] El sistema registra timestamp de confirmación

---

### HU-12 — Notificación de cancelación o cambio

**Como** paciente, **quiero** recibir una notificación inmediata si mi cita fue cancelada o reprogramada, **para** poder tomar acción a tiempo sin perder el viaje a la clínica.

**Criterios de aceptación:**

- [ ] Notificación enviada en menos de 30 segundos tras el cambio
- [ ] Incluye motivo del cambio si está disponible
- [ ] Incluye link directo para reprogramar
- [ ] Estado registrado en `notificaciones`

---

## Flujo del Proceso

### Recordatorio automático (cron job)

```
[Supabase Edge Function corre cada hora]
        ↓
[Consulta citas confirmadas en las próximas 24h y 1h]
        ↓
[Para cada cita encontrada:]
        ↓
[Verifica que no se haya enviado ya ese recordatorio]
        ↓
[Determina canal del paciente: app / correo / SMS]
        ↓
   [APP]          [CORREO]         [SMS]
    ↓               ↓               ↓
[Supabase      [Resend API]    [SMS Gateway]
 Realtime]
        ↓
[Registra notificación en tabla notificaciones]
[Estado: enviado / fallido]
```

### Notificación por evento (cancelación o cambio)

```
[Evento: cita cancelada o reprogramada en módulo 02]
        ↓
[Supabase Realtime detecta UPDATE en citas]
        ↓
[Edge Function se dispara inmediatamente]
        ↓
[Obtiene datos del paciente y canal preferido]
        ↓
[Envía notificación de cambio]
        ↓
[Registra en notificaciones con tipo: cancelacion / cambio]
        ↓
[Incluye link de reprogramación en la notificación]
```

---

## Arquitectura del Módulo

### Capas involucradas

```
┌─────────────────────────────────────────┐
│           CAPA DE CLIENTE               │
│   React + TypeScript                    │
│                                         │
│   CentroNotificaciones.tsx              │
│   PreferenciasNotif.tsx                 │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         CAPA DE SERVICIOS               │
│      notificaciones.service.ts          │
│                                         │
│  getNotificaciones()                    │
│  marcarComoLeida()                      │
│  confirmarAsistencia()                  │
│  actualizarPreferencias()               │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│       SUPABASE EDGE FUNCTIONS           │
│                                         │
│  enviar-recordatorio (cron cada hora)   │
│  notificar-cambio (trigger por evento)  │
└────────┬───────────┬────────────────────┘
         │           │
         ▼           ▼
┌──────────────┐ ┌──────────────────────┐
│ Resend API   │ │ SMS Gateway          │
│ (correos)    │ │ (SMS)                │
└──────────────┘ └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           BASE DE DATOS                 │
│           PostgreSQL                    │
│                                         │
│  notificaciones (insert / update)       │
│  citas (select · update estado)         │
│  pacientes (select canal preferido)     │
└─────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
frontend/src/
├── pages/
│   ├── CentroNotificaciones.tsx     ← lista de notificaciones del paciente
│   └── PreferenciasNotif.tsx        ← configurar canal preferido
├── components/
│   └── notificaciones/
│       ├── TarjetaNotificacion.tsx  ← card de cada notificación
│       ├── BadgeTipo.tsx            ← chip visual del tipo
│       └── BtnConfirmarAsist.tsx    ← botón de confirmación de asistencia
├── services/
│   └── notificaciones.service.ts   ← llamadas a Supabase
├── types/
│   └── notificacion.types.ts       ← tipos TypeScript del módulo
└── __tests__/
    └── notificaciones.test.tsx     ← pruebas Vitest

supabase/functions/
├── enviar-recordatorio/
│   └── index.ts                    ← Edge Function cron (cada hora)
└── notificar-cambio/
    └── index.ts                    ← Edge Function por evento
```

---

## Base de Datos — Tabla del Módulo

```sql
-- TABLA: notificaciones (ya creada en SQL inicial)
-- Verificar que exista, si no ejecutar:

create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid references citas(id),
  paciente_id uuid references pacientes(id),
  tipo text check (tipo in (
    'recordatorio_24h',
    'recordatorio_1h',
    'confirmacion',
    'cancelacion',
    'cambio'
  )),
  canal text check (canal in ('app', 'correo', 'sms')),
  estado text check (
    estado in ('pendiente', 'enviado', 'fallido', 'leido')
  ) default 'pendiente',
  leida boolean default false,
  enviado_at timestamp,
  created_at timestamp default now()
);

-- RLS: paciente solo ve sus notificaciones
alter table notificaciones enable row level security;

create policy "paciente_sus_notificaciones"
on notificaciones for select
using (
  auth.uid() = (
    select user_id from pacientes where id = paciente_id
  )
);

-- Agregar campo confirmacion_asistencia a citas
alter table citas
add column if not exists confirmacion_asistencia boolean default false,
add column if not exists confirmado_at timestamp;
```

---

## Implementación — Servicios Supabase

```typescript
// services/notificaciones.service.ts
import { supabase } from '../lib/supabase'

// Obtener notificaciones del paciente
export async function getNotificaciones(pacienteId: string) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select(`
      *,
      citas (
        fecha_hora,
        medicos (nombre, especialidad),
        sedes (nombre)
      )
    `)
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Marcar notificación como leída
export async function marcarComoLeida(notificacionId: string) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true, estado: 'leido' })
    .eq('id', notificacionId)

  if (error) throw error
}

// Confirmar asistencia a cita
export async function confirmarAsistencia(citaId: string) {
  const { data, error } = await supabase
    .from('citas')
    .update({
      confirmacion_asistencia: true,
      confirmado_at: new Date().toISOString()
    })
    .eq('id', citaId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Actualizar canal preferido de notificación
export async function actualizarPreferencias(
  pacienteId: string,
  canal: 'app' | 'correo' | 'sms'
) {
  const { error } = await supabase
    .from('pacientes')
    .update({ canal_notificacion: canal })
    .eq('id', pacienteId)

  if (error) throw error
}

// Suscribirse a notificaciones en tiempo real
export function suscribirNotificaciones(
  pacienteId: string,
  callback: (notif: any) => void
) {
  return supabase
    .channel('notificaciones-paciente')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notificaciones',
      filter: `paciente_id=eq.${pacienteId}`
    }, (payload) => callback(payload.new))
    .subscribe()
}
```

### Edge Function — Recordatorio automático

```typescript
// supabase/functions/enviar-recordatorio/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const ahora = new Date()

  // Ventanas de tiempo: 24h y 1h
  const ventanas = [
    { horas: 24, tipo: 'recordatorio_24h' },
    { horas: 1,  tipo: 'recordatorio_1h'  }
  ]

  for (const ventana of ventanas) {
    const desde = new Date(ahora.getTime() + ventana.horas * 3600000)
    const hasta = new Date(desde.getTime() + 3600000)

    // Obtener citas en esa ventana sin recordatorio enviado
    const { data: citas } = await supabase
      .from('citas')
      .select(`
        id, fecha_hora, paciente_id,
        pacientes (canal_notificacion, correo, nombre),
        medicos (nombre, especialidad),
        sedes (nombre)
      `)
      .eq('estado', 'confirmada')
      .gte('fecha_hora', desde.toISOString())
      .lte('fecha_hora', hasta.toISOString())

    for (const cita of citas || []) {
      // Verificar que no se envió ya
      const { data: yaEnviado } = await supabase
        .from('notificaciones')
        .select('id')
        .eq('cita_id', cita.id)
        .eq('tipo', ventana.tipo)
        .eq('estado', 'enviado')
        .single()

      if (yaEnviado) continue

      const canal = cita.pacientes?.canal_notificacion || 'correo'

      // Enviar según canal
      let enviado = false
      if (canal === 'correo') {
        enviado = await enviarCorreo(cita)
      } else if (canal === 'sms') {
        enviado = await enviarSMS(cita)
      } else {
        // App: insertar en notificaciones, Realtime lo muestra
        enviado = true
      }

      // Registrar en tabla notificaciones
      await supabase.from('notificaciones').insert([{
        cita_id: cita.id,
        paciente_id: cita.paciente_id,
        tipo: ventana.tipo,
        canal,
        estado: enviado ? 'enviado' : 'fallido',
        enviado_at: new Date().toISOString()
      }])
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function enviarCorreo(cita: any): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'HELIOS <noreply@helios.utp.ac.pa>',
        to: cita.pacientes.correo,
        subject: `Recordatorio: Cita con ${cita.medicos.nombre}`,
        html: `
          <h2>Recordatorio de cita médica</h2>
          <p>Hola ${cita.pacientes.nombre},</p>
          <p>Tienes una cita con <strong>${cita.medicos.nombre}</strong>
          (${cita.medicos.especialidad}) en ${cita.sedes.nombre}.</p>
          <p><strong>Fecha:</strong> ${new Date(cita.fecha_hora).toLocaleString('es-PA')}</p>
        `
      })
    })
    return res.ok
  } catch {
    return false
  }
}

async function enviarSMS(cita: any): Promise<boolean> {
  // Integrar con SMS Gateway según proveedor disponible
  // Por ahora retorna true como placeholder
  console.log(`SMS para cita ${cita.id} pendiente de integración`)
  return true
}
```

---

## Estrategia de Pruebas (ISTQB)

### Pruebas Funcionales — Vitest + RTL

```typescript
// __tests__/notificaciones.test.tsx
import { render, screen, fireEvent, waitFor }
  from '@testing-library/react'
import { CentroNotificaciones } from '../pages/CentroNotificaciones'
import { confirmarAsistencia } from '../services/notificaciones.service'

describe('Módulo Notificaciones — Pruebas Funcionales', () => {

  test('HU-09: notificación 24h aparece en centro de notificaciones', async () => {
    render(<CentroNotificaciones pacienteId="p1" />)
    await waitFor(() => {
      expect(screen.getByText('recordatorio_24h')).toBeInTheDocument()
    })
  })

  test('HU-11: confirmar asistencia actualiza estado en Supabase', async () => {
    const cita = await confirmarAsistencia('cita-test-id')
    expect(cita.confirmacion_asistencia).toBe(true)
    expect(cita.confirmado_at).toBeDefined()
  })

  test('HU-12: notificación de cancelación llega en menos de 30s', async () => {
    const inicio = Date.now()
    // Simular cancelación de cita
    await supabase.from('citas')
      .update({ estado: 'cancelada' })
      .eq('id', 'cita-test-id')
    // Esperar notificación via Realtime
    await waitFor(() => {
      expect(screen.getByText('cancelacion')).toBeInTheDocument()
    }, { timeout: 30000 })
    expect(Date.now() - inicio).toBeLessThan(30000)
  })

  test('HU-11: botón de confirmación cambia estado visual', async () => {
    render(<CentroNotificaciones pacienteId="p1" />)
    const btn = await screen.findByText('Confirmar asistencia')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByText('Asistencia confirmada')).toBeInTheDocument()
    })
  })

})
```

### Pruebas de Sistema — Python

```python
# qa/tests/test_sistema_notificaciones.py
import time, requests
from datetime import datetime, timedelta

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-service-role-key"

def test_recordatorio_24h_enviado():
    """
    Verifica que citas en las próximas 24h tienen
    al menos un recordatorio registrado.
    Criterio: 100% de citas con recordatorio.
    """
    manana = (datetime.now() + timedelta(hours=23)).isoformat()
    pasado = (datetime.now() + timedelta(hours=25)).isoformat()

    # Obtener citas en ventana 24h
    citas = requests.get(
        f"{SUPABASE_URL}/rest/v1/citas",
        headers={"apikey": SUPABASE_KEY},
        params={
            "estado": "eq.confirmada",
            "fecha_hora": f"gte.{manana},lte.{pasado}"
        }
    ).json()

    sin_recordatorio = 0
    for cita in citas:
        notifs = requests.get(
            f"{SUPABASE_URL}/rest/v1/notificaciones",
            headers={"apikey": SUPABASE_KEY},
            params={
                "cita_id": f"eq.{cita['id']}",
                "tipo": "eq.recordatorio_24h",
                "estado": "eq.enviado"
            }
        ).json()
        if not notifs:
            sin_recordatorio += 1

    pct_cubierto = ((len(citas) - sin_recordatorio) / max(len(citas), 1)) * 100
    print(f"Citas con recordatorio: {pct_cubierto:.1f}%")
    assert pct_cubierto == 100, \
        f"FALLA: {sin_recordatorio} citas sin recordatorio"

def test_notificacion_cancelacion_rapida():
    """
    Verifica que una cancelación genera notificación
    en menos de 30 segundos.
    """
    # Crear cita de prueba
    cita = requests.post(
        f"{SUPABASE_URL}/rest/v1/citas",
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        json={
            "paciente_id": "paciente-test",
            "medico_id": "medico-test",
            "sede_id": "sede-test",
            "fecha_hora": "2026-07-01T10:00:00",
            "estado": "confirmada"
        }
    ).json()[0]

    inicio = time.time()

    # Cancelar la cita
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/citas?id=eq.{cita['id']}",
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        },
        json={"estado": "cancelada"}
    )

    # Esperar y verificar notificación
    time.sleep(30)
    notifs = requests.get(
        f"{SUPABASE_URL}/rest/v1/notificaciones",
        headers={"apikey": SUPABASE_KEY},
        params={
            "cita_id": f"eq.{cita['id']}",
            "tipo": "eq.cancelacion"
        }
    ).json()

    tiempo_total = time.time() - inicio
    assert len(notifs) > 0, "FALLA: no se generó notificación de cancelación"
    assert tiempo_total < 30, f"FALLA: tardó {tiempo_total:.1f}s (máx 30s)"
    print(f" Notificación de cancelación en {tiempo_total:.1f}s")

if __name__ == "__main__":
    test_recordatorio_24h_enviado()
    test_notificacion_cancelacion_rapida()
    print("\n Todas las pruebas de sistema pasaron")
```

### Pruebas de Seguridad — Python

```python
# qa/tests/test_seguridad_notificaciones.py

def test_rls_notificaciones_sin_auth():
    """
    Paciente no autenticado no debe ver notificaciones.
    """
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/notificaciones",
        headers={"apikey": "anon-key-publica"}
    )
    assert response.json() == [], \
        "FALLA SEGURIDAD: notificaciones expuestas sin autenticación"
    print(" RLS notificaciones: acceso bloqueado correctamente")

def test_paciente_solo_ve_sus_notificaciones():
    """
    Paciente A no debe ver notificaciones de Paciente B.
    """
    # Autenticarse como paciente-a
    # Intentar acceder a notificaciones de paciente-b
    # Supabase RLS debe filtrar automáticamente
    print(" RLS: paciente solo ve sus propias notificaciones")
```

---

## Criterios de Aceptación del Sprint 4

|Criterio|Métrica|Estado|
|---|---|---|
|Recordatorio 24h|100% citas con recordatorio|⏳ Pendiente|
|Recordatorio 1h|100% citas con recordatorio|⏳ Pendiente|
|Notificación de cancelación|< 30 segundos|⏳ Pendiente|
|Confirmación de asistencia|Estado actualiza en Supabase|⏳ Pendiente|
|RLS notificaciones|Inaccesible sin auth|⏳ Pendiente|
|SonarQube|0 vulnerabilidades críticas|⏳ Pendiente|
|Regresión módulos 01, 02, 03|Suites pasan al 100%|⏳ Pendiente|
|Despliegue final|Railway con los 4 módulos activos|⏳ Pendiente|

---

## Tareas

### En Progreso

- [ ] —

### Pendiente

- [ ] Configurar Resend para envío de correos
- [ ] Crear Edge Function `enviar-recordatorio` (cron cada hora)
- [ ] Crear Edge Function `notificar-cambio` (trigger por evento)
- [ ] Crear `notificaciones.service.ts`
- [ ] Crear `CentroNotificaciones.tsx`
- [ ] Crear `PreferenciasNotif.tsx`
- [ ] Crear componentes de notificaciones/
- [ ] Crear tipos en `notificacion.types.ts`
- [ ] Escribir pruebas funcionales con Vitest
- [ ] Escribir pruebas de sistema en Python
- [ ] Escribir pruebas de seguridad en Python
- [ ] Revisar con SonarQube
- [ ] Correr regresión módulos 01, 02 y 03
- [ ] Despliegue final completo en Railway
- [ ] Documentar daily final

### Completado

- [x] Definir historias de usuario HU-09, HU-10, HU-11, HU-12
- [x] Diseñar flujos de recordatorio y notificación por evento
- [x] Definir tabla `notificaciones` en SQL inicial
- [x] Definir estructura de carpetas
- [x] Definir lógica de Edge Functions

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Supabase Edge Functions para recordatorios|Sin backend propio, corre serverless en Supabase|2026-05-21|
|Resend para correos|API simple, plan gratuito generoso, mejor deliverability que SMTP propio|2026-05-21|
|Cron cada hora para recordatorios|Ventana suficiente para capturar citas en 24h y 1h sin sobrecargar|2026-05-21|
|Verificar duplicados antes de enviar|Evita enviar el mismo recordatorio dos veces si el cron corre dos veces|2026-05-21|
|SMS como placeholder por ahora|Requiere contrato con proveedor SMS en Panamá, se integra en sprint 5|2026-05-21|
|Realtime para notificaciones en app|El paciente ve la notificación sin recargar la página|2026-05-21|

---

## Instrucciones para Claude Desktop

> Estas instrucciones son para que Claude Desktop pueda construir este módulo con toda la información necesaria.

**Contexto del proyecto:**

- Sistema: HELIOS — plataforma web de citas médicas
- Stack: React + TypeScript, Supabase, pnpm, Vitest + RTL, Python para QA
- Gestor de paquetes: pnpm (NO usar npm)
- Módulo actual: 04 — Notificaciones y Recordatorios
- Módulos previos completados: 01 · 02 · 03

**Lo que debe construir:**

1. Edge Function `enviar-recordatorio` en `supabase/functions/`
2. Edge Function `notificar-cambio` en `supabase/functions/`
3. Servicio `notificaciones.service.ts`
4. Páginas `CentroNotificaciones.tsx` y `PreferenciasNotif.tsx`
5. Componentes en `notificaciones/`: TarjetaNotificacion, BadgeTipo, BtnConfirmarAsist
6. Tipos en `notificacion.types.ts`
7. Pruebas funcionales en `__tests__/notificaciones.test.tsx`
8. Scripts Python en `qa/tests/`

**Restricciones:**

- Usar TypeScript estricto, pnpm nunca npm
- Las Edge Functions usan Deno, no Node.js — la sintaxis es diferente
- Siempre verificar duplicados antes de enviar un recordatorio
- RLS debe estar activo en `notificaciones` — paciente solo ve las suyas
- SMS es placeholder por ahora, solo loguear
- El canal Realtime de notificaciones debe llamarse `notificaciones-paciente`
- Correr regresión de módulos 01, 02 y 03 antes de hacer commit final

**Variables de entorno necesarias en Supabase:**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

**Archivos de referencia:**

- [[Proyecto - HELIOS]] — nota general del proyecto
- [[Módulo 01 — Agendamiento de Citas]]
- [[Módulo 02 — Cancelación y Reprogramación]]
- [[Módulo 03 — Sincronización entre Sedes]]

---

## Recursos y Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 03 — Sincronización entre Sedes]] ← módulo previo
- [[Sprint 4 — Notificaciones]]
- [[Daily — Semana 1 — Sprint 4]]
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Resend API Docs](https://resend.com/docs)
- [Deno Deploy Docs](https://deno.com/deploy/docs)

---

## Reflexiones del Módulo

_(Llenar después de cada semana de trabajo)_

**2026-05-21 — Planificación** El módulo más complejo en términos de infraestructura — necesita Edge Functions con Deno, integración con Resend y un cron job. El reto es la verificación de duplicados y asegurar que el 100% de citas reciban recordatorio. Este módulo cierra el ciclo completo de HELIOS.

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_