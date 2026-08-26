# HELIOS — Resumen del Producto Final

> Sistema unificado de citas médicas · Grupo HELIOS · UTP Calidad de Software 2026
> Documento de cierre para la presentación del producto final.
> Última actualización: **8 de julio de 2026**

---

## 1. Resumen ejecutivo

**HELIOS está en producción, en vivo y funcionando.**

- 🌐 **URL:** https://helios-web-production.up.railway.app
- 🗄️ **Base de datos:** Supabase (PostgreSQL) con seguridad por rol (RLS)
- 🚀 **Deploy:** automático (CI/CD con GitHub Actions → Railway)
- 📦 **Repositorio:** `Helios-TeamUTP/Helios` (organización del equipo)

El producto cubre el ciclo completo de una cita médica: registro del paciente,
agendamiento (con validaciones reales), gestión por parte del médico, historial
clínico, cancelación/reprogramación, notificaciones y correos automáticos.

---

## 2. Funcionalidades del producto

| Módulo | Descripción | Estado |
|---|---|---|
| **Registro y login** | Alta de pacientes con validación de cédula panameña (5 tipos), teléfono, nombre y correo; doble confirmación anti-error | ✅ En vivo |
| **Agendamiento** | Wizard de 4 pasos: especialidad+sede → médico → horario → confirmar | ✅ En vivo |
| **Límite real de citas/día** | Un médico no puede exceder **15 citas por día** (recomendación de un médico real; tope físico, atómico en BD) | ✅ Nuevo hoy |
| **Cancelar / Reprogramar** | Autoservicio del paciente, con liberación de cupo y auditoría | ✅ En vivo |
| **Dashboard médico** | Agenda del día, marcar completada/no asistió, gestión de pacientes | ✅ En vivo |
| **Historial clínico** | Dolencia y receta por cita, visible para médico y paciente | ✅ En vivo |
| **Notificaciones in-app** | Campanita en tiempo real (Supabase Realtime) | ✅ En vivo |
| **Correos automáticos** | Confirmación / cancelación por Gmail (worker en Railway) | ⏳ Worker listo, por activar |
| **Identidad visual** | Logo rojo HELIOS, favicon, correos con marca | ✅ En vivo |

---

## 3. Lo que se logró en esta jornada (8-jul-2026)

### 3.1 El sistema quedó EN VIVO con su identidad
- Se subió a GitHub todo el código que estaba solo en local (notificaciones
  in-app, logo, favicon, fixes de bugs) — casi un mes de trabajo sin publicar.
- Se integró en la rama principal (`main`) todo el trabajo del equipo:
  el dashboard médico v2 y el historial clínico.

### 3.2 CI/CD real (integración y despliegue continuo)
- Se montó **auto-deploy con GitHub Actions**: cada cambio en `main` se
  despliega solo a Railway, corriendo en los servidores de GitHub.
- Esto resolvió un bloqueo real: la herramienta de despliegue local estaba
  bloqueada por una política de seguridad de Windows (Smart App Control). La
  solución (CI/CD) es además una **mejor práctica de la industria**.

### 3.3 Nueva funcionalidad: límite de citas por médico/día
- **Problema:** sin control, un médico podía terminar con 20+ citas en un día.
- **Solución:** tope de **15 citas por día por médico** (número recomendado por un médico real que probó el sistema), aplicado en 3 capas:
  1. **Base de datos** (el límite real, imposible de saltar): rechaza la
     cita #7 con un candado de concurrencia por médico+día.
  2. **Reglas de reprogramación**: no se puede mover una cita a un día lleno.
  3. **Experiencia de usuario**: los días completos aparecen marcados como
     "Día completo" y deshabilitados.

### 3.4 Auditoría de calidad antes de desplegar
- El código nuevo del equipo se auditó antes de integrarlo (build, 141 tests,
  seguridad RLS, manejo de errores): **aprobado sin romper nada**.
- El límite de citas se sometió a una **verificación adversarial de 5 revisores
  independientes** (concurrencia, regresión, seguridad, casos borde,
  consistencia) que detectó 3 problemas reales — corregidos antes del deploy.

---

## 4. Calidad de software (Unidad 2)

### 4.1 Proceso disciplinado
- **Plan antes de codificar** en cada cambio no trivial.
- **Code review / verificación adversarial obligatoria** antes de cada deploy.
- **Los bugs se detectan y corrigen en la misma jornada** gracias al proceso.

### 4.2 Métricas
| Métrica | Valor | Herramienta |
|---|---|---|
| Tests automatizados | **141 pasando** | Vitest + React Testing Library |
| Cobertura | ≥60% statements | Vitest coverage |
| Build | Limpio (TypeScript estricto, sin `any`) | tsc + Vite |
| Bundle | ~534 KB / 151 KB gzip | Vite |
| Análisis estático | Configurado | SonarCloud |
| Seguridad | RLS estricto por rol; funciones SECURITY DEFINER con validación de dueño | Supabase / PostgreSQL |
| Carga (previa) | P95 ~300 ms con 200 usuarios | Locust |

### 4.3 Seguridad (defensa en profundidad)
- **RLS por rol**: cada paciente ve solo SUS datos; cada médico solo lo suyo.
- Las citas se crean/cancelan/reprograman **solo vía funciones atómicas
  validadas** (nunca por escritura directa).
- El límite de citas y la propiedad de los datos se validan **en la base de
  datos**, no solo en la pantalla → ni un ataque por DevTools lo puede saltar.
- Concurrencia controlada con **advisory locks** (evita condiciones de carrera).

---

## 5. Arquitectura y stack

```
Paciente / Médico (navegador)
        │
        ▼
Frontend React 19 + TypeScript 6 + Vite 8 + Tailwind
        │  (auto-deploy: GitHub Actions → Railway)
        ▼
Railway (helios-web) ──────────► helios-email-worker (Node + Nodemailer/Gmail)
        │                                   │
        ▼                                   ▼
Supabase (PostgreSQL + Auth + Realtime + RLS + funciones atómicas)
```

**Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind 3 · Supabase 2 ·
React Router 7 · GitHub Actions (CI/CD) · Railway (hosting) · Vitest (tests).

---

## 6. Pendientes y roadmap

- **Activar el worker de correos** (confirmación/cancelación por Gmail): el
  código está listo, falta encender el servicio en Railway con sus variables.
- **A futuro:** definir qué días atiende cada médico y duración variable de
  cita por especialidad; mover el chequeo de cédula a una RPC con rate limit.

---

## 7. Conclusión

HELIOS pasó de ser código en la máquina de un integrante a un **producto en
producción, con despliegue continuo, seguridad por capas y control de calidad
verificable**. Cada funcionalidad nueva se diseñó, se verificó adversarialmente
y se desplegó sin romper lo existente — que es, al final, de lo que trata la
calidad de software.

*Grupo HELIOS · José Brown · Ethan González · Alejandro Sáenz · Ashley Martínez · Marian Barba*
