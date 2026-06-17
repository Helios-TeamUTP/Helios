# Investigación Técnica — Capas de Conexión Supabase

**Fecha:** 2026-06-06 
**Proyecto:** [[Proyecto - HELIOS]] **Tags:** #helios #investigacion #supabase #conexion #escalabilidad

---
## Capas de Conexión en Supabase

### El comentario de la profesora

La profesora preguntó por la conexión con la base de datos. Respondieron "APIs" — lo cual es correcto pero incompleto. Ella señaló que esa conexión no es la mejor a mayor escala. Esto es lo que significa técnicamente y cómo responder en el parcial 2.

---

### ¿Qué tiene HELIOS actualmente?

HELIOS usa `@supabase/supabase-js` en el frontend React. Esto conecta a través de **PostgREST**, que es una capa REST automática que Supabase pone encima de PostgreSQL. Es la forma correcta y segura de conectar desde el frontend.

**Flujo actual:**

```
Browser (React)
    ↓ HTTPS + JWT
PostgREST API (Supabase)
    ↓ SQL interno
PostgreSQL (Supabase)
```

---

### Las 3 capas de conexión que existen en Supabase

#### Capa 1 — PostgREST API (lo que tienen)

- **Qué es:** API REST automática generada sobre las tablas de PostgreSQL
- **Puerto:** 443 (HTTPS estándar)
- **Ideal para:** Frontend, apps serverless, proyectos pequeños y medianos
- **Límite:** Cada request abre y cierra su propia conexión a la BD
- **Escala hasta:** ~40-100 usuarios concurrentes sin problemas
- **Por qué la profesora tiene razón:** A mayor escala, cada request compite por una de las 60 conexiones máximas del free tier

#### Capa 2 — Supavisor (Connection Pooler compartido — GRATIS)

- **Qué es:** Un pooler de conexiones multi-tenant construido en Elixir
- **Puerto:** 6543 (transaction mode) / 5432 (session mode)
- **Ideal para:** Aplicaciones serverless con muchos usuarios concurrentes
- **Cómo funciona:** En lugar de abrir una conexión nueva por request, reutiliza un pool de conexiones pre-abiertas. Miles de clientes comparten pocas conexiones reales a la BD
- **Modos:**
    - **Transaction mode (puerto 6543):** conexión solo durante la transacción — ideal para serverless
    - **Session mode (puerto 5432):** conexión persistente — ideal para servidores tradicionales

#### Capa 3 — PgBouncer (Dedicated Pooler — de pago)

- **Qué es:** Pooler dedicado co-ubicado con el servidor de PostgreSQL
- **Disponible en:** Planes de pago de Supabase
- **Ventaja:** Latencia mínima porque está en el mismo servidor que la BD
- **Para HELIOS académico:** No necesario — Supavisor es suficiente

---

### Qué decirle a la profesora en el parcial 2

**Respuesta técnica correcta y completa:**

_"Actualmente HELIOS conecta a PostgreSQL a través de la PostgREST API de Supabase usando el SDK oficial en el frontend React. Esta es la arquitectura recomendada para frontends porque nunca expone la connection string directa (que contendría la contraseña maestra de la BD)._

_La profesora tiene razón en que a mayor escala esto genera presión sobre el límite de 60 conexiones concurrentes del plan gratuito. La migración correcta es implementar Supavisor en modo transacción (puerto 6543), que permite que miles de clientes compartan un pool pequeño de conexiones reales a PostgreSQL, reduciendo drásticamente la presión sobre la base de datos._

_Para una aplicación del tamaño de HELIOS en producción real, también consideraríamos mover la lógica de negocio compleja a Edge Functions de Supabase (que corren en Deno), reduciendo aún más las conexiones directas desde el cliente."_

---

### Diagrama de capas correcto para HELIOS

```
┌──────────────────────────────────────────┐
│         CAPA DE PRESENTACIÓN             │
│   Browser — React + TypeScript           │
│   (No tiene acceso directo a la BD)      │
└─────────────────┬────────────────────────┘
                  │ HTTPS + JWT (token de sesión)
                  ▓ ← aquí está la "API" que mencionaron
                  ▼
┌──────────────────────────────────────────┐
│         CAPA DE SERVICIOS                │
│              SUPABASE                    │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │ PostgREST   │  │  Supabase Auth   │   │
│  │ (REST API)  │  │  (JWT tokens)    │   │
│  └──────┬──────┘  └──────────────────┘   │
│         │                                │
│  ┌──────▼──────────────────────────┐     │
│  │   Supavisor (Connection Pooler) │     │ ← lo que deberían tener
│  │   Puerto 6543 — Transaction mode│     │
│  └──────┬──────────────────────────┘     │
└─────────┼────────────────────────────────┘
          │ Pool de conexiones reutilizadas
          ▼
┌──────────────────────────────────────────┐
│         CAPA DE DATOS                    │
│         PostgreSQL 15                    │
│                                          │
│  Tablas + RLS + Funciones RPC + Triggers │
└──────────────────────────────────────────┘
```

---

### Plan de migración a Supavisor (cuando escale)

Para la documentación del equipo — esto no es urgente para el parcial pero es lo que la profesora quiere ver que entienden:

**Paso 1:** En Supabase Dashboard → Project Settings → Database → Connection Pooling → verificar que Supavisor esté activo

**Paso 2:** Cambiar la URL de conexión en las Edge Functions (no en el frontend — el frontend sigue igual con PostgREST)

```
# Antes (conexión directa — solo para scripts)
postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# Después (Supavisor transaction mode — para Edge Functions)
postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Paso 3:** El frontend React NO cambia — sigue usando `@supabase/supabase-js` con PostgREST que ya usa el pooler internamente

**Paso 4:** Las Edge Functions de Supabase (Deno) ya usan automáticamente el pooler cuando se configuran correctamente

---

### Resumen ejecutivo para la presentación

|Pregunta|Respuesta|
|---|---|
|¿Qué conexión tienen?|PostgREST API via SDK de Supabase (HTTPS + JWT)|
|¿Es la correcta para el frontend?|Sí — es la única segura para frontend|
|¿Por qué se ralentiza a escala?|Límite de 60 conexiones directas en free tier|
|¿Qué mejora existe?|Supavisor (connection pooler) — gratis, ya incluido|
|¿Cómo se migra?|Edge Functions usan Supavisor, frontend no cambia|
|¿En qué capa están?|Capa de servicios (entre presentación y datos)|

---

## Parte 3 — Recuperación de Contraseña con Resend

### Lo que hay que implementar

El plan es usar Supabase Auth + Resend para el flujo de recuperación de contraseña. Supabase ya tiene el flujo de reset built-in — solo hay que configurar el proveedor SMTP con Resend.

### Configuración en Supabase Dashboard

```
Project Settings → Auth → SMTP Settings
  Host: smtp.resend.com
  Port: 465
  Username: resend
  Password: [RESEND_API_KEY]
  Sender email: noreply@helios.gob.pa (o el dominio que tengan)
```

### Flujo de recuperación

```
1. Usuario hace click en "¿Olvidó su contraseña?"
2. Ingresa su correo
3. Frontend llama: supabase.auth.resetPasswordForEmail(email)
4. Supabase envía correo via Resend con link de reset
5. Usuario hace click en el link
6. Redirige a /reset-password con token en URL
7. Usuario ingresa nueva contraseña
8. Frontend llama: supabase.auth.updateUser({ password: nueva })
9. Contraseña actualizada
```

### Código del frontend

```typescript
// pages/ForgotPassword.tsx
async function handleForgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://helios-web-production.up.railway.app/reset-password'
  })
  if (error) setError(error.message)
  else setMensaje('Revisa tu correo — te enviamos el link de recuperación')
}

// pages/ResetPassword.tsx
async function handleResetPassword(nuevaContraseña: string) {
  const { error } = await supabase.auth.updateUser({
    password: nuevaContraseña
  })
  if (error) setError(error.message)
  else navigate('/login') // redirigir al login tras éxito
}
```

---

## Referencias

- [[Proyecto - HELIOS]] ← proyecto padre
- [[Módulo 02 — Cancelación y Reprogramación]]
- [[Sprint 2 — Cancelación y Reprogramación]]
- [[6. Diseño de Base de Datos]]
- [Supabase — Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase — Supavisor](https://supabase.com/blog/supavisor-1-million)
- [Tribunal Electoral de Panamá — Cédula](https://www.tribunal-electoral.gob.pa/)

---

_← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]] | [[MOC — Calidad]] | [[MOC — Universidad]]_