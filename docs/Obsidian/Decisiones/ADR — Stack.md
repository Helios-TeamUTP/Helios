
## 3.11 ADR — Architecture Decision Records

Los ADR documentan las decisiones arquitectónicas más importantes. Cada uno sigue el formato: contexto → decisión → alternativas consideradas → consecuencias.

---
### ADR-01: Supabase como BaaS

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El equipo necesita base de datos, autenticación, tiempo real y notificaciones sin gestionar un backend propio dado el tiempo limitado del proyecto académico.

**Decisión:** Usar Supabase como plataforma BaaS completa.

**Alternativas consideradas:**

- Firebase (Google) — descartado por vendor lock-in y menor control sobre SQL
- Backend propio con Node.js + Express — descartado por complejidad y tiempo
- PocketBase — descartado por menor ecosistema y documentación

**Consecuencias positivas:**

- PostgreSQL real con SQL estándar
- Realtime nativo sin código adicional
- Auth, RLS y Edge Functions en un solo lugar
- Plan gratuito suficiente para el proyecto

**Consecuencias negativas:**

- Dependencia de un proveedor externo
- Límites del plan gratuito (500MB BD, 2GB transferencia)

---

### ADR-02: React + TypeScript para el frontend

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El equipo necesita un framework de frontend que el equipo conozca, que sea compatible con Supabase y que soporte TypeScript para reducir errores en tiempo de desarrollo.

**Decisión:** React con TypeScript estricto y Vite como bundler.

**Alternativas consideradas:**

- Next.js — descartado por complejidad de SSR innecesaria para este proyecto
- Vue.js — descartado por menor familiaridad del equipo
- Angular — descartado por curva de aprendizaje y verbosidad

**Consecuencias positivas:**

- Ecosistema amplio, muchos recursos
- TypeScript reduce bugs en tiempo de desarrollo
- Vite es más rápido que Create React App
- Compatible directamente con Supabase JS SDK

**Consecuencias negativas:**

- Más verboso que Vue para componentes simples
- Curva de aprendizaje de TypeScript para algunos miembros

---

### ADR-03: pnpm como gestor de paquetes

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** npm sufrió una vulnerabilidad de seguridad reciente. El equipo necesita una alternativa más segura y eficiente.

**Decisión:** Usar pnpm como gestor de paquetes en todo el proyecto.

**Alternativas consideradas:**

- npm — descartado por vulnerabilidad reciente de seguridad
- yarn — descartado por pnpm ser más eficiente en uso de disco

**Consecuencias positivas:**

- Más seguro que npm
- Más rápido en instalación
- Menor uso de espacio en disco (symlinks)
- Compatible con todos los paquetes de npm

**Consecuencias negativas:**

- Menos familiar para algunos miembros del equipo
- Algunos CI/CD requieren configuración adicional

---

### ADR-04: Railway para despliegue

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El equipo necesita una plataforma de despliegue simple que se integre con GitHub y tenga plan gratuito.

**Decisión:** Railway para el despliegue del frontend React.

**Alternativas consideradas:**

- Vercel — considerado pero Railway cubre mejor el caso con backend
- Netlify — descartado por Railway ser más flexible para este stack
- AWS/GCP — descartado por complejidad innecesaria

**Consecuencias positivas:**

- Integración directa con GitHub (deploy automático)
- Plan gratuito suficiente para proyecto estudiantil
- Soporte para variables de entorno
- Deploy automático en cada push a main

**Consecuencias negativas:**

- Plan gratuito tiene límite de horas de ejecución mensual

---

### ADR-05: Vitest + RTL para testing frontend

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El equipo necesita un framework de pruebas compatible con React + TypeScript + Vite.

**Decisión:** Vitest con React Testing Library.

**Alternativas consideradas:**

- Jest — descartado por ser más lento con Vite y requerir más configuración
- Cypress — descartado por ser E2E, no unitario, más pesado para CI/CD

**Consecuencias positivas:**

- Nativo para Vite, sin configuración extra
- RTL promueve pruebas orientadas al usuario
- Compatible con el pipeline de GitHub Actions

**Consecuencias negativas:**

- Ecosistema más nuevo que Jest, menor documentación

---

### ADR-06: Python para pruebas de rendimiento y seguridad

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El equipo necesita scripts de prueba de carga y seguridad. Ashley (QA) tiene experiencia en Python.

**Decisión:** Python con librería `requests` y `threading` para pruebas de rendimiento y seguridad.

**Alternativas consideradas:**

- k6 — descartado por curva de aprendizaje
- JMeter — descartado por complejidad de configuración
- Artillery — descartado por ser Node.js y preferir separar ecosistemas

**Consecuencias positivas:**

- El equipo ya conoce Python
- Scripts simples y legibles
- Fácil de integrar en el pipeline CI/CD

**Consecuencias negativas:**

- Menos features que herramientas dedicadas como k6

---

### ADR-07: SonarQube Community para calidad de código

**Fecha:** 2026-05-21 **Estado:** Aprobado

**Contexto:** El proyecto requiere verificación de calidad de código y detección de vulnerabilidades según los estándares ISTQB aplicados.

**Decisión:** SonarQube Community Edition integrado al pipeline de GitHub Actions.

**Alternativas consideradas:**

- ESLint solo — descartado por no detectar vulnerabilidades de seguridad
- CodeClimate — descartado por costo en plan con más features

**Consecuencias positivas:**

- Detecta vulnerabilidades, code smells y duplicación
- Integración con GitHub Actions
- Plan Community gratuito suficiente

**Consecuencias negativas:**

- Requiere servidor propio o SonarCloud para CI/CD completo

---
