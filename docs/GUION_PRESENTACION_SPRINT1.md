# Guion de Presentación — Daily Scrum Sprint 1

**Fecha:** Viernes (a confirmar)
**Duración total:** 5 minutos exactos
**Formato:** 1 minuto por integrante × 5 personas

> Este guion está cronometrado. **Practiquen leyéndolo en voz alta antes de la presentación** — si se pasan de tiempo, suena improvisado.

---

## Distribución de turnos

| Minuto | Quién | Rol | De qué habla |
|---|---|---|---|
| **00:00 - 01:00** | Marian Barba | Scrum Master | Apertura + 3 preguntas Scrum (resumen) |
| **01:00 - 02:00** | José Brown | Product Owner | Demo live del QR + flujo end-to-end |
| **02:00 - 03:00** | Ethan Gonzalez | Dev Frontend | Componentes UI + decisiones de diseño |
| **03:00 - 04:00** | Alejandro Saenz | Tech Lead | Backend Supabase + RPC + RLS |
| **04:00 - 05:00** | Ashley Martinez | QA Engineer | Métricas Unidad II + cierre |

---

## Minuto 1 — Marian (Scrum Master) — APERTURA

**[En el proyector: Slide 1 — Portada]**

> "Buenos días profesora, somos el Grupo HELIOS — José, Ethan, Alejandro, Ashley y yo, Marian. Hoy presentamos el Daily Scrum del Sprint 1 — Agendamiento de Citas Médicas.

**[Cambia a Slide 2 — ¿Qué hicimos?]**

> En 30 segundos las 3 preguntas Scrum:
>
> **¿Qué hicimos esta semana?** Pasamos de Sprint 0 — que fue solo documentación — a un MVP funcional desplegado. Construimos el flujo completo de agendamiento, conectamos Supabase, hicimos pruebas automáticas con Vitest y prueba de carga con Locust.
>
> **¿Qué haremos la próxima?** Agregar Realtime para que los médicos vean sus citas en vivo, endurecer la seguridad con políticas por rol, y conectar SonarCloud al CI.
>
> **¿Qué problemas tuvimos?** Tres bugs durante el sprint, todos resueltos: regex de cédula muy estricto, mock hoisting de Vitest, y Faker sin locale Panamá. Y cuatro intentos fallidos de deploy en Railway hasta usar Dockerfile.
>
> Le paso a José para la demo en vivo."

**Pista de actuación:** habla rápido pero clara. 1 minuto pasa volando.

---

## Minuto 2 — José (Product Owner) — DEMO LIVE

**[Mantiene Slide 2 visible con el QR grande]**

> "Voy a hacer una demo en vivo. **Compañeros, todos saquen su celular y escaneen el QR de la diapositiva**. Eso los lleva directo a HELIOS desplegado en Railway.

**[Espera 10 segundos para que escaneen]**

> Mientras escanean: HELIOS es un MVP del Sprint 1 — **no es producción real**, es un demo académico para validar que el flujo de agendamiento funciona end-to-end con datos reales.

**[Si tu laptop también tiene el demo abierto, lo proyectas]**

> Yo voy a registrarme rápido — nombre, cédula 8-123-4567, correo, contraseña. Listo, ya estoy adentro.

**[Click "Agendar"]**

> Paso 1: elijo especialidad — pongamos Cardiología — y sede, Policlínica Central.
>
> Paso 2: me aparecen los médicos disponibles para esa combinación. **Garantizamos que cada combinación tenga al menos un médico** — son 15 combinaciones cubiertas + 5 médicos extras.
>
> Paso 3: el calendario me muestra 5.400 horarios reales generados por nuestro script Python.
>
> Paso 4: confirmo, y obtengo un código de cita de 8 caracteres. Listo, está en mi historial.

**[Click "Mis Citas"]**

> Aquí veo todas mis citas. **Compañeros, ¿alguien logró agendar?** Levanten la mano si sí.

**Ethan continúa.**

**Pista:** si el wifi falla, ten un GIF/captura del flujo en una slide oculta de reserva.

---

## Minuto 3 — Ethan (Dev Frontend) — COMPONENTES

**[Slide 4 — Capturas de herramientas con screenshot GitHub + Jira]**

> "Como Dev Frontend construí 9 componentes principales en React 19 + TypeScript 6, organizados por responsabilidad: agendamiento, auth, layout y shared.
>
> Las decisiones clave:
>
> 1. **Wizard con useReducer** — el estado de 7 piezas se mantiene consistente. Es más fácil de testear que múltiples useState dispersos.
>
> 2. **FullCalendar** para los horarios — librería estándar de la industria, integración con React via @fullcalendar/react.
>
> 3. **Tailwind CSS con tema HELIOS** — color teal de marca, sistema de tokens consistentes. 32 archivos .tsx en total.
>
> Como pueden ver en la captura del repo, fueron 9 commits firmados por cada integrante del equipo — esto cumple con la métrica de trazabilidad del 1 PR por miembro que pide la dinámica.

**Pista:** muestra el dedo apuntando al screenshot. La gente necesita guía visual.

---

## Minuto 4 — Alejandro (Tech Lead) — BACKEND

**[Slide nueva o slide 5 con diagrama ER]**

> "Como Tech Lead, decidimos **no construir backend propio**. Delegamos todo a Supabase, que nos da PostgreSQL + Auth + REST automática + Realtime.
>
> Esto nos ahorró probablemente 40 horas de trabajo y nos permitió enfocar el sprint en frontend y calidad.
>
> Las 3 decisiones técnicas más importantes:
>
> 1. **RPC `crear_cita_atomica`** — función PostgreSQL con `FOR UPDATE` que bloquea el horario antes de crear la cita. Esto evita que dos pacientes agarren el mismo slot al mismo tiempo. Critical para producción real.
>
> 2. **Tabla puente `auth_paciente_link`** — mapea el usuario de Supabase Auth con el registro de paciente. Mantiene separados identidad y dato de negocio.
>
> 3. **RLS permisivo en Sprint 1** — **deuda técnica que reconocemos abiertamente**. Cualquier usuario autenticado ve todo. Primer ticket del Sprint 2 endurece esto con políticas por rol paciente/médico.

**Pista:** "deuda técnica que reconocemos" — esa frase impresiona porque muestra madurez profesional.

---

## Minuto 5 — Ashley (QA Engineer) — MÉTRICAS Y CIERRE

**[Slide 5/6/7 — Tabla de métricas Unidad II]**

> "Como QA, medí 6 categorías según ISTQB, TMMi y TQM:
>
> 1. **Cobertura de tests**: 65% statements, 89% functions, threshold guard activo — el build falla si baja de 60%.
>
> 2. **Prueba de carga con Locust**: 200 usuarios concurrentes, **P95 de 300 milisegundos**. El target era 2 segundos — somos 6.6 veces mejores. Cero fallas en 6.105 requests.
>
> 3. **Registro de defectos**: 3 bugs detectados durante el sprint, todos resueltos antes de la demo. Tasa de 2.1 bugs por KLOC — buena para Sprint 1.
>
> 4. **Esfuerzo**: 53 Story Points distribuidos en 15 tareas — 37 SP completados, 5 en progreso, 11 pendientes para Sprint 2.
>
> Lo que reconocemos como **gaps honestos**: SonarCloud todavía sin primera pasada, y la prueba de carga la corrimos con 200 usuarios — no los 500 del target — porque Supabase free tier nos limita.

**[Slide cierre]**

> En resumen: **MVP académico funcional, métricas medidas, deuda técnica reconocida, plan claro para Sprint 2**.
>
> Gracias. ¿Preguntas?"

**Pista:** termina exactamente en 5:00. Si te pasaste, recorta el último párrafo.

---

## Preguntas anticipadas (Q&A)

Si la profesora pregunta, respuestas listas:

### "¿Por qué eligieron Supabase y no construyeron backend propio?"
> "El equipo es de 5 personas y tenemos 11 semanas. Construir Auth + REST + base de datos + Realtime nos hubiera tomado todo el semestre. Supabase nos da esos 4 servicios listos para que enfoquemos en calidad de producto."

### "¿Cuál es la diferencia entre demo y producción?"
> "El demo es Sprint 1 con RLS permisiva — cualquier usuario autenticado lee todo. Producción real requiere RLS por rol, MFA, monitoreo, y backups. Está en el roadmap del Sprint 2-5."

### "¿Cómo midieron la cobertura?"
> "Vitest con provider v8. Genera reporte HTML interactivo que se ve en `dailys/coverage/` del repo. Tenemos threshold de 60% en `vite.config.ts` — si bajamos, el build CI falla."

### "¿Por qué solo 200 usuarios en Locust si el target son 500?"
> "Supabase free tier tiene rate limit. Para 500 sostenidos necesitaríamos Pro Plan ($25/mes). Está documentado como mejora del Sprint 2."

### "¿Cuántas líneas de código?"
> "1.4 KLOC útiles + 600 LOC de tests + 200 LOC Python. Productividad 0.28 KLOC/persona — aceptable para Sprint 1 con setup técnico pesado."

### "¿Qué bloqueó al equipo esta semana?"
> "4 intentos fallidos de deploy en Railway. Nixpacks no tiene pnpm ni Node 22 en su snapshot. Resolvimos con Dockerfile multi-stage usando node:22-alpine. Lección aprendida para futuros deploys."

### "¿Cómo eligieron las historias del Sprint 1?"
> "Product Owner (José) priorizó el flujo crítico de agendamiento — es el problema número 1 del cliente (lentitud en hora pico). HU-02 de Realtime queda para Sprint 2."

### "¿Qué es ISTQB / TMMi / TQM?"
> "ISTQB nos da las categorías de pruebas — funcionales, rendimiento, regresión. TMMi nos da el modelo de madurez: estamos en nivel 3, pruebas trazables. TQM es la filosofía de mejora continua — cada daily abrimos tickets de mejora basados en métricas."

### "¿Por qué TypeScript estricto?"
> "Detecta bugs en tiempo de compilación. El threshold `verbatimModuleSyntax` y `noUnusedLocals` nos forzó a limpiar el código mientras codeábamos. Ahorra debugging después."

### "¿Cómo manejan los conflictos en el equipo?"
> "Daily Scrum semanal documentado en Obsidian. Decisiones técnicas como ADRs. Si hay desacuerdo, el Tech Lead (Alejandro) tiene la palabra final en arquitectura, y el Product Owner (José) en alcance."

---

## Checklist pre-presentación

24 horas antes:
- [ ] Cada integrante leyó este guion 2 veces
- [ ] Cada integrante leyó el glosario completo
- [ ] Cada integrante leyó las métricas explicadas
- [ ] Marian verifica que el board Jira tiene las 15 tareas correctas
- [ ] José prueba el QR desde su celular (cargar HELIOS rápido)
- [ ] Ethan verifica que el repo GitHub se ve limpio en main
- [ ] Ashley verifica que el reporte Locust HTML abre bien
- [ ] Alejandro tiene el SQL schema abierto en otra pestaña por si preguntan

30 minutos antes:
- [ ] Cada uno cronometra su minuto leyendo en voz alta
- [ ] Tener PPTX abierto en la laptop del presentador (Marian)
- [ ] Tener el QR impreso en hoja A4 como respaldo si proyector falla
- [ ] Tener el demo de Railway abierto en otra pestaña como backup

Durante:
- [ ] Hablar de pie, mirar a la profesora cada 15-20 segundos
- [ ] Si te pasas de tiempo, terminar tu minuto y pasar al siguiente
- [ ] Si te falta tiempo, completar con frase del glosario

---

_Guion mantenido por Marian Barba (Scrum Master). Versión 1.0 — 28 mayo 2026._
