"""Genera PDF guion personal de Jose v3 (10 min, 12 slides).

Cambios respecto a v2:
- Jose ahora presenta AGENTES IA (slide 8) - NUEVO
- Marian ahora presenta BUGS DETECTADOS (slide 10)
- Distribucion ampliada a 10 minutos con 12 slides

Sus partes (5 min 15s del total de 10 min):
- Slide 4: Que hizo cada uno (50s)
- Slide 7: Diagrama flujo usuario (50s)
- Slide 8: AGENTES IA (75s) NUEVO
- Slide 9: Metricas ISTQB (50s)
- Slide 11 con Ashley: SonarCloud LIVE (80s)
- Slide 12: Cierre (10s)

Output:
    dailys/Entrega_Viernes/Guion_Jose_PERSONAL_v3.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "dailys" / "Entrega_Viernes" / "Guion_Jose_PERSONAL_v3.pdf"
PDF.parent.mkdir(parents=True, exist_ok=True)


GUION_MD = """# Guion Personal de Jose v3 (10 minutos)

> Tu chuleta personal para la presentacion del viernes 29/05/2026.
> ACTUALIZADO con cambios solicitados:
> - 10 minutos en lugar de 3
> - 12 slides en lugar de 8
> - **TU presentas AGENTES IA (slide 8 - NUEVO)**
> - **Marian presenta BUGS DETECTADOS (slide 10 - NUEVO)**
> - Ethan tiene slide propio Frontend (5)
> - Alejandro tiene slide propio Backend/SQL (6)

---

# TU TIEMPO TOTAL: 5 min 15 segundos (6 momentos)

| Tiempo | Slide | De que hablas |
|---|---|---|
| 1:35 - 2:25 | 4 | Que hizo cada uno (50s) |
| 3:35 - 4:25 | 7 | Diagrama flujo usuario (50s) |
| **4:25 - 5:40** | **8** | **AGENTES IA (75s) - NUEVO** |
| 5:40 - 6:30 | 9 | Metricas ISTQB (50s) |
| 8:10 - 9:30 | 11 | SonarCloud LIVE con Ashley (80s) |
| 9:50 - 10:00 | 12 | Cierre (10s) |

---

# SLIDE 4 - "Que hizo cada uno individualmente" (50 segundos)

> "Como Product Owner les muestro el aporte individual de cada integrante:
>
> **Yo, Jose Brown**, como PO valide cada deploy en produccion, detecte 8 bugs criticos en uso real, y configure los 5 agentes IA del equipo. 22 commits firmados.
>
> **Marian Barba**, Scrum Master y DevOps, hizo el setup inicial del proyecto, los deploys CI/CD a Railway, configuro el equipo de agentes y coordino las ceremonias Scrum. 26 commits, la mas activa.
>
> **Ethan Gonzalez**, Frontend, programo los componentes React con TypeScript, arreglo los bugs B-05 y B-08, e implemento la vista mobile del calendario.
>
> **Alejandro Saenz**, Tech Lead, diseno la arquitectura Supabase con Row Level Security, escribio la funcion SQL atomica y arreglo el bug de seguridad B-09.
>
> **Ashley Martinez**, QA Engineer, documento las metricas en cada sprint, calculo la tasa de defectos en 8.70 bugs por mil lineas, y prepara los casos de prueba para el demo."

---

# SLIDE 7 - "Diagrama de flujo del usuario" (50 segundos)

> "Aqui vemos el flujo completo de un usuario en HELIOS.
>
> Un usuario nuevo entra a registro, ingresa sus datos y password, y nuestro useAuth detecta automaticamente si hay datos pendientes en sessionStorage. Si los hay, **crea el paciente y el link sin pedirle nada mas**.
>
> Una vez adentro, el sistema lo redirige segun su rol: si es paciente al wizard de 4 pasos (especialidad, medico, calendario, confirmar), si es medico al dashboard con su agenda del dia.
>
> El medico puede marcar citas como completada o no asistio, ver la ficha del paciente y consultar su historial.
>
> Todo con seguridad RLS en base de datos: cada uno solo ve lo suyo. Un paciente nunca puede ver citas ajenas, ni siquiera manipulando el frontend."

---

# SLIDE 8 - "AGENTES IA HELIOS" (75 segundos) - **EL NUEVO MAS IMPORTANTE**

Este es el slide que aporta valor diferencial. Tomate tu tiempo aqui.

> "Una de nuestras innovaciones es el equipo de **agentes de IA especializados** que nos asisten en el desarrollo. Tenemos 5 agentes, cada uno con una responsabilidad especifica:
>
> **Primero: Team Orchestrator.** Es el que SIEMPRE se invoca primero. Analiza el cambio y decide que otros agentes lanzar y en que orden. Es el coordinador.
>
> **Segundo: Frontend Expert.** Conoce nuestro stack exacto: React 19, TypeScript 6, Vite 8, Tailwind y Supabase. Hace los cambios en componentes y hooks.
>
> **Tercero: Bug Hunter.** Detecta loading infinitos, race conditions, promesas sin catch. Lo invocamos antes de cada deploy y cuando se reporta un bug en uso real.
>
> **Cuarto: Clean Code.** Mantiene el codigo legible: agrega JSDoc, mejora naming, refactoriza cuando hay complejidad alta. Lo invocamos despues de cada fix grande.
>
> **Quinto: Test Engineer.** Especializado en Vitest y React Testing Library. Mantiene la cobertura sobre el 60% y escribe tests de regresion para cada bug nuevo.
>
> El resultado de tener este equipo coordinado es que **cada ciclo Plan-Codigo-Review-Test-Deploy lo cerramos en menos de 30 minutos por bug**. Eso explica como pudimos cazar y resolver 20 bugs en uso real durante el sprint sin perder el ritmo."

### Si te preguntan: "Estos agentes son humanos o IA?"

> "Son agentes de inteligencia artificial generativa configurados con instrucciones especificas para nuestro proyecto. Cada uno tiene un prompt especializado en su area. Los humanos somos quienes los invocamos, revisamos su salida y aprobamos los cambios. Es como tener 5 consultores junior expertos en tareas especificas."

### Si te preguntan: "Donde se configuran?"

> "En el repositorio, carpeta `.claude/agents/`. Cada agente es un archivo Markdown con su prompt y herramientas permitidas. Es portable: cualquier desarrollador clona el repo y tiene el mismo equipo."

### Si te preguntan: "Que tan profesional es esto?"

> "Es el estandar 2026. Empresas como Microsoft, Google y Amazon usan asistentes de IA especializados. Nuestro aporte es la **especializacion por dominio**: en lugar de un agente generico, tenemos 5 enfocados que dan mejor resultado."

---

# SLIDE 9 - "Metricas ISTQB" (50 segundos)

> "Segun el estandar ISTQB medimos cuatro indicadores clave:
>
> **65 pruebas automatizadas** con Vitest, todas pasan. Tenemos umbral minimo del 60% activo en CI: si baja, el build se rechaza solo.
>
> **61.4% de cobertura de codigo** en sentencias y 90.9% en funciones. Rango profesional, el estandar es 60 a 80%.
>
> **300 milisegundos de latencia P95** con 200 usuarios concurrentes en Locust. Meta era 2 segundos, lo superamos seis veces.
>
> **20 defectos cazados y resueltos**, tasa de 8.70 bugs por mil lineas. Profesional, todos documentados con su fix."

### Por que solo ISTQB (sin TMMi+TQM)?

La profesora recomendo a otro grupo que para proyectos pequenos enfoquen en una sola. Elegimos ISTQB porque es **mas concreta y medible**.

Si la profesora pregunta: *"Tambien aplicamos TMMi nivel 2 y TQM en el proceso, pero por la escala del proyecto enfocamos las metricas en ISTQB. El detalle esta en el reporte completo en el repositorio."*

---

# SLIDE 11 - "SonarCloud LIVE" (80 segundos) - CON ASHLEY

Ashley o tu abren el dashboard. Tu narras.

> "Vamos a hacer un demo en vivo de SonarCloud, la herramienta que la profesora recomendo.
>
> *(Mostrar dashboard SonarCloud)*
>
> SonarCloud analiza nuestro codigo automaticamente en cada push a GitHub. Lo que vemos en el dashboard:
>
> Primero, los **bugs detectados** que SonarCloud encontro. Estos son problemas que nuestros tests pudieron haber pasado por alto.
>
> *(Click en Bugs)*
>
> Segundo, los **code smells**: patrones que funcionan pero podrian causar problemas en el futuro. Por ejemplo funciones muy complejas o codigo duplicado.
>
> Tercero, las **vulnerabilidades de seguridad**. Esto cubre validacion de inputs, autenticacion, etc.
>
> *(Click en Coverage)*
>
> Cuarto, el **coverage** de los tests. Aqui vemos el mismo 61.4% que medimos con Vitest, validado por una herramienta externa.
>
> Y por ultimo el **Quality Gate**: la luz verde o roja que indica si el codigo cumple los thresholds que configuramos. Si falla, no deployamos a produccion."

### Datos que llenas ANTES del demo (mira el dashboard, anota aqui):

- Bugs: ____
- Code smells: ____
- Vulnerabilidades: ____
- Coverage: 61.4%
- Duplications: ____
- Quality Gate: PASS / FAIL

### Si SonarCloud falla en vivo (plan B):

> "Por temas de conectividad no carga ahora. Pero en el repositorio en la pestana Actions pueden ver el ultimo analisis exitoso. Tambien el `sonar-project.properties` configurado."

---

# SLIDE 12 - CIERRE (10 segundos)

> "MVP funcional, metricas medidas, proceso documentado, agentes IA. Gracias. Preguntas?"

---

# QUE HACEN LOS DEMAS (para tu contexto)

| Tiempo | Slide | Quien | Tema |
|---|---|---|---|
| 0:00 - 0:40 | 1+2 | Marian | Portada + Daily Scrum |
| 0:40 - 1:35 | 3 | Ashley | QR + demo en vivo |
| 2:25 - 3:00 | 5 | Ethan | Frontend especifico |
| 3:00 - 3:35 | 6 | Alejandro | Backend / SQL |
| **6:30 - 8:10** | **10** | **Marian** | **BUGS DETECTADOS (NUEVO)** |
| 9:30 - 9:50 | 12 | Marian | Kanban + Sprint 2 |

---

# EXPLICACION DETALLADA DE AGENTES IA (para responder preguntas)

## Que es un agente de IA?

Es un programa que usa modelos de lenguaje grandes (como Claude o GPT-4) configurado para una tarea especifica. Le das instrucciones, le pasas codigo o documentos, y te devuelve trabajo hecho que tu revisas.

**Diferencia con ChatGPT generico:** un agente tiene contexto del proyecto, conoce el stack, y se especializa en una tarea (ej: detectar bugs, escribir tests, refactorizar).

## Como se invocan en HELIOS?

En el archivo `CLAUDE.md` del repositorio definimos el flujo obligatorio:

1. Primero invocar `helios-team-orchestrator` (decide que hacer)
2. El orchestrator llama a los agentes especializados que correspondan
3. Cada agente hace su parte y reporta al orchestrator
4. Humano revisa y aprueba

## Por que son innovacion?

Otros grupos usan IA tipo ChatGPT generico. Nosotros tenemos **agentes especializados por dominio**:

- frontend-expert sabe React 19 exacto
- bug-hunter sabe patrones tipicos de React (race conditions)
- clean-code sabe convenciones de TypeScript del proyecto
- test-engineer sabe Vitest + RTL especifico

El resultado es **mas calidad por menos tiempo**.

## Comparacion con desarrollo tradicional

| Tarea | Sin agentes | Con agentes HELIOS |
|---|---|---|
| Diagnostico de bug | 1-3 dias | 30 minutos |
| Fix + test + deploy | 2-4 horas | 30-60 minutos |
| Code review | Cuando alguien pueda | Automatico antes de cada merge |
| Documentar bug | Olvidado | Forzado por proceso |

## Demuestra el valor con un ejemplo

El bug B-20 (race React) se cazo y resolvio en menos de 3 horas con 4 iteraciones. Cada iteracion incluyo:

1. Bug-hunter analizo el sintoma
2. Orchestrator decidio plan de fix
3. Frontend-expert implemento
4. Test-engineer escribio test de regresion
5. Code review aprobado
6. Deploy a produccion

Sin este proceso, un bug asi habria tomado **dias**.

---

# CHECKLIST 30 MIN ANTES DEL DEMO

- [ ] PPTX v3 (10 min) abierto en pantalla compartida
- [ ] Tabs del navegador listas:
  - sonarcloud.io con dashboard HELIOS
  - helios-web-production.up.railway.app/login (con cuenta lista)
  - github.com/MarianC-programing/Helios
  - helios-group.atlassian.net (Jira)
- [ ] PDF guion personal v3 en celular
- [ ] Numeros SonarCloud anotados en papel
- [ ] Marian con cronometro discreto

---

# RESUMEN ULTRA-RAPIDO

**Numeros clave que NUNCA debes olvidar:**

| Numero | Que es |
|---|---|
| **65** | Tests automatizados |
| **300 ms** | Latencia P95 con 200 users |
| **20** | Bugs detectados y resueltos |
| **5** | Agentes IA del equipo |
| **8.70** | Bugs por mil lineas de codigo |

**Las 3 frases magicas si te trabas:**

1. "Esta documentado en el repositorio."
2. "Sigue el estandar ISTQB."
3. "El SonarCloud lo demuestra en vivo."

---

**Suerte el viernes. Esta version cubre todo el feedback de la profesora y mas.**
"""


CSS = """
@page { margin: 1.5cm 2cm; size: Letter; }
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Calibri', sans-serif;
  line-height: 1.55;
  color: #0F2A36;
  max-width: 720px;
  margin: 0 auto;
}
h1 { color: #0A4F6B; border-bottom: 3px solid #0A8478; padding-bottom: 8px;
     margin-top: 24px; font-size: 22pt; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; margin-top: 0; }
h2 { color: #0A8478; margin-top: 24px; font-size: 16pt;
     border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
h3 { color: #066F66; margin-top: 16px; font-size: 13pt; }
h4 { color: #0A4F6B; margin-top: 12px; font-size: 11pt; }
p { margin: 8px 0; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0;
         font-size: 10pt; page-break-inside: avoid; }
th { background: #0A8478; color: white; padding: 8px; text-align: left;
     font-weight: 600; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote { border-left: 4px solid #0A8478; padding: 10px 16px;
             background: #F4F7F8; margin: 12px 0; color: #0F2A36;
             font-style: italic; }
code { background: #F4F7F8; padding: 2px 5px; border-radius: 3px;
       font-family: 'Consolas', monospace; font-size: 9pt; color: #B91C1C; }
strong { color: #0A4F6B; }
hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
"""


def convert_with_word(html_path, pdf_path):
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
        print(f"[error] {e}")
        return False
    finally:
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass


def main():
    body = markdown.markdown(GUION_MD, extensions=["tables", "fenced_code"])
    html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Guion Jose v3 - 10 min</title><style>{CSS}</style>
</head><body>{body}</body></html>"""

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_html = Path(tmpdir) / "guion.html"
        tmp_html.write_text(html, encoding="utf-8")
        if not convert_with_word(tmp_html, PDF):
            raise SystemExit("No se pudo convertir.")

    print(f"[ok] PDF generado: {PDF}")
    print(f"[ok] Tamano: {PDF.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
