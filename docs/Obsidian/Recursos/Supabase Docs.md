# Supabase Docs

**Tipo:** #referencia #documentacion-tecnica
**Área:** [[MOC — Proyectos]]
**Proyecto:** [[Proyecto - HELIOS]]
**Estado:** #activo
**Tags:** #helios #supabase #postgresql #backend #realtime

---

## De Qué Se Trata

Documentación oficial de Supabase: https://supabase.com/docs

Supabase es el backend completo de HELIOS: base de datos PostgreSQL, autenticación, suscripciones en tiempo real (Realtime) y API auto-generada — todo en un solo servicio con plan gratuito suficiente para el proyecto.

---

## Lo Que Más Uso de Esta Documentación

- **Database** — esquema relacional completo definido desde Sprint 0 (decisión: crear toda la BD antes de programar, ver [[Proyecto - HELIOS]] → Decisiones Tomadas)
- **Auth** — registro y login de pacientes y médicos
- **Realtime** — canales de suscripción (ej. `agenda-medico`, usado en `agendamiento.service.ts`, ver [[Daily — Semana 2 — Sprint 1]])
- **Client libraries (JS)** — `lib/supabase.ts` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

---

## Conexiones

- [[Proyecto - HELIOS]]
- [[Módulo 01 — Agendamiento de Citas]]
- [[BD-Transacciones-ACID]] → [[MOC — Programación]]
- Se relaciona con [[Bases de Datos Relacionales]] → [[MOC — Programación]]
- Se relaciona con [[WebSockets — Comunicación en Tiempo Real]] → [[MOC — Programación]]

---

*← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]]*
