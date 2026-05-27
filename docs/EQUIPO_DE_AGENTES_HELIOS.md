# Equipo de Agentes HELIOS — Catálogo

> Documentación humana del equipo de agentes que mantiene la calidad del código HELIOS.
> Para activarlos técnicamente, ver `docs/agentes/README.md`.

---

## ¿Por qué un equipo de agentes?

Durante el Sprint 1 tuvimos 9 defectos, varios de los cuales fueron **introducidos al arreglar otros** (race condition al arreglar useAuth, hooks que no toqué cuando arreglé el patrón en uno). La lección: **una sola persona/agente** no puede ver todas las dimensiones de un cambio.

**Solución:** un equipo de 5 agentes especializados que trabajan en cadena, donde cada uno valida lo que hizo el anterior.

---

## Los 5 miembros del equipo

### 🎯 helios-team-orchestrator — El coordinador

**Quién es:** El "tech lead" del equipo de agentes. Decide qué agentes lanzar y en qué orden según la tarea.

**Cuándo lo invocas:**
- SIEMPRE primero, ante cualquier cambio no-trivial
- Te pregunta "¿qué tipo de cambio es?" y elabora un plan

**Ejemplo:**
> *Usuario:* "Marian reporta que /mis-citas se queda cargando"
> *Orchestrator:* "Es un bug. Mi plan: 1) bug-hunter busca todas las instancias del patrón en hooks, 2) frontend-expert aplica fix, 3) clean-code agrega JSDoc, 4) test-engineer escribe test de regresión, 5) code-reviewer valida. ETA 25 min."

---

### 🐛 helios-bug-hunter — El cazador

**Quién es:** Detective de bugs. No arregla — encuentra.

**Patrones que busca (entre otros):**
- Loading states sin garantía de terminar
- Race conditions con setState concurrente
- Promesas sin catch
- useEffect sin cleanup
- localStorage para datos sensibles
- Scripts que destruyen datos de usuarios

**Output:** Lista markdown de bugs encontrados con archivo, línea, severidad (CRITICAL/HIGH/MEDIUM/LOW), patrón y recomendación.

**Cuándo lo invocas:**
- Antes de CUALQUIER deploy
- Cuando una usuaria reporta comportamiento extraño
- En refactors grandes
- Como auditor periódico

---

### 🎨 helios-frontend-expert — El implementador

**Quién es:** Programador React/TS/Vite/Supabase. Conoce el stack exacto y los patterns del repo.

**Lo que hace:**
- Implementa cambios de UI, hooks, pages
- Sigue los patterns existentes (useAuth con try/catch, AppLayout con z-50)
- Respeta el tema HELIOS (teal #0A8478)
- TypeScript estricto (verbatimModuleSyntax, no any)

**Lo que NO hace:**
- No toca backend (Supabase schema, SQL)
- No escribe tests
- No agrega JSDoc extenso

**Cuándo lo invocas:**
- Después de bug-hunter (para aplicar el fix)
- Para implementar nuevas features
- Para refactors de código frontend

---

### 🧹 helios-clean-code — El curador

**Quién es:** Mantenedor de legibilidad. Asegura que cualquier compañero (o profesor) entienda el código en minutos.

**Lo que hace:**
- Agrega JSDoc en español claro
- Reorganiza imports (externos → internos → tipos → estilos)
- Renombra variables ambiguas
- Elimina código muerto (console.log, imports no usados, TODOs viejos)
- Refactoriza funciones con complexity > 10

**Lo que NO hace:**
- No cambia lógica funcional
- No agrega/quita features
- No toca tests

**Cuándo lo invocas:**
- Después de fix grande (>50 líneas tocadas)
- Antes de mergear PR
- Mantenimiento mensual

---

### 🧪 helios-test-engineer — El guardián de regresiones

**Quién es:** Ingeniero de QA. Protege el código contra regresiones futuras.

**Lo que hace:**
- Escribe tests de regresión para cada bug arreglado
- Usa Vitest + RTL con los patterns del repo (vi.hoisted, mocks de hooks)
- Mantiene cobertura ≥60% statements
- Verifica que los 39 tests sigan pasando tras cada cambio

**Cuándo lo invocas:**
- Después de fix de bug (escribir test de regresión)
- Después de feature nueva
- Cuando cobertura baja del threshold
- Antes de mergear

---

## Flujos de trabajo típicos

### Flujo A — Bug reportado por usuaria

```
Usuaria reporta bug
       ↓
helios-team-orchestrator (analiza, decide plan)
       ↓
helios-bug-hunter (encuentra TODAS las instancias)
       ↓
helios-frontend-expert (aplica fix consistente)
       ↓
helios-clean-code (JSDoc + limpieza)
       ↓
helios-test-engineer (test de regresión)
       ↓
pr-review-toolkit:code-reviewer (validación final)
       ↓
Commit + push + deploy
```

### Flujo B — Nueva feature

```
Definición de feature
       ↓
helios-team-orchestrator (analiza)
       ↓
helios-frontend-expert (implementación)
       ↓
helios-test-engineer (tests happy path + edge cases)
       ↓
helios-clean-code (limpieza)
       ↓
pr-review-toolkit:code-reviewer (validación final)
       ↓
Commit + push + deploy
```

### Flujo C — Refactor grande

```
Decisión de refactor
       ↓
helios-clean-code (identifica oportunidades)
       ↓
helios-bug-hunter (valida que no introduce bugs)
       ↓
helios-test-engineer (tests siguen pasando)
       ↓
pr-review-toolkit:code-reviewer (validación final)
       ↓
Commit + push + deploy
```

---

## Tabla rápida "Si vas a hacer X, invoca Y"

| Vas a... | Primer agente |
|---|---|
| Arreglar un bug reportado | `helios-team-orchestrator` |
| Implementar una US nueva | `helios-team-orchestrator` |
| Refactorizar un archivo grande | `helios-clean-code` |
| Auditar el código antes de deploy | `helios-bug-hunter` |
| Agregar tests faltantes | `helios-test-engineer` |
| Optimizar performance | `helios-bug-hunter` (encuentra cuellos) |
| Cambiar el schema BD | (Tech Lead manual, no hay agente backend) |
| Solo documentación | `pr-review-toolkit:comment-analyzer` |
| Typo o cambio trivial (<10 líneas) | (sin agente, hazlo directo) |

---

## Beneficios del enfoque de equipo

1. **Especialización:** cada agente es experto en su dominio
2. **Doble revisión:** el siguiente agente valida al anterior
3. **Velocidad:** trabajan en paralelo cuando aplica
4. **Consistencia:** patterns aplicados uniformemente
5. **Trazabilidad:** cada cambio tiene historia de quién lo hizo
6. **Aprendizaje:** los prompts de los agentes documentan las lecciones del Sprint 1

## Limitaciones conocidas

- **Costo:** cada invocación usa tokens. Para cambios triviales no usar el equipo.
- **Latencia:** un flujo de 5 agentes toma más tiempo que un fix directo. Vale la pena para cambios importantes, no para typos.
- **Riesgo de over-engineering:** el orchestrator puede recomendar más pasos de los necesarios. El usuario tiene veto.

## Cómo evolucionar el equipo

Para Sprint 2 considerar agregar:
- `helios-backend-expert` (Supabase RPC, SQL, RLS)
- `helios-security-auditor` (XSS, SQL injection, secrets en código)
- `helios-perf-optimizer` (bundle size, Lighthouse score)
- `helios-a11y-checker` (accesibilidad WCAG)

---

_Catálogo mantenido por Marian Barba (DevOps) — Sprint 1 semana 2._
