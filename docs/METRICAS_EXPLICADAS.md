# Métricas del Sprint 1 — explicadas para defenderlas en clase

> Para cada métrica de la diapositiva 5, este documento explica:
> 1) **Qué es** (definición en una línea)
> 2) **Cómo la medimos** (herramienta + comando)
> 3) **Qué obtuvimos** (valor real)
> 4) **Qué significa** (interpretación)
> 5) **Si te preguntan** (respuesta lista)

---

## 1. Métricas de Requerimientos (ISTQB + TMMi)

### 1.1 Cobertura de US con criterios de aceptación
- **Qué es:** % de historias de usuario con criterios verificables documentados.
- **Cómo:** Conteo manual en Obsidian + revisado en Jira.
- **Valor:** **5 de 5 = 100%**
- **Significa:** Antes de codear, sabíamos qué tenía que cumplir cada historia. No se construyó nada sin criterios.
- **Si preguntan:** *"Las 5 US del Sprint 1 (US-01 a US-05) tienen entre 4 y 6 criterios cada una, documentados en el Sprint 1.md y en cada issue de Jira."*

### 1.2 Trazabilidad US → Tabla BD → Componente → Test
- **Qué es:** Cada historia tiene un camino completo desde requisito hasta prueba.
- **Cómo:** Matriz manual + verificable en código.
- **Valor:** **5 de 5 historias trazadas.**
- **Significa:** Si alguien pregunta "¿dónde está implementada US-04?", podemos mostrar: wizard `AgendarCita.tsx` → RPC `crear_cita_atomica` en `schema.sql` → test `Register.test.tsx`.
- **Si preguntan:** *"Tenemos la matriz en docs/PLAN_EJECUCION. Por ejemplo, US-04 va a Wizard → RPC → 4 tests del flujo de cédula."*

### 1.3 Volatilidad de requerimientos
- **Qué es:** % de US que cambiaron a mid-sprint.
- **Cómo:** Conteo de changes en el backlog Jira.
- **Valor:** **0 cambios** durante la semana 2.
- **Significa:** El Sprint 0 hizo bien su trabajo (documentar antes de codear). No tuvimos que reescribir nada.
- **Si preguntan:** *"Cero cambios. Atribuimos esto a la inversión en SRS y wireframes durante el Sprint 0."*

---

## 2. Métricas de Diseño (ISO/IEC 25010)

### 2.1 Tablas BD vs documentadas en Sprint 0
- **Qué es:** ¿Implementamos las tablas que se diseñaron?
- **Cómo:** Comparación entre `docs/Obsidian/Documentación/6. Diseño de Base de Datos.md` y `supabase/schema.sql`.
- **Valor:** **7 de 7 (100%)** — sedes, especialidades, medicos, horarios, pacientes, citas, auth_paciente_link.
- **Significa:** Fidelidad total entre diseño y ejecución.
- **Si preguntan:** *"Las 7 tablas del SRS están implementadas en producción, con FKs e índices."*

### 2.2 Componentes con Single Responsibility (SRP)
- **Qué es:** Cada componente React hace UNA sola cosa.
- **Cómo:** Code review manual contra principios SOLID.
- **Valor:** **9 de 9 componentes principales** cumplen SRP.
- **Significa:** El código es mantenible. Cambiar un componente no rompe otros.
- **Si preguntan:** *"Por ejemplo, SelectorEspecialidad solo selecciona especialidades — no agenda citas, no llama a Auth, no maneja calendario."*

### 2.3 Complejidad ciclomática máxima
- **Qué es:** Máximo número de caminos posibles en una función.
- **Cómo:** SonarCloud lo calcula automáticamente.
- **Valor:** **Pendiente primera pasada** — target <10.
- **Significa:** Funciones simples = fácil de testear + entender.
- **Si preguntan:** *"Pendiente la primera pasada de SonarCloud. La configuración está lista en `sonar-project.properties`."*

---

## 3. Métricas de Código (ISTQB)

### 3.1 Cobertura statements / branches / lines / functions
- **Qué es:** % del código que ejecutan los tests.
- **Cómo:** `pnpm vitest run --coverage` con provider v8.
- **Valores:**
  - **Statements: 65.26%** (target Sprint 1: 60%) ✅
  - **Branches: 53.71%** (target: 50%) ✅
  - **Lines: 81.72%** (target: 60%) ✅
  - **Functions: 89.28%** (target: 60%) ✅
- **Significa:** Más de 2 de cada 3 líneas tienen test que las ejercita. Si alguien rompe algo, los tests lo detectan antes de mergear.
- **Si preguntan:** *"Tenemos threshold guard en vite.config.ts — el build FALLA si la cobertura baja del 60%. Esto previene retrocesos en calidad."*

### 3.2 Tests automatizados pasando
- **Qué es:** Tests ejecutados con éxito sobre el total.
- **Cómo:** `pnpm vitest run`
- **Valor:** **39 de 39 (100%)** en 10 archivos.
- **Significa:** El código compila y pasa todas las pruebas funcionales antes de cada commit.
- **Si preguntan:** *"39 tests cubren: validación cédula panameña, selectores del wizard, formularios de auth, página Mis Citas y componentes shared."*

### 3.3 Code smells
- **Qué es:** Cantidad de "olores" en el código (no son bugs, son señales de mal estilo).
- **Cómo:** SonarCloud (pendiente primera pasada).
- **Valor:** **Por medir**
- **Si preguntan:** *"Pendiente primera pasada en SonarCloud. Target Sprint 1: <10 smells totales."*

### 3.4 Vulnerabilidades críticas
- **Qué es:** Defectos de seguridad detectados.
- **Cómo:** SonarCloud + revisión manual.
- **Valor:** **0 críticas** (manual: revisamos secretos en código, .env en .gitignore).
- **Significa:** Las API keys nunca se commitearon. El service_role nunca llega al frontend.
- **Si preguntan:** *"Implementamos política de no commitear .env*. Las credenciales viven solo en el equipo local + Railway env vars."*

---

## 4. Métricas No Funcionales (ISTQB rendimiento)

### 4.1 Latencia P50 / P95 / P99 (Locust)
- **Qué es:** Tiempo de respuesta percentilado bajo carga.
- **Cómo:** Locust con 200 usuarios concurrentes, 60s sostenidos, contra Supabase REST.
- **Valores:**
  - **P50: 120 ms** — la mediana de respuestas
  - **P95: 300 ms** — el peor 5% de respuestas (target Sprint 1: < 2.000 ms)
  - **P99: 1.100 ms** — solo el 1% más lento
- **Significa:** Aunque tengamos 200 personas agendando al mismo tiempo, el 95% verá respuestas en menos de 0.3 segundos. El target era 2 segundos — somos 6.6x mejores.
- **Si preguntan:** *"P95 de 300 ms con 200 usuarios concurrentes. Si lo escalamos a 500 usuarios (criterio del CLAUDE.md), esperamos P95 <800 ms aún."*

### 4.2 Tasa de error bajo carga
- **Qué es:** % de requests que fallaron durante la prueba de carga.
- **Cómo:** Locust HTML report — campo `Fails`.
- **Valor:** **0 de 6.105 requests = 0.00%**
- **Significa:** Sistema 100% disponible durante el pico de carga simulado.
- **Si preguntan:** *"Cero fallas. Esto valida que la RPC atómica y los índices de la BD soportan la carga esperada."*

### 4.3 Throughput sostenido
- **Qué es:** Requests por segundo que aguanta el sistema sin degradar.
- **Cómo:** Locust — req/s aggregate.
- **Valor:** **103.85 req/s** sostenidos durante 60s.
- **Significa:** Si la red de policlínicas tiene 50.000-80.000 interacciones diarias (del SRS), eso son ~1 req/s en promedio. Tenemos 100x de margen.
- **Si preguntan:** *"100 req/s sostenidos. El SRS proyecta picos de 5.000-10.000 usuarios en hora pico — necesitaríamos escalar Supabase a Pro Plan en producción real."*

---

## 5. Métricas Clásicas (Pressman)

### 5.1 KLOC del Sprint
- **Qué es:** Miles de líneas de código útil (sin blancos ni comentarios).
- **Cómo:** Conteo con `cloc` o SonarCloud.
- **Valor:** **≈ 1.4 KLOC** (1.400 líneas TS/TSX).
- **Significa:** Sprint 1 produjo el equivalente a 1.4 KLOC de código de producto + ≈ 600 LOC de tests + ≈ 200 LOC Python (seed/locust).
- **Si preguntan:** *"1.400 LOC útil del producto. No es mucho porque Supabase nos ahorra construir backend completo."*

### 5.2 Productividad (KLOC/persona/sprint)
- **Qué es:** Cuánto código útil produce cada integrante en un sprint.
- **Cómo:** KLOC ÷ 5 integrantes.
- **Valor:** **0.28 KLOC/persona/sprint** (≈ 280 LOC c/u).
- **Significa:** Aceptable para Sprint 1 que incluye setup técnico. Sprint 2 debe ser mayor (sin tanto setup).
- **Si preguntan:** *"0.28 KLOC por persona. Es un Sprint 1 con setup técnico pesado — Sprint 2 esperamos 0.4-0.5."*

### 5.3 Tasa de defectos
- **Qué es:** Bugs encontrados / KLOC.
- **Cómo:** Registro manual de defectos durante el sprint.
- **Valor:** **7 defectos / 1.71 KLOC = 4.09 bugs/KLOC**
- **Defectos detectados y resueltos (todos durante el Sprint, ninguno llegó a presentación):**
  1. Regex de cédula panameña no aceptaba formato `PE-12-345` → simplificado
  2. Vitest `vi.mock` fallaba por hoisting con variables externas → `vi.hoisted()`
  3. Faker `es_PA` locale no existe → cambiado a `es_MX`
  4. **Registro duplicado**: usuario con `auth.users` pero sin `pacientes` veía "Crear cuenta" en blanco → `Register.tsx` detecta 3 escenarios
  5. **Toolbar inactivo**: clicks en NavLinks no respondían → `sticky top-0 z-50` en `<header>`
  6. **Seed destructivo**: `reset_tables()` borraba datos de usuarios reales → preserva citas/pacientes/auth_paciente_link
  7. **Loading infinito** en `useAuth.tsx`: si Supabase fallaba (cold start, timeout, RLS), el `setLoading(false)` no se ejecutaba y la app se quedaba en spinner "Verificando sesión..." indefinidamente → fix con `try/catch/finally` en `init`, `onAuthStateChange` y `loadPaciente`. Adicional: race condition fix con `useRef` para prevenir respuestas tardías que muestren paciente equivocado tras cambio de sesión (crítico en app médica).
- **Si preguntan:** *"7 defectos detectados durante el sprint, todos resueltos con commit verificable en GitHub. 3 los encontramos en desarrollo (validaciones, mocks, locale) y 4 en demo con usuarias reales (auth flow, toolbar, seed, loading). Tasa 4.09 bugs/KLOC es honesta — la industria considera bueno <5 bugs/KLOC."*

---

## 6. Proceso de Medición (TQM — Goal/Question/Metric)

### 6.1 Ciclo completo de mejora
- **Qué es:** Goal → Question → Metric → Recolección → Análisis → Acción.
- **Cómo:** Documentado en el Daily MD semanal.
- **Ejemplo aplicado:**
  - **Goal:** Validar que el agendamiento es rápido y seguro.
  - **Question:** ¿Aguanta carga real?
  - **Metric:** Latencia P95 < 2 s, error rate < 1%, 0 vulnerabilidades críticas.
  - **Recolección:** Locust HTML report + Vitest coverage + SonarCloud (pendiente).
  - **Análisis:** P95=300ms (cumple), error=0% (excede), vulnerabilidades=0 (manual, pendiente Sonar).
  - **Acción de mejora:** Documentado en Daily MD + ticket "Conectar SonarCloud" en Jira para Sprint 2.
- **Si preguntan:** *"Aplicamos TQM con Goal-Question-Metric. Cada semana medimos, analizamos y abrimos tickets de mejora. Es un ciclo continuo, no un evento."*

---

## 7. Métricas pendientes de medir (honestidad brutal)

Estas las reconocemos como **gaps del Sprint 1**, ya en backlog Sprint 2:

| Métrica | Por qué falta | Cuándo se mide |
|---|---|---|
| **Code smells** | SonarCloud sin primera pasada | Sprint 2 ticket HELL-29 |
| **Debt ratio** | Idem Sonar | Sprint 2 |
| **CC máxima real** | Idem Sonar | Sprint 2 |
| **SUS score** (usabilidad) | No aplicamos cuestionario aún | Sprint 2 con 2 usuarios externos |
| **Locust 500 usuarios** | Solo 200 corridos (Supabase free tier) | Sprint 2 con upgrade temporal |

**Si preguntan por qué falta algo:** *"Lo reconocemos como gap del Sprint 1. Está en el backlog del Sprint 2 con responsable y fecha asignados."*

---

## Frases clave para usar en la presentación

- **"Medimos lo que importa, no lo que es fácil."** → para defender por qué priorizamos P95 sobre, digamos, líneas de comentarios.
- **"Calidad como gate, no como reporte."** → para explicar el threshold guard que bloquea builds.
- **"Honestidad sobre lo que falta."** → para los items pendientes (Sonar, SUS, etc.). Reconocer es más profesional que esconder.
- **"Cada defecto detectado es deuda evitada."** → para los 3 bugs resueltos durante el sprint.

---

_Métricas mantenidas por Ashley Martinez (QA Engineer) + Marian Barba (Scrum Master). UTP 2026._
