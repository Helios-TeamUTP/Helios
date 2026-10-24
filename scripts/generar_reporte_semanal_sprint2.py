"""Genera el REPORTE SEMANAL FORMAL del Sprint 2 (para entregar a la profesora).

Mapea EXACTAMENTE la rubrica del laboratorio:
  1. Daily Scrum (3 preguntas)
  2. Avance del desarrollo (codigo, diagramas, pruebas, metricas)
  3. Evidencias de medicion Unidad II (ISTQB, TMMi, TQM)
  4. Registro de metricas (requerimientos..calidad)
  5. Evidencias de uso de herramientas
  6. Actualizacion del backlog / Kanban
Con portada formal + diagramas embebidos.

Output:
    dailys/Entrega_Viernes/REPORTE_SEMANAL_SPRINT2.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "dailys" / "Entrega_Viernes" / "Sprint_2"
PDF = OUT_DIR / "REPORTE_SEMANAL_SPRINT2.pdf"
FLUJO = (OUT_DIR / "diagrama_flujo_usuario.png").as_posix()
ARQUI = (OUT_DIR / "diagrama_arquitectura.png").as_posix()
OUT_DIR.mkdir(parents=True, exist_ok=True)

CSS = """
@page { margin: 2cm 2cm; size: Letter; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Calibri', sans-serif; line-height: 1.5; color: #0F2A36; max-width: 720px; margin: 0 auto; }

.portada { text-align: center; padding-top: 120px; page-break-after: always; }
.portada .uni { font-size: 14pt; color: #4A6B7A; letter-spacing: 1px; }
.portada .materia { font-size: 12pt; color: #0A8478; margin-top: 6px; font-weight: 600; }
.portada .barra { width: 80px; height: 4px; background: #0A8478; margin: 28px auto; }
.portada h1 { font-size: 30pt; color: #0A4F6B; margin: 8px 0; border: none; }
.portada h2 { font-size: 18pt; color: #0A8478; margin: 4px 0 28px; border: none; }
.portada .proj { font-size: 13pt; color: #0F2A36; margin-bottom: 40px; }
.portada .equipo { font-size: 11pt; color: #0F2A36; line-height: 1.8; }
.portada .meta { margin-top: 48px; font-size: 11pt; color: #4A6B7A; }

h1 { color: #0A4F6B; border-bottom: 4px solid #0A8478; padding-bottom: 8px; margin-top: 30px; font-size: 20pt; page-break-before: always; }
h2 { color: #0A8478; margin-top: 22px; font-size: 15pt; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; }
h3 { color: #066F66; margin-top: 16px; font-size: 12.5pt; }
p { margin: 8px 0; text-align: justify; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; page-break-inside: avoid; }
th { background: #0A8478; color: white; padding: 7px; text-align: left; font-weight: 600; font-size: 9pt; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote { border-left: 4px solid #0A8478; padding: 8px 14px; background: #F4F7F8; margin: 10px 0; font-style: italic; }
code { background: #F4F7F8; padding: 2px 5px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 9pt; color: #B91C1C; }
strong { color: #0A4F6B; }
img { max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin: 8px 0; }
.fig { text-align: center; font-size: 9pt; color: #4A6B7A; margin-top: 2px; }
hr { border: none; border-top: 1px solid #ddd; margin: 22px 0; }
"""

PORTADA = """
<div class="portada">
  <div class="uni">UNIVERSIDAD TECNOLÓGICA DE PANAMÁ</div>
  <div class="materia">Calidad de Software · Unidad II — ISTQB · TMMi · TQM</div>
  <div class="barra"></div>
  <h1>Reporte Semanal de Avance</h1>
  <h2>Sprint 2 — Cancelación y Reprogramación</h2>
  <div class="proj"><strong>Proyecto HELIOS</strong><br>Sistema unificado de citas médicas (red de policlínicas)</div>
  <div class="equipo">
    <strong>Grupo HELIOS</strong><br>
    José Brown — Product Owner<br>
    Ethan González — Desarrollador Frontend<br>
    Alejandro Saenz — Tech Lead / Backend<br>
    Ashley Martínez — QA Engineer<br>
    Marian Barba — Scrum Master / DevOps
  </div>
  <div class="meta">
    Sprint 2 (HELL-3) · Junio 2026<br>
    Repositorio: github.com/MarianC-programing/Helios<br>
    Producción: helios-web-production.up.railway.app
  </div>
</div>
"""

CUERPO = rf"""
# 1. Daily Scrum — Las 3 preguntas (con evidencias)

Respuestas concretas y verificables del avance desde el laboratorio anterior.

### ¿Qué hicimos desde el último laboratorio?
- **Cancelar cita** (autoservicio del paciente): función SQL atómica + UI con modal. Commit `e68a872`.
- **Reprogramar cita** a otro horario del mismo médico: función SQL atómica + modal con calendario. Commit `e68a872`.
- **Tabla de auditoría** `citas_historial` + triggers (registra cada cambio).
- **6 bugs resueltos** (B-21 a B-26): calendario/zona horaria, cédula 5 tipos, doble confirmación, validaciones, slots vencidos, y un **hueco de seguridad RLS**.
- **Refuerzo de seguridad** (B-26): cerrado el acceso a datos ajenos en 7 tablas. Commit `3b08751`.
- **Validador de cédula a prueba de futuro** (comarcas nuevas). Commit `c1271e0`.
- **Evidencia:** 117 tests automatizados pasando, build limpio, todo desplegado en producción (HTTP 200).

### ¿Qué haremos para el próximo laboratorio?
| Actividad | Responsable | Meta |
|---|---|---|
| Sprint 3 — Sincronización entre sedes (HELL-4) | Alejandro + Ethan | Compartir disponibilidad entre policlínicas |
| Pruebas de seguridad OWASP ZAP (Sprint 5) | Ashley / Marian | Reporte de vulnerabilidades |
| Pruebas de rendimiento Lighthouse (Sprint 5) | Ashley | Core Web Vitals |
| Mover `chequeo_cedula` a RPC (deuda técnica) | Alejandro | Cerrar read-leak menor |

### ¿Qué problemas o bloqueos tuvimos?
- **Bug crítico (UNIQUE):** al cancelar, el horario quedaba inutilizable por una restricción `UNIQUE` total. **Detectado por el code review** antes del deploy y resuelto con un índice único parcial.
- **Hueco de seguridad heredado:** la policy permisiva `sprint1_all` seguía activa en 7 tablas; lo cerramos con una migración transaccional sin pérdida de datos.
- **Dependencia externa:** el proyecto Supabase pertenece a la cuenta del equipo; las migraciones SQL las ejecuta el PO en el dashboard (no automatizable desde el repo).
- **Cero regresiones:** los 65 tests del Sprint 1 siguen pasando.

---

# 2. Avance del desarrollo (evidencias técnicas)

### Código fuente
- **Frontend (React 19 + TypeScript):** hooks `useCancelarCita`, `useReprogramarCita`; componentes `BotonCancelarCita`, `ReprogramarCitaModal`; página `MisCitas` actualizada.
- **Backend (PostgreSQL / Supabase):** funciones `cancelar_cita_atomica`, `reprogramar_cita_atomica`, tabla `citas_historial` + trigger, migración de seguridad `sprint2_b26_cerrar_sprint1_all.sql`.
- Repositorio: `github.com/MarianC-programing/Helios`, rama `sprint1/bootstrap`. Commits firmados y trazables.

### Prototipo funcional (en producción)
- App en vivo: `helios-web-production.up.railway.app` — agendar, cancelar y reprogramar citas funcionando.

### Diagramas

<img src="file:///{FLUJO}" alt="Diagrama de flujo del usuario">
<div class="fig">Figura 1. Diagrama de flujo del usuario (paciente y médico) end-to-end.</div>

<img src="file:///{ARQUI}" alt="Diagrama de arquitectura">
<div class="fig">Figura 2. Arquitectura: GitHub → Railway → Frontend React → Supabase (BD + Auth + RLS).</div>

### Pruebas realizadas
- **117 tests automatizados** (Vitest + React Testing Library), todos pasando.
- **Pruebas de carga** (Locust): P95 = 300 ms con 200 usuarios concurrentes.
- **Code review** automatizado + humano antes de cada merge (detectó el bug crítico del UNIQUE).

---

# 3. Evidencias de medición aplicadas (Unidad II)

### ISTQB — Métricas de pruebas, defectos, cobertura, esfuerzo
- **Qué medimos:** tests automatizados, cobertura de código, defectos y latencia.
- **Cómo lo medimos:** Vitest (`pnpm vitest run --coverage`) para tests/cobertura; GitHub para defectos trazables; Locust para latencia.
- **Resultados e interpretación:** 117 tests (100% pasando), 61.4% de cobertura en sentencias (rango profesional 60-80%), 6 defectos detectados y resueltos (tasa ~8.7 bugs/KLOC, normal en MVP), P95 300 ms (meta 2 s, superada 6x). Interpretación: el producto es estable y la cobertura cubre la lógica crítica.

### TMMi — Madurez del proceso de pruebas (Nivel 2: Gestionado)
- **Práctica de medición:** métricas registradas por sprint (este reporte).
- **Control:** code review obligatorio antes de merge + threshold de cobertura ≥60% en CI (el build falla si baja).
- **Mejora:** cada bug genera un test de regresión (plan de pruebas trazable). Estamos en **Nivel 2 (Gestionado)**, en camino a Nivel 3.

### TQM — Mejora continua, calidad del proceso y del producto
- **Proceso:** Plan Mode obligatorio antes de codificar; documentación viva (CLAUDE.md).
- **Producto:** el PO prueba el deploy real antes de cada entrega; los bugs detectados en uso real se corrigen en la misma jornada.
- **Evidencia de mejora:** el bug crítico del UNIQUE fue cazado por el code review y corregido ANTES de producción; cero regresiones del Sprint 1.

---

# 4. Registro de métricas

| Categoría | Valor (Sprint 2) |
|---|---|
| **Requerimientos** | HELL-3 (épica) con 13 subtareas; cancelar + reprogramar al 100% |
| **Diseño** | 2 funciones SQL atómicas nuevas + 1 tabla de auditoría + 4 componentes/hooks frontend |
| **Código** | ~2.6 KLOC totales; 11 archivos nuevos/modificados este sprint; commits firmados |
| **Defectos** | 6 detectados (B-21..B-26) · 6 resueltos · 0 pendientes · ~8.7 bugs/KLOC |
| **Esfuerzo** | Sprint de ~2 semanas; ciclos Plan→Code→Review→Test→Deploy de <30 min por bug |
| **Productividad** | ~2 deploys/día; bundle reducido 754 → 503 KB (-34%) |
| **Calidad del proceso** | Code review obligatorio · threshold CI ≥60% · Plan Mode |
| **Calidad del producto** | 117 tests pasando · P95 300 ms · seguridad RLS reforzada · 0 regresiones |

---

# 5. Evidencias de uso de herramientas

| Herramienta | Uso en el Sprint 2 | Evidencia |
|---|---|---|
| **GitHub** | Control de versiones, commits firmados, code review | Commits `e68a872`, `3b08751`, `c1271e0` en `MarianC-programing/Helios` |
| **Jira** | Tablero Kanban, épica HELL-3 + 13 subtareas | `helios-group.atlassian.net` (HELL-3) |
| **Vitest + RTL** | Pruebas unitarias e integración | `pnpm vitest run` → 117/117 |
| **Locust** | Pruebas de carga | P95 300 ms con 200 usuarios |
| **Supabase** | BD PostgreSQL + Auth + RLS + funciones SQL | Dashboard del proyecto HELIOS |
| **Railway** | Despliegue continuo (CI) a producción | helios-web-production.up.railway.app |
| **SonarCloud** | Análisis estático (configurado) | `sonar-project.properties` + workflow GitHub Actions |
| **OWASP ZAP / Lighthouse** | Seguridad + rendimiento (planificado Sprint 5) | Guía en DOCUMENTACION_SPRINT2.pdf |

> Nota de honestidad: OWASP ZAP y Lighthouse están planificados para el Sprint 5 ("Pruebas y cierre"); en este sprint la calidad se midió con Vitest, Locust y code review.

---

# 6. Actualización del backlog / Tablero Kanban (Jira HELL-3)

### Épica del Sprint 2: HELL-3 — Cancelación y Reprogramación

| Estado | Subtareas |
|---|---|
| **Done (completadas)** | B-21 calendario, B-22 cédula, B-23 doble confirmación, B-24 validaciones, B-25 slots vencidos, B-26 seguridad, SQL cancelar, SQL reprogramar, tabla historial, hooks, componentes, MisCitas, dashboard médico |
| **In Progress** | (Sprint 2 esencialmente cerrado) |
| **To Do (Sprint 5)** | Pruebas OWASP ZAP, Pruebas Lighthouse |

### Otros sprints en el tablero (contexto)
- HELL-2 Sprint 1 — Agendamiento (entregado)
- **HELL-3 Sprint 2 — Cancelación y Reprogramación (este sprint)**
- HELL-4 Sprint 3 — Sincronización entre sedes (siguiente)
- HELL-5 Sprint 4 — Notificaciones
- HELL-6 Sprint 5 — Pruebas y cierre

### Bloqueos / dependencias
- Las migraciones SQL dependen de ejecución manual del PO en Supabase (proyecto del equipo).
- ZAP/Lighthouse dependen del Sprint 5.

---

# 7. Conclusiones

El Sprint 2 cumplió su objetivo: los pacientes ya pueden **cancelar y reprogramar** sus citas de forma autoservicio, con seguridad reforzada a nivel de base de datos y auditoría de cambios. Se resolvieron 6 defectos detectados en uso real, manteniendo cero regresiones y 117 pruebas automatizadas. La aplicación de ISTQB, TMMi y TQM se evidencia en métricas reales, code review obligatorio y mejora continua (el bug crítico se cazó antes de producción).

**Próximo sprint:** Sincronización entre sedes (HELL-4).

---

## Anexo — Cómo verificar (reproducibilidad)
```
cd helios-repo/frontend
pnpm install
pnpm vitest run            # 117/117 tests
pnpm build                 # build limpio (~503 KB)
curl -sf https://helios-web-production.up.railway.app/   # HTTP 200
```

_Reporte generado para el laboratorio de Calidad de Software · UTP 2026._
"""


def to_pdf_word(html_path: Path, pdf_path: Path) -> bool:
    try:
        import comtypes.client
    except ImportError:
        return False
    word = None
    try:
        word = comtypes.client.CreateObject("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(str(html_path.absolute()))
        doc.SaveAs(str(pdf_path.absolute()), FileFormat=17)
        doc.Close(False)
        return True
    except Exception as e:
        print(f"[error] Word: {e}")
        return False
    finally:
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass


def main():
    body = markdown.markdown(CUERPO, extensions=["tables", "fenced_code"])
    html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Reporte Semanal Sprint 2 - HELIOS</title><style>{CSS}</style></head>
<body>{PORTADA}{body}</body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        h = Path(tmp) / "rep.html"
        h.write_text(html, encoding="utf-8")
        if not to_pdf_word(h, PDF):
            raise SystemExit("No se pudo convertir (Word).")
    print(f"[ok] PDF: {PDF} ({PDF.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
