# Equipo de Agentes HELIOS — Índice

> Este equipo de agentes especializados trabaja en conjunto para mantener la calidad del código HELIOS.
> **Uso obligatorio en cualquier cambio no-trivial** (ver `helios-repo/CLAUDE.md`).

## Los 5 agentes del equipo

| Agente | Archivo | Rol | Cuándo invocar |
|---|---|---|---|
| 🎯 [helios-team-orchestrator](helios-team-orchestrator.md) | `helios-team-orchestrator.md` | Coordinador del equipo | **SIEMPRE primero** en cambios no-triviales |
| 🐛 [helios-bug-hunter](helios-bug-hunter.md) | `helios-bug-hunter.md` | Detector de bugs | Antes de deploy, ante reporte de bug |
| 🎨 [helios-frontend-expert](helios-frontend-expert.md) | `helios-frontend-expert.md` | Implementación React/TS/Supabase | Cualquier cambio de UI/hooks |
| 🧹 [helios-clean-code](helios-clean-code.md) | `helios-clean-code.md` | Limpieza y JSDoc | Después de fix grande, antes de PR |
| 🧪 [helios-test-engineer](helios-test-engineer.md) | `helios-test-engineer.md` | Tests con Vitest | Después de fix o feature |

## Cómo activar los agentes (acción del usuario)

> **Nota:** Por restricciones de seguridad del harness, los agentes deben colocarse manualmente en `.claude/agents/` por ti (no por mí). Es un paso de 30 segundos.

### Paso 1: Crear la carpeta
En PowerShell o File Explorer:
```powershell
mkdir "C:\Users\brown\Documents\software\universidad\CALIDAD DE SOFTWARE\CALIDAD DE SOFTWARE\helios-repo\.claude\agents"
```

### Paso 2: Copiar los 5 archivos
Desde `helios-repo/docs/agentes/` copia los archivos `.md` (excepto este README) a `helios-repo/.claude/agents/`.

PowerShell:
```powershell
$src = "C:\Users\brown\Documents\software\universidad\CALIDAD DE SOFTWARE\CALIDAD DE SOFTWARE\helios-repo\docs\agentes"
$dst = "C:\Users\brown\Documents\software\universidad\CALIDAD DE SOFTWARE\CALIDAD DE SOFTWARE\helios-repo\.claude\agents"
Copy-Item "$src\helios-*.md" -Destination $dst
```

### Paso 3: Verificar
```powershell
ls "$dst"
```
Debes ver los 5 archivos `.md`.

### Paso 4: Reiniciar Claude Code en este proyecto
Cierra la sesión actual y abre una nueva. Los agentes serán reconocidos automáticamente.

## Cómo invocar un agente desde Claude Code

Una vez activados, los agentes se invocan via el Task tool:

```
Task({
  description: "Encontrar bugs en hooks",
  subagent_type: "helios-bug-hunter",
  prompt: "Busca todos los hooks en frontend/src/hooks/ que no tengan try/catch/finally..."
})
```

## Flujo típico de uso

### Bug reportado:
1. `helios-team-orchestrator` → analiza la tarea
2. `helios-bug-hunter` → encuentra TODAS las instancias del patrón
3. `helios-frontend-expert` → aplica fix consistente
4. `helios-clean-code` → JSDoc explicativo
5. `helios-test-engineer` → test de regresión
6. `pr-review-toolkit:code-reviewer` → validación final
7. Commit + push + deploy

### Nueva feature:
1. `helios-team-orchestrator` → analiza
2. `helios-frontend-expert` → implementación
3. `helios-test-engineer` → tests happy path + edge cases
4. `helios-clean-code` → limpieza
5. `pr-review-toolkit:code-reviewer` → review final

## Documentación adicional

- Catálogo extenso para humanos: `docs/EQUIPO_DE_AGENTES_HELIOS.md`
- Reglas obligatorias del proyecto: `CLAUDE.md` (sección "Reglas OBLIGATORIAS para cambios")

## Mantenimiento del equipo

- **Para agregar un nuevo agente:** crear archivo `.md` aquí + en `.claude/agents/`, agregar al README
- **Para deprecar un agente:** mover a `docs/agentes/deprecated/` con explicación
- **Para actualizar prompt de agente:** editar el archivo + reiniciar Claude Code
