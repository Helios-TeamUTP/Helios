"""Genera el PDF v2 del guion personal de Jose con feedback profesora:

Cambios respecto a v1:
- Slide 4: explicar "que hizo cada uno" con su nombre y rol
- Slide 5: nuevo, explicar diagrama de flujo del usuario
- Slide 6: solo ISTQB (sin TMMi + TQM, recomendacion profesora)
- Slide 7: NUEVO - SonarCloud live demo (que dice Jose mientras Ashley clickea)
- NO mas captura de codigo

Output:
    dailys/Entrega_Viernes/Guion_Jose_PERSONAL_v2.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "dailys" / "Entrega_Viernes" / "Guion_Jose_PERSONAL_v2.pdf"
PDF.parent.mkdir(parents=True, exist_ok=True)


GUION_MD = """# Guion Personal de Jose v2 - Sprint 1 HELIOS

> Documento personal de Jose Brown (Product Owner) para la presentacion del viernes.
> ACTUALIZADO con feedback de la profesora del 28/05/2026:
> - Que hizo cada uno individualmente (NUEVO slide 4)
> - Diagrama de flujo del usuario (NUEVO slide 5)
> - Solo ISTQB (sin TMMi+TQM por recomendacion)
> - SonarCloud en vivo (NUEVO slide 7)
> - NO captura de codigo
>
> Duracion de tu parte: ~90 segundos (4 slides + cierre)

---

# DISTRIBUCION ACTUALIZADA (3 minutos)

| Tiempo | Slide | Quien | De que habla |
|---|---|---|---|
| 0:00 - 0:25 | 1 + 2 | Marian | Portada + 3 preguntas Daily |
| 0:25 - 1:00 | 3 | Ashley | QR + demo en vivo |
| 1:00 - 1:25 | 4 | Jose | Que hizo cada uno (NUEVO) |
| 1:25 - 1:50 | 5 | Jose | Diagrama flujo usuario (NUEVO) |
| 1:50 - 2:15 | 6 | Jose | Metricas ISTQB |
| 2:15 - 2:50 | 7 | Ashley + Jose | SonarCloud LIVE (NUEVO) |
| 2:50 - 3:00 | 8 | Jose | Cierre + preguntas |

---

# TU PARTE (Slides 4, 5, 6, 7, 8)

## SLIDE 4 - "Que hizo cada uno individualmente" (25 segundos)

> "Como Product Owner les muestro el aporte individual de cada integrante en este sprint:
>
> **Yo, Jose**, como PO valide cada deploy en produccion real y detecte 8 bugs criticos en uso. Lidere las 4 iteraciones del bug B-20 hasta encontrar la causa raiz.
>
> **Marian**, Scrum Master, hizo el setup inicial, los deploys CI a Railway, configuro los 5 agentes IA del equipo. Es la que mas commits tiene, 26.
>
> **Ethan**, Frontend, programo los componentes React, arreglo los bugs B-05 (toolbar) y B-08 (hooks), e implemento la vista mobile del calendario.
>
> **Alejandro**, Tech Lead, diseno la arquitectura Supabase con Row Level Security, escribio la funcion SQL atomica crear_cita_atomica y arreglo el bug de seguridad B-09.
>
> **Ashley**, QA, documento las metricas en cada sprint, calculo la tasa de defectos y prepara los casos de prueba para el demo."

### Si te preguntan: "Como midieron quien hizo que?"

> "Por los commits firmados en GitHub. Marian tiene 26, yo 22, Ashley 6, Ethan 3 y Alejandro 2. Pero los numeros no reflejan el trabajo: por ejemplo Alejandro hizo decisiones arquitectonicas criticas que aplicamos todos."

---

## SLIDE 5 - "Diagrama de flujo del usuario" (25 segundos)

> "Aqui vemos el flujo completo del usuario en el sistema.
>
> Un usuario nuevo se registra, va a login, ingresa password y nuestro useAuth detecta automaticamente si hay datos pendientes en sessionStorage. Si los hay, crea el paciente y el link sin pedirle nada mas.
>
> Una vez adentro, el sistema lo redirige segun su rol: paciente al wizard de 4 pasos (especialidad, medico, calendario, confirmar), medico al dashboard con su agenda del dia.
>
> El medico puede marcar citas como completada o no asistio, y ver la ficha del paciente. Todo con seguridad RLS en base de datos: cada uno solo ve lo suyo."

### Si te preguntan: "Como hicieron el diagrama?"

> "Con Mermaid, una herramienta open source. El codigo del diagrama esta en el repositorio, en scripts/generar_diagrama_flujo.py. Se regenera automaticamente si cambia el flujo."

---

## SLIDE 6 - "Metricas ISTQB" (25 segundos)

> "Segun el estandar internacional ISTQB, medimos cuatro indicadores clave:
>
> **65 pruebas automatizadas** con Vitest, todas pasan. Tenemos un umbral minimo del 60% activo: si baja, el build se rechaza solo.
>
> **61.4% de cobertura de codigo** en sentencias y **90.9% en funciones**. Estamos en rango profesional, 60 a 80% es el estandar de la industria.
>
> **300 milisegundos de latencia P95** con 200 usuarios concurrentes usando Locust. La meta era 2 segundos, la superamos seis veces.
>
> **20 defectos cazados y resueltos**, tasa de 8.70 bugs por mil lineas de codigo. Esta en rango profesional y todos estan documentados en el repo con su causa, fix y commit."

### NOTA IMPORTANTE: Por que SOLO ISTQB (sin TMMi+TQM)?

La profesora recomendo a otro grupo que **para proyectos pequenos solo usen una de las dos**. Tu eliges ISTQB porque:

- Es **mas concreto y medible** (numeros vs cualitativo)
- Es **mas conocido** por la profesora
- Cubre todo lo que necesitamos demostrar

Si la profesora pregunta por TMMi/TQM, di:

> "Tambien aplicamos TMMi nivel 2 y TQM en nuestro proceso, pero por la escala del proyecto enfocamos las metricas presentadas en ISTQB. El detalle TMMi/TQM esta en el reporte completo que dejamos en el repositorio."

---

## SLIDE 7 - "SonarCloud LIVE" (35 segundos) - **EL CLAVE NUEVO**

> "Vamos a hacer un demo en vivo de SonarCloud, que la profesora recomendo en el feedback.
>
> *(Ashley o tu abren el dashboard de SonarCloud en pantalla)*
>
> SonarCloud analiza automaticamente nuestro codigo en cada push a GitHub. Lo que vamos a ver:
>
> Primero, los **bugs detectados** que SonarCloud encontro automaticamente. Estos son problemas que nuestros tests pudieron haber pasado por alto.
>
> Segundo, los **code smells** que son patrones que funcionan pero podrian causar problemas en el futuro.
>
> Tercero, las **vulnerabilidades de seguridad** detectadas. Esto incluye temas como autenticacion, validacion de inputs, etc.
>
> Cuarto, el **Quality Gate**: pasa o falla segun los thresholds que configuramos. Si falla, no hacemos deploy.
>
> *(Mostrar el dashboard real con los numeros que SonarCloud detecto en HELIOS)*"

### Si te preguntan: "Por que SonarCloud y no SonarQube local?"

> "SonarCloud es la version cloud de SonarQube, ambos son del mismo fabricante. Elegimos cloud porque se integra automaticamente con GitHub: cada push dispara analisis. Sin instalacion local. Y es gratis para repos publicos como el nuestro."

### Si te preguntan: "Donde esta el dashboard?"

> "En sonarcloud.io, busquen el proyecto MarianC-programing_Helios. Tambien se puede acceder desde la pestana Actions de GitHub donde corre el workflow."

### Si te preguntan: "Que numeros tiene el proyecto?"

(Esto depende del analisis. Cuando configures SonarCloud, anota aqui los numeros reales antes del demo)

- Bugs: ___ (se ven en pantalla)
- Code smells: ___
- Vulnerabilidades: ___
- Coverage: 61.4% (esto si lo sabemos)
- Duplications: ___

---

## SLIDE 8 - CIERRE (10 segundos)

> "MVP funcional, metricas medidas, proceso documentado. Gracias. Preguntas?"

---

# EXPLICACION DE TERMINOS NUEVOS (para preguntas)

## SonarCloud / SonarQube

### Que es?

Plataforma de **analisis estatico de codigo**. Revisa el codigo sin ejecutarlo y detecta:

- **Bugs:** errores reales que pueden fallar en produccion
- **Code smells:** codigo que funciona pero esta mal disenado (complejo, duplicado, etc)
- **Vulnerabilidades:** problemas de seguridad
- **Cobertura de tests:** cuanto codigo esta probado
- **Duplicaciones:** codigo copiado-pegado

### Analogia

Es como un **revisor ortografico de Word**, pero para codigo. No corrige los errores automaticamente, pero los marca en rojo para que el programador los arregle.

### Diferencia SonarCloud vs SonarQube

- **SonarQube:** se instala en un servidor local
- **SonarCloud:** version cloud, se conecta directo con GitHub
- Misma empresa, mismas reglas
- Nosotros usamos SonarCloud porque es mas rapido de configurar

### Si la profesora pide ver SonarCloud en vivo

1. Abrir https://sonarcloud.io
2. Buscar proyecto "MarianC-programing_Helios"
3. Mostrar el dashboard general (Quality Gate)
4. Click en Bugs - mostrar issues detectados
5. Click en Code Smells - mostrar patrones
6. Click en Coverage - mostrar el 61.4%

## Quality Gate

Es un **conjunto de reglas** que el codigo debe pasar para considerarse de calidad. Por ejemplo:

- Coverage >= 60%
- Cero bugs criticos
- Duplicaciones < 5%
- Cero vulnerabilidades

Si el codigo pasa el Quality Gate -> luz verde, se puede deployar.
Si no pasa -> luz roja, hay que arreglar antes.

---

# PREGUNTAS QUE TE PUEDEN HACER

## Sobre los aportes individuales

**Por que Marian tiene mas commits que tu (el PO)?**

> "Marian es Scrum Master y DevOps. Hace todos los deploys, configuracion de CI/CD, y mantenimiento del repo. Su rol genera mas commits operativos. Mi rol como PO es mas estrategico: validar, priorizar, detectar bugs en uso real."

**Por que Alejandro solo tiene 2 commits?**

> "Alejandro es Tech Lead. Sus aportes son arquitectonicos: una buena decision de diseno equivale a 100 commits de implementacion. El diseno de RLS por rol y la funcion SQL atomica son su trabajo y permean todo el sistema."

**Hicieron pair programming?**

> "Si, especialmente para bugs criticos como el B-20. La pair programming aceleraba el diagnostico."

## Sobre el diagrama

**Por que mostrar este diagrama y no otro?**

> "Mostramos el flujo del usuario porque es lo que afecta directamente la experiencia. Tenemos otros diagramas de arquitectura, pero el flujo de usuario es lo que la profesora ve cuando hace el demo."

**Como se actualiza el diagrama si cambia el flujo?**

> "Esta como codigo en el repositorio. Si cambia el flujo, editamos el codigo Mermaid y se regenera la imagen automatico."

## Sobre SonarCloud

**Cuando lo configuraron?**

> "Esta semana, despues de tu recomendacion el miercoles. El workflow corre en cada push al repo."

**Encontro problemas?**

> "(Depender de lo que aparezca en el dashboard. Si hay bugs reales, decir): Encontro X cosas que estamos evaluando. Lo importante es que esta corriendo y nos da visibilidad. Lo que arreglemos quedara en el Sprint 2."

**Por que no lo usaron antes?**

> "Es parte de la madurez del proceso. Empezamos con tests unitarios (Vitest), pruebas de carga (Locust), y ahora agregamos analisis estatico (SonarCloud). Es la evolucion natural."

---

# CHECKLIST 30 MIN ANTES DEL DEMO

- [ ] PPTX v2 abierta en pantalla compartida
- [ ] Navegador con TABS abiertas:
  - [ ] sonarcloud.io/project/overview?id=MarianC-programing_Helios
  - [ ] helios-web-production.up.railway.app/login (con cuenta lista)
  - [ ] github.com/MarianC-programing/Helios
  - [ ] helios-group.atlassian.net (Jira)
- [ ] Celular con el QR de la slide 3 cargado
- [ ] Anotar en papel los numeros de SonarCloud (bugs, smells, etc)
- [ ] Cronometro discreto
- [ ] Este PDF abierto en pestana o celular

---

# RESUMEN ULTRA-RAPIDO

Los **3 numeros clave** que NUNCA debes olvidar:

| Numero | Que es |
|---|---|
| **65** | Tests automatizados que pasan |
| **300 ms** | Latencia con 200 usuarios |
| **20** | Bugs detectados y resueltos |

Las **3 frases magicas** si te trabas:

1. "Esta documentado en el repositorio."
2. "Sigue el estandar ISTQB."
3. "El SonarCloud lo demuestra en vivo."

---

**Suerte el viernes, Jose. Esta vez si lleva las nuevas mejoras pedidas por la profesora.**
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
h1 {
  color: #0A4F6B;
  border-bottom: 3px solid #0A8478;
  padding-bottom: 8px;
  margin-top: 24px;
  font-size: 22pt;
  page-break-before: always;
}
h1:first-of-type { page-break-before: avoid; margin-top: 0; }
h2 {
  color: #0A8478;
  margin-top: 24px;
  font-size: 16pt;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 4px;
}
h3 {
  color: #066F66;
  margin-top: 16px;
  font-size: 13pt;
}
h4 { color: #0A4F6B; margin-top: 12px; font-size: 11pt; }
p { margin: 8px 0; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 10pt;
  page-break-inside: avoid;
}
th { background: #0A8478; color: white; padding: 8px; text-align: left; font-weight: 600; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote {
  border-left: 4px solid #0A8478;
  padding: 10px 16px;
  background: #F4F7F8;
  margin: 12px 0;
  color: #0F2A36;
  font-style: italic;
}
code {
  background: #F4F7F8;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: 'Consolas', monospace;
  font-size: 9pt;
  color: #B91C1C;
}
strong { color: #0A4F6B; }
hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
"""


def convert_with_word(html_path: Path, pdf_path: Path) -> bool:
    try:
        import comtypes.client  # type: ignore
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
        print(f"[error] Word fallo: {e}")
        return False
    finally:
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass


def main():
    body = markdown.markdown(GUION_MD, extensions=["tables", "fenced_code"])
    html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Guion Personal Jose v2 - Sprint 1 HELIOS</title>
<style>{CSS}</style>
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
