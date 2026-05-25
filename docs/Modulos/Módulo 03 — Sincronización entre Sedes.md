# Módulo 03 — Sincronización entre Sedes

**Estado:** #pendiente 
**Fecha inicio:** Por definir (depende de cierre del Sprint 2) 
**Fecha límite:** Por definir 
**Área:** [[MOC — Proyectos]] 
**Sprint:** [[Sprint 3 — Sincronización]] 
**Proyecto:** [[Proyecto - HELIOS]]
**Tags:** #helios #modulo-03 #sincronizacion #realtime #sprint-3 #supabase #istqb #seguridad

---

## ¿Qué es?

Módulo técnico más crítico del sistema HELIOS que garantiza que cualquier cambio realizado en una sede (cita agendada, cancelada o reprogramada) se propague automáticamente a todas las demás sedes en menos de 3 segundos, con reintentos automáticos ante fallos y registro de logs de cada operación.

---

## Objetivo Principal

El módulo está listo cuando:

- Cualquier cambio en una sede se replica en todas las demás en menos de 3 segundos en el 99% de los casos
- Los fallos de sincronización se reintentan automáticamente hasta 3 veces
- Si persiste el fallo, el administrador recibe una alerta
- Cada sincronización queda registrada en `sync_logs`
- Las pruebas de integración y seguridad pasan al 100%
- SonarQube no reporta vulnerabilidades críticas en el manejo de datos

---

## Por Qué Lo Hago

Este es el módulo que diferencia a HELIOS de un sistema de citas simple. Sin sincronización, cada sede opera como una isla de datos — un médico en Sede Colón no sabe que su paciente canceló desde Sede Panamá. Este fue uno de los síntomas más reportados en el caso: módulos que no sincronizan. Resolverlo bien es el core técnico del proyecto.

---

## Dependencias

> ⚠️ Este módulo no puede iniciarse hasta que los Módulos 01 y 02 estén completos.

- [[Módulo 01 — Agendamiento de Citas]] — genera los eventos de INSERT en `citas`
- [[Módulo 02 — Cancelación y Reprogramación]] — genera los eventos de UPDATE en `citas`
- Tabla `sync_logs` debe existir en Supabase (incluida en el SQL inicial)
- Supabase Realtime habilitado en la tabla `citas`

---

## Historias de Usuario

### HU-06 — Sincronización automática entre sedes

**Como** administrador del sistema, **quiero** que cualquier cambio en una sede se replique automáticamente en todas las demás, **para** garantizar que la información sea consistente en toda la red de policlínicas.

**Criterios de aceptación:**

- [ ] Cambio visible en todas las sedes en menos de 3 segundos
- [ ] El 99% de las sincronizaciones se completan exitosamente
- [ ] Cada sincronización queda registrada en `sync_logs`
- [ ] Los datos en tránsito están protegidos (RLS activo)

---

### HU-07 — Reintentos automáticos ante fallos

**Como** administrador del sistema, **quiero** que el sistema reintente la sincronización automáticamente si falla, **para** minimizar la pérdida de datos sin intervención manual.

**Criterios de aceptación:**

- [ ] El sistema reintenta hasta 3 veces con espera exponencial (1s, 2s, 4s)
- [ ] Si los 3 intentos fallan, se genera una alerta al administrador
- [ ] El log registra el número de intentos y el error
- [ ] El usuario final no percibe el fallo si el reintento es exitoso

---

### HU-08 — Dashboard de sincronización

**Como** administrador del sistema, **quiero** ver el estado de sincronización entre sedes en tiempo real, **para** detectar problemas antes de que afecten a los usuarios.

**Criterios de aceptación:**

- [ ] Panel muestra estado de cada sede (sincronizada / con fallos)
- [ ] Lista de últimas 50 sincronizaciones con estado
- [ ] Filtro por sede y por estado (exitoso / fallido / reintentando)
- [ ] Indicador visual de salud del sistema

---

## Flujo del Proceso

### Sincronización exitosa

```
[Evento generado en cualquier sede]
[INSERT, UPDATE o DELETE en tabla citas]
        ↓
[Supabase Realtime detecta el cambio]
        ↓
[Sistema propaga el cambio a todas las sedes via Realtime]
        ↓
[Cada sede recibe y aplica el cambio]
        ↓
[Sistema registra sync_log con estado "exitoso"]
        ↓
[Dashboard actualiza estado de sedes]
```

### Sincronización con fallo y reintento

```
[Evento generado en sede A]
        ↓
[Supabase Realtime intenta propagar]
        ↓
[Sede B no confirma recepción]
        ↓
[Sistema espera 1 segundo → reintento 1]
        ↓
   [ÉXITO]                    [FALLO]
    ↓                           ↓
[Log: exitoso]         [Espera 2s → reintento 2]
                                ↓
                       [ÉXITO]       [FALLO]
                        ↓              ↓
                    [Log: exitoso] [Espera 4s → reintento 3]
                                        ↓
                                [ÉXITO]     [FALLO]
                                 ↓            ↓
                             [Log: exitoso] [Log: fallido]
                                            [Alerta al admin]
```

---

## Arquitectura del Módulo

### Capas involucradas

```
┌─────────────────────────────────────────┐
│           CAPA DE CLIENTE               │
│   React + TypeScript                    │
│                                         │
│   DashboardSync.tsx (solo admin)        │
│   StatusSede.tsx                        │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         CAPA DE SERVICIOS               │
│      sincronizacion.service.ts          │
│                                         │
│  suscribirCambiosCitas()  ← Realtime    │
│  registrarSyncLog()                     │
│  getSyncLogs()                          │
│  reintentarSync()                       │
│  notificarAdminFallo()                  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│            SUPABASE                     │
│                                         │
│  Realtime   →  channel citas-sync       │
│  PostgREST  →  sync_logs (insert)       │
│  PostgREST  →  sync_logs (select)       │
│  Edge Fn    →  notificacion admin       │
│  Auth + RLS →  datos protegidos         │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           BASE DE DATOS                 │
│           PostgreSQL                    │
│                                         │
│  citas (escucha cambios)                │
│  sync_logs (registra operaciones)       │
└─────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
frontend/src/
├── pages/
│   └── DashboardSync.tsx           ← panel de administrador
├── components/
│   └── sincronizacion/
│       ├── StatusSede.tsx          ← estado visual de cada sede
│       ├── TablaSyncLogs.tsx       ← tabla de logs paginada
│       └── AlertaFallo.tsx        ← notificación de fallo crítico
├── services/
│   └── sincronizacion.service.ts  ← lógica de sync y reintentos
├── types/
│   └── sincronizacion.types.ts    ← tipos TypeScript del módulo
└── __tests__/
    └── sincronizacion.test.tsx    ← pruebas de integración
```

---

## Base de Datos — Tabla del Módulo

```sql
-- TABLA: sync_logs (ya creada en SQL inicial)
-- Verificar que exista, si no ejecutar:

create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  sede_origen_id uuid references sedes(id),
  sede_destino_id uuid references sedes(id),
  tabla text not null,
  operacion text check (operacion in ('insert','update','delete')),
  registro_id uuid not null,
  estado text check (
    estado in ('exitoso','fallido','reintentando')
  ) default 'exitoso',
  intentos int default 1,
  error_mensaje text,
  created_at timestamp default now()
);

-- Habilitar RLS en sync_logs
alter table sync_logs enable row level security;

-- Solo administradores ven los logs
create policy "admin_ver_sync_logs"
on sync_logs for select
using (
  auth.uid() in (
    select user_id from medicos where especialidad = 'admin'
  )
);

-- Habilitar Realtime en tabla citas
alter publication supabase_realtime add table citas;
```

---

## Implementación — Servicios Supabase

```typescript
// services/sincronizacion.service.ts
import { supabase } from '../lib/supabase'

const MAX_REINTENTOS = 3

// Suscribirse a cambios en citas (todas las sedes)
export function suscribirCambiosCitas(
  callback: (payload: any) => void
) {
  return supabase
    .channel('citas-sync')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'citas'
    }, (payload) => callback(payload))
    .subscribe()
}

// Registrar log de sincronización
export async function registrarSyncLog(log: {
  sede_origen_id: string
  sede_destino_id: string
  tabla: string
  operacion: string
  registro_id: string
  estado: 'exitoso' | 'fallido' | 'reintentando'
  intentos: number
  error_mensaje?: string
}) {
  const { error } = await supabase
    .from('sync_logs')
    .insert([log])

  if (error) console.error('Error registrando sync log:', error)
}

// Obtener logs de sincronización
export async function getSyncLogs(filtros?: {
  sedeId?: string
  estado?: string
  limite?: number
}) {
  let query = supabase
    .from('sync_logs')
    .select(`
      *,
      sede_origen:sedes!sede_origen_id(nombre),
      sede_destino:sedes!sede_destino_id(nombre)
    `)
    .order('created_at', { ascending: false })
    .limit(filtros?.limite || 50)

  if (filtros?.sedeId) {
    query = query.eq('sede_origen_id', filtros.sedeId)
  }
  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Reintento con espera exponencial
export async function reintentarSync(
  operacion: () => Promise<any>,
  contexto: {
    sede_origen_id: string
    sede_destino_id: string
    registro_id: string
    tabla: string
    tipo: string
  }
): Promise<boolean> {
  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      await operacion()

      await registrarSyncLog({
        ...contexto,
        operacion: contexto.tipo,
        estado: 'exitoso',
        intentos: intento
      })

      return true
    } catch (error: any) {
      const esUltimoIntento = intento === MAX_REINTENTOS

      await registrarSyncLog({
        ...contexto,
        operacion: contexto.tipo,
        estado: esUltimoIntento ? 'fallido' : 'reintentando',
        intentos: intento,
        error_mensaje: error.message
      })

      if (esUltimoIntento) {
        await notificarAdminFallo(contexto, error.message)
        return false
      }

      // Espera exponencial: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, intento - 1)))
    }
  }
  return false
}

// Notificar al administrador de fallo crítico
export async function notificarAdminFallo(
  contexto: any,
  errorMensaje: string
) {
  const { error } = await supabase.functions.invoke('notificar-admin', {
    body: {
      tipo: 'fallo_sincronizacion',
      contexto,
      error: errorMensaje,
      timestamp: new Date().toISOString()
    }
  })
  if (error) console.error('Error notificando al admin:', error)
}
```

---

## Estrategia de Pruebas (ISTQB)

### Pruebas de Integración — Vitest

```typescript
// __tests__/sincronizacion.test.tsx
import { registrarSyncLog, getSyncLogs, reintentarSync }
  from '../services/sincronizacion.service'

describe('Módulo Sincronización — Pruebas de Integración', () => {

  test('HU-06: cambio se propaga en menos de 3 segundos', async () => {
    const inicio = Date.now()
    // Simular inserción en citas y esperar propagación
    await supabase.from('citas').insert([citaTest])
    await new Promise(r => setTimeout(r, 3000))
    const logs = await getSyncLogs({ estado: 'exitoso' })
    expect(logs?.length).toBeGreaterThan(0)
    expect(Date.now() - inicio).toBeLessThan(3000)
  })

  test('HU-06: sync_log registrado correctamente', async () => {
    await registrarSyncLog({
      sede_origen_id: 'sede-1',
      sede_destino_id: 'sede-2',
      tabla: 'citas',
      operacion: 'insert',
      registro_id: 'cita-test',
      estado: 'exitoso',
      intentos: 1
    })
    const logs = await getSyncLogs({ estado: 'exitoso' })
    expect(logs?.[0].estado).toBe('exitoso')
  })

  test('HU-07: reintento exitoso en segundo intento', async () => {
    let llamadas = 0
    const operacionFallaPrimero = async () => {
      llamadas++
      if (llamadas === 1) throw new Error('Fallo simulado')
    }

    const resultado = await reintentarSync(operacionFallaPrimero, {
      sede_origen_id: 'sede-1',
      sede_destino_id: 'sede-2',
      registro_id: 'test',
      tabla: 'citas',
      tipo: 'insert'
    })

    expect(resultado).toBe(true)
    expect(llamadas).toBe(2)
  })

  test('HU-07: notifica admin después de 3 fallos', async () => {
    const operacionSiempreFalla = async () => {
      throw new Error('Fallo persistente')
    }

    const resultado = await reintentarSync(operacionSiempreFalla, {
      sede_origen_id: 'sede-1',
      sede_destino_id: 'sede-2',
      registro_id: 'test',
      tabla: 'citas',
      tipo: 'insert'
    })

    expect(resultado).toBe(false)
    // Verificar que el log final tiene estado 'fallido'
    const logs = await getSyncLogs({ estado: 'fallido' })
    expect(logs?.[0].intentos).toBe(3)
  })

})
```

### Pruebas de Seguridad — Python + SonarQube

```python
# qa/tests/test_seguridad_sincronizacion.py
import requests

SUPABASE_URL = "https://tu-proyecto.supabase.co"

def test_rls_sync_logs_sin_auth():
    """
    Un usuario sin autenticación NO debe poder ver sync_logs.
    Criterio: respuesta 401 o datos vacíos.
    """
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sync_logs",
        headers={"apikey": "anon-key-publica"}
    )
    # RLS debe bloquear el acceso
    data = response.json()
    assert data == [] or response.status_code == 401, \
        "FALLA SEGURIDAD: sync_logs expuesto sin autenticación"
    print("RLS sync_logs: acceso bloqueado correctamente")

def test_datos_en_transito_protegidos():
    """
    Verificar que las llamadas a Supabase usan HTTPS.
    """
    assert SUPABASE_URL.startswith("https://"), \
        "FALLA SEGURIDAD: comunicación no usa HTTPS"
    print("HTTPS: comunicación encriptada verificada")

def test_no_datos_sensibles_en_logs():
    """
    sync_logs no debe contener datos personales del paciente.
    """
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sync_logs?select=*",
        headers={
            "apikey": "service-role-key",
            "Authorization": "Bearer service-role-key"
        }
    )
    logs = response.json()
    for log in logs:
        assert 'cedula' not in str(log), \
            "FALLA SEGURIDAD: cédula encontrada en sync_logs"
        assert 'correo' not in str(log), \
            "FALLA SEGURIDAD: correo encontrado en sync_logs"
    print("Datos sensibles: no expuestos en logs")

if __name__ == "__main__":
    test_rls_sync_logs_sin_auth()
    test_datos_en_transito_protegidos()
    test_no_datos_sensibles_en_logs()
    print("\n Todas las pruebas de seguridad pasaron")
```

### Pruebas de Rendimiento — Python

```python
# qa/tests/test_rendimiento_sincronizacion.py
import time, threading, requests

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-anon-key"

def simular_cambio_sede(sede_id, cita_id):
    inicio = time.time()
    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/citas?id=eq.{cita_id}",
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        },
        json={"estado": "confirmada"}
    )
    return time.time() - inicio, response.status_code

def test_sincronizacion_bajo_carga():
    """
    Simula 50 cambios concurrentes entre sedes.
    Criterio: 99% completados en menos de 3 segundos.
    """
    resultados = []
    hilos = [
        threading.Thread(
            target=lambda i=i: resultados.append(
                simular_cambio_sede('sede-1', f'cita-{i}')
            )
        )
        for i in range(50)
    ]
    for h in hilos: h.start()
    for h in hilos: h.join()

    tiempos = [r[0] for r in resultados]
    pct = sum(1 for t in tiempos if t < 3.0) / len(tiempos) * 100

    print(f"Promedio: {sum(tiempos)/len(tiempos):.2f}s")
    print(f"Bajo 3s: {pct:.1f}%")
    assert pct >= 99, f"Falla: solo {pct:.1f}% sincronizó en < 3s"

if __name__ == "__main__":
    test_sincronizacion_bajo_carga()
```

---

## Criterios de Aceptación del Sprint 3

|Criterio|Métrica|Estado|
|---|---|---|
|Propagación entre sedes|99% < 3 segundos|⏳ Pendiente|
|Reintentos automáticos|Hasta 3 con espera exponencial|⏳ Pendiente|
|Alerta al admin|Se genera tras 3 fallos consecutivos|⏳ Pendiente|
|Logs completos|100% de operaciones registradas|⏳ Pendiente|
|Seguridad RLS|sync_logs inaccesible sin auth|⏳ Pendiente|
|Datos en tránsito|HTTPS verificado|⏳ Pendiente|
|SonarQube|0 vulnerabilidades críticas|⏳ Pendiente|
|Regresión módulos 01 y 02|Suites pasan al 100%|⏳ Pendiente|

---

## Tareas

### En Progreso

- [ ] —

### Pendiente

- [ ] Habilitar Realtime en tabla `citas` en Supabase
- [ ] Verificar tabla `sync_logs` en Supabase
- [ ] Crear `sincronizacion.service.ts`
- [ ] Crear `DashboardSync.tsx` para administrador
- [ ] Crear componentes de sincronizacion/
- [ ] Crear tipos en `sincronizacion.types.ts`
- [ ] Escribir pruebas de integración
- [ ] Escribir pruebas de seguridad en Python
- [ ] Escribir pruebas de rendimiento en Python
- [ ] Revisar con SonarQube
- [ ] Correr regresión módulos 01 y 02
- [ ] Actualizar despliegue en Railway
- [ ] Documentar daily

### Completado

- [x] Definir historias de usuario HU-06, HU-07, HU-08
- [x] Diseñar flujo de sincronización y reintentos
- [x] Definir tabla `sync_logs` en SQL inicial
- [x] Definir estructura de carpetas
- [x] Definir estrategia de reintentos con espera exponencial

---

## Decisiones Tomadas

|Decisión|Razón|Fecha|
|---|---|---|
|Supabase Realtime para propagación|Nativo de Supabase, sin backend propio adicional|2026-05-21|
|Espera exponencial en reintentos (1s, 2s, 4s)|Evita saturar el sistema con reintentos inmediatos|2026-05-21|
|Máximo 3 reintentos|Equilibrio entre resiliencia y tiempo de respuesta al usuario|2026-05-21|
|sync_logs solo accesible por admin|Datos de operaciones internas no deben exponerse a pacientes ni médicos|2026-05-21|
|Pruebas de seguridad en Python separadas|SonarQube cubre el código, Python cubre el comportamiento en runtime|2026-05-21|

---

## Instrucciones para Claude Desktop

> Estas instrucciones son para que Claude Desktop pueda construir este módulo con toda la información necesaria.

**Contexto del proyecto:**

- Sistema: HELIOS — plataforma web de citas médicas
- Stack: React + TypeScript, Supabase, pnpm, Vitest + RTL, Python para QA
- Gestor de paquetes: pnpm (NO usar npm)
- Módulo actual: 03 — Sincronización entre Sedes
- Módulos previos completados: [[Módulo 01 — Agendamiento de Citas]] · [[Módulo 02 — Cancelación y Reprogramación]]

**Lo que debe construir:**

1. Servicio `sincronizacion.service.ts` con todas las funciones definidas
2. Página `DashboardSync.tsx` para el administrador
3. Componentes en `sincronizacion/`: StatusSede, TablaSyncLogs, AlertaFallo
4. Tipos en `sincronizacion.types.ts`
5. Pruebas de integración en `__tests__/sincronizacion.test.tsx`
6. Scripts Python en `qa/tests/test_seguridad_sincronizacion.py` y `test_rendimiento_sincronizacion.py`

**Restricciones:**

- Usar TypeScript estricto, pnpm nunca npm
- El canal Realtime debe llamarse exactamente `citas-sync`
- La espera entre reintentos es exponencial: 1000 * 2^(intento-1) ms
- sync_logs nunca debe exponer cédula, correo ni datos personales
- Correr suite de regresión de módulos 01 y 02 antes de hacer commit
- El dashboard solo es accesible para rol administrador

**Archivos de referencia:**

- [[Proyecto - HELIOS]] — nota general del proyecto
- [[Módulo 01 — Agendamiento de Citas]]
- [[Módulo 02 — Cancelación y Reprogramación]]
- [[Módulo 04 — Notificaciones y Recordatorios]] ← siguiente

---

## Recursos y Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 02 — Cancelación y Reprogramación]] ← módulo previo
- [[Módulo 04 — Notificaciones y Recordatorios]] ← siguiente módulo
- [[Sprint 3 — Sincronización]]
- [[Daily — Semana 1 — Sprint 3]]
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)

---

## Reflexiones del Módulo

_(Llenar después de cada semana de trabajo)_

**2026-05-21 — Planificación** El módulo más técnico del proyecto. El reto real no es la sincronización en sí — Supabase Realtime lo maneja — sino los reintentos, los logs y la seguridad de los datos en tránsito. Las pruebas de seguridad en Python son nuevas para el equipo, hay que dedicarles tiempo.

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_