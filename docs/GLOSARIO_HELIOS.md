# Glosario HELIOS — Términos técnicos explicados

> Diccionario para que todo el equipo entienda lo que está diciendo en la presentación del viernes.
> Si tu compañera/o presenta un término que no entiendes, búscalo aquí.

---

## Metodología y proceso

| Término | Significado simple | Lo que decimos en la presentación |
|---|---|---|
| **Scrum** | Marco de trabajo ágil. Divide el desarrollo en sprints cortos. | "Trabajamos en sprints semanales con dailies de 5 min." |
| **Sprint** | Iteración de trabajo con duración fija (1-3 semanas). | "Sprint 0 fue documentación, Sprint 1 es el agendamiento." |
| **Daily Scrum** | Reunión diaria/semanal de 5-15 min con 3 preguntas. | "Hoy presentamos las 3 preguntas Scrum del Daily." |
| **Backlog** | Lista priorizada de tareas pendientes. | "El backlog vive en Jira, lo gestiona el Product Owner." |
| **Kanban** | Tablero visual con columnas To Do / In Progress / Done. | "Tenemos el tablero en Jira con 15 tareas." |
| **MVP** | Minimum Viable Product. Versión mínima funcional. | "HELIOS Sprint 1 es un MVP académico, no producción." |
| **Demo** | Demostración del producto al cliente (en clase). | "Vamos a hacer demo con QR para que prueben en sus móviles." |
| **Iteración** | Cada ciclo del sprint donde se entrega algo. | "Esta es la segunda iteración del Sprint 1." |

---

## Backlog y planificación

| Término | Significado simple | Lo que decimos en la presentación |
|---|---|---|
| **HU** (Historia de Usuario) | Funcionalidad descrita desde la perspectiva del usuario. "Como X, quiero Y, para Z." | "HU-01 es agendar una cita desde el portal web." |
| **US** | User Story. Sinónimo de HU en inglés. | "US-01 a US-05 son las historias del Sprint 1." |
| **Story Points** (SP) | Unidad de esfuerzo estimado. Fibonacci (1,2,3,5,8,13). | "El Sprint 1 sumó 53 Story Points distribuidos en 15 tareas." |
| **Criterios de aceptación** | Condiciones que la US debe cumplir para considerarse Done. | "Cada US tiene 4-5 criterios verificables." |
| **Definition of Done** (DoD) | Lista de chequeo final para marcar algo como terminado. | "El DoD incluye tests pasando y cobertura ≥60%." |
| **Trazabilidad** | Conexión explícita US → tabla BD → componente → test. | "Tenemos trazabilidad 5/5 de las historias del Sprint 1." |

---

## Stack técnico

| Término | Qué es | Por qué lo usamos en HELIOS |
|---|---|---|
| **React** | Librería JavaScript para construir interfaces. | Es estándar de la industria + el equipo lo conoce. |
| **TypeScript** | JavaScript con tipos (más seguro). | Evita bugs al detectar errores antes de ejecutar. |
| **Vite** | Herramienta que arma el bundle final (compila TS y construye dist/). | 10x más rápido que Webpack. |
| **Tailwind CSS** | Framework de estilos con clases utilitarias (`bg-teal-500`, `p-4`). | Diseño rápido y consistente sin escribir CSS. |
| **Supabase** | Backend-as-a-Service: PostgreSQL + Auth + REST + Realtime. | Reemplaza tener que construir un backend propio. |
| **PostgreSQL** | Base de datos relacional (la que está debajo de Supabase). | Soporta transacciones, índices y triggers. |
| **RPC** | Remote Procedure Call. Función SQL ejecutable desde el cliente. | Usamos `crear_cita_atomica` para reservas seguras. |
| **RLS** | Row Level Security. Política a nivel de fila en PostgreSQL. | "Solo el dueño puede ver sus citas." (Sprint 2) |
| **Railway** | Plataforma de hosting tipo Heroku. | José paga Hobby plan. Genera dominio público. |
| **FullCalendar** | Librería de calendario JS. | El selector de horarios del Sprint 1. |
| **Vitest** | Herramienta de testing para Vite (alternativa a Jest). | Más rápida y mejor integrada con Vite. |
| **Locust** | Framework Python para pruebas de carga. | Simula 200 usuarios concurrentes contra la API. |
| **Nixpacks** | Sistema de Railway para construir contenedores sin Dockerfile. | Nos falló 3 veces, terminamos usando Dockerfile. |
| **Docker** | Contenedores con todo lo necesario para correr la app. | Garantiza que corra igual en local y en Railway. |

---

## Calidad de software — marcos académicos

| Término | Qué es | Cómo lo aplicamos en Sprint 1 |
|---|---|---|
| **ISTQB** | International Software Testing Qualifications Board. Estándar de pruebas. | Aplicamos sus categorías: funcionales, rendimiento, regresión. |
| **TMMi** | Test Maturity Model integration. Niveles de madurez de pruebas. | Estamos en Nivel 3: pruebas definidas y trazables. |
| **TQM** | Total Quality Management. Filosofía de mejora continua. | Daily Scrum semanal documentado en MD. |
| **ISO/IEC 25010** | Estándar de calidad de producto. 8 características. | Medimos funcionalidad, fiabilidad, eficiencia, seguridad. |
| **Pressman** | Libro clásico de ingeniería de software. | Métricas clásicas: KLOC, productividad, tasa defectos. |
| **Code smell** | Código que funciona pero está mal escrito (no es bug). | Funciones muy largas, código duplicado, etc. |
| **Debt ratio** | % de tiempo total que costaría arreglar todos los smells. | Target Sprint 1: <5%. (Medimos cuando conectemos Sonar) |
| **Vulnerabilidad** | Defecto que puede ser explotado por un atacante. | XSS, SQL injection, secretos hardcodeados. |
| **Cobertura** | % del código ejecutado por los tests automatizados. | Sprint 1: 65.26% statements, 81.72% lines. |
| **KLOC** | Kilo Lines of Code (1.000 líneas de código útil). | Sprint 1 produjo ≈ 1.4 KLOC. |
| **SRP** | Single Responsibility Principle. "Una clase, una responsabilidad." | Cada componente React hace una sola cosa. |
| **CC** (Complejidad Ciclomática) | Número de caminos posibles en una función. | Target: <10. SonarCloud lo calcula automático. |

---

## Métricas que medimos

| Métrica | Qué significa | Nuestro valor | ¿Bueno? |
|---|---|---|---|
| **P50 (mediana)** | El 50% de las requests respondió en ≤ X ms. | 120 ms | ✅ Muy bueno |
| **P95** | El 95% de las requests respondió en ≤ X ms. | 300 ms | ✅ Excelente (target 2.000 ms) |
| **P99** | El 99% de las requests respondió en ≤ X ms. | 1.100 ms | ✅ Aceptable |
| **Throughput** | Requests por segundo que aguanta el sistema. | 103.85 req/s | ✅ Suficiente |
| **Error rate** | % de requests que fallaron. | 0.00% | ✅ Perfecto |
| **Tasa de defectos** | Bugs encontrados ÷ KLOC. | 3 bugs / 1.4 KLOC = 2.1 bugs/KLOC | ✅ Bajo |
| **Productividad** | KLOC por persona por sprint. | 0.28 KLOC/persona | Aceptable Sprint 1 |
| **Volatilidad de requerimientos** | % de US que cambiaron a mid-sprint. | 0% | ✅ Excelente (no cambiamos alcance) |

---

## Términos del demo

| Término | Qué es |
|---|---|
| **End-to-end (E2E)** | "De punta a punta." El flujo completo desde login hasta confirmar cita. |
| **Wizard** | Interfaz de varios pasos guiados (como un asistente). |
| **Hook** | Función React reutilizable que encapsula lógica (`useAuth`, `useCitas`). |
| **Cliente Supabase** | Librería que conecta el frontend con Supabase. |
| **Bundle** | Archivo JS final que el navegador descarga (737 KB en Sprint 1). |
| **Build de producción** | Versión optimizada y minificada del código (sin debug). |
| **Hot reload** | Cambios en código se ven al instante en navegador (solo dev). |
| **CORS** | Política del navegador que permite/bloquea peticiones cross-domain. |
| **JWT** | JSON Web Token. Lo que Supabase Auth te da cuando te logueas. |
| **Anon key** | API key pública que se inyecta en el frontend. RLS la protege. |
| **Service role key** | API key SECRETA con permisos totales. Solo en backend/scripts. |

---

## Frases de fallback para el demo

Si te preguntan algo y no sabes responder, usa una de estas:

- **Sobre la app:** "Es un MVP académico del Sprint 1, no producción real. Sirve para validar el flujo de agendamiento end-to-end."
- **Sobre seguridad:** "Sprint 1 tiene RLS permisiva como deuda técnica conocida. Sprint 2 endurece políticas por rol — está en el backlog."
- **Sobre defectos:** "Tuvimos 3 defectos durante el Sprint, todos resueltos antes de la demo. Quedaron documentados en el Daily."
- **Sobre rendimiento:** "Medimos P95 de 300 ms con 200 usuarios concurrentes — 6.6x mejor que el target de 2 segundos."
- **Sobre por qué Supabase:** "Decidimos no construir backend propio para concentrarnos en frontend y QA en Sprint 1. Supabase nos da auth + REST + Realtime."
- **Sobre Sprint 2:** "Endurecer RLS, agregar Realtime para médicos, conectar SonarCloud y CI/CD con GitHub Actions."

---

_Glosario mantenido por el equipo HELIOS — UTP 2026. Última actualización: 28 mayo 2026._
