"""Genera la documentación del Sprint 2 en PDF.

Cubre: bug del calendario (timezone) + fix, investigación de tipos de cédula
panameña (con fuentes del Tribunal Electoral), nuevas validaciones de formulario,
y la guía de pruebas de seguridad (OWASP ZAP) y rendimiento (Lighthouse), más
las subtareas listas para pegar en Jira HELL-3.

Output:
    dailys/Entrega_Viernes/DOCUMENTACION_SPRINT2.pdf

Uso:
    python scripts/generar_documentacion_sprint2.py
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "dailys" / "Entrega_Viernes" / "DOCUMENTACION_SPRINT2.pdf"
PDF.parent.mkdir(parents=True, exist_ok=True)


DOC_MD = r"""# Documentación Sprint 2 - HELIOS

**Sistema:** HELIOS - Citas Médicas Unificadas
**Materia:** Calidad de Software - UTP 2026
**Sprint:** 2 (en curso) - Bugs urgentes + Cancelación/Reprogramación + Testing
**Fecha:** junio 2026

---

## 1. Resumen

Tras la demo del Sprint 1, el Product Owner detectó en producción un bug del
calendario (desfase de hora) y pidió reforzar la validación de datos del
registro para evitar errores humanos, priorizando la seguridad y que el sistema
"no se rompa nunca". Este documento describe los 4 bugs corregidos (B-21 a B-24),
la investigación de los tipos de cédula panameña, y el plan de pruebas de
seguridad (OWASP ZAP) y rendimiento (Lighthouse).

**Resultado:** 100/100 tests pasando, bundle reducido de 754 KB a 496 KB, y
cero regresiones del Sprint 1.

---

## 2. Bug B-21 - Calendario: desfase de hora (zona horaria)

### Síntoma
En el calendario de agendamiento aparecía un horario (ej. 12:30 PM) pero al
seleccionarlo el bloque se posicionaba/interpretaba en otra hora. El usuario
creía agendar a una hora distinta de la mostrada.

### Causa raíz
La vista de desktop usaba la librería **FullCalendar**, que construye los
eventos a partir de cadenas ISO sin zona horaria:

```
start: `${horario.fecha}T${horario.hora_inicio}`   // ej. "2026-06-15T12:30:00"
```

JavaScript convierte esa cadena a un objeto `Date` aplicando el desfase de la
zona horaria del navegador (Panamá es UTC-5). Por eso el bloque visual no
coincidía con el título del slot. (La vista móvil NO tenía el bug porque
mostraba la hora con un corte de texto directo, sin convertir a `Date`.)

Además, `useHorarios` y `useMedicoCitas` calculaban "hoy" con
`new Date().toISOString()`, que devuelve la fecha en UTC: después de las 7 PM
en Panamá eso adelantaba al día siguiente y podía ocultar slots de hoy.

### Solución
- Usar **siempre la vista de botones por día** (la misma de móvil, ya probada),
  tanto en móvil como en desktop. Esta vista muestra y selecciona la hora con
  un corte de texto (`hora_inicio.slice(0,5)`), sin pasar por `Date`, por lo que
  es 100% segura ante zonas horarias y nunca puede desfasar la hora.
- Se eliminó la dependencia de FullCalendar -> el bundle bajó de **754 KB a
  496 KB** (-34 %).
- `useHorarios` y `useMedicoCitas` ahora calculan la fecha local a mano
  (año-mes-día), sin `toISOString()`.

### Verificación
Test automatizado: un slot con `hora_inicio = "12:30:00"` se muestra como
"12:30" y al elegirlo se pasa exactamente ese horario (no 07:00 ni otra hora).

---

## 3. Bug B-22 - Validación de cédula panameña (5 tipos)

### Síntoma
El validador rechazaba cédulas válidas cortas. Ejemplo real: `PE-5-687` (un
panameño nacido en el extranjero) quedaba en 4 dígitos al quitar el prefijo y se
rechazaba, aunque es una cédula legítima.

### Investigación: tipos de cédula en Panamá
Según el **Tribunal Electoral de Panamá**, existen estos tipos:

| Tipo | Formato | Ejemplo | Descripción |
|---|---|---|---|
| Natural (por nacimiento) | provincia(1-13)-tomo-asiento | 8-926-1601 | Panameño nacido en el país |
| PE | PE-tomo-asiento | PE-5-687 | Panameño nacido en el extranjero |
| N | N-tomo-asiento | N-19-473 | Naturalizado |
| E | E-provincia-orden | E-8-74258 | Extranjero domiciliado |
| PI | PI-tomo-asiento | PI-12-3456 | Indígena / comarca |

- Las provincias se numeran del **1 al 13** (la 13 es Panamá Oeste, agregada en 2014).
- El tomo y el asiento son numéricos y de longitud variable (por eso hay cédulas
  con menos dígitos).

### Solución
Se reescribió `lib/cedula.ts` para validar la **estructura por tipo** (no un
conteo rígido de dígitos), con un fallback permisivo de dígitos puros (5-13)
para no rechazar nunca una cédula real escrita sin guiones. Se agregaron:
- `detectarTipoCedula()`: muestra al usuario el tipo detectado mientras escribe.
- `EJEMPLOS_CEDULA`: ejemplos por tipo que ahora se muestran en el formulario.

### Fuentes consultadas
- Tribunal Electoral de Panamá - La Cédula: https://www.tribunal-electoral.gob.pa/direccion-nacional-de-cedulacion/la-cedula/
- Dirección Nacional de Cedulación: https://www.tribunal-electoral.gob.pa/direccion-nacional-de-cedulacion/
- Significado de letras en cédulas panameñas (referencia): https://panama50.com/significado-letras-cedulas-panamenas/

---

## 4. Bug B-23 - Doble confirmación de cédula y contraseña

Para evitar errores de tipeo (que generaban pacientes con cédula equivocada), el
formulario de registro ahora pide escribir **dos veces** la cédula y la
contraseña; ambas deben coincidir o el registro se bloquea con un mensaje claro.
El campo "Confirmar cédula" tiene el pegado (paste) deshabilitado para forzar la
re-escritura real y detectar errores.

---

## 5. Bug B-24 - Validación de teléfono, nombre y correo

Nuevo módulo `lib/validaciones.ts`:

| Campo | Regla | Rechaza |
|---|---|---|
| Teléfono | Móvil 8 dígitos / fijo 7, opcional +507 | letras, símbolos raros |
| Nombre | Solo letras (con acentos), espacios, apóstrofo, guion, punto; 2-80 | números, @, #, etc. |
| Correo | Formato estándar correo@dominio.ext | espacios, doble @, sin dominio |

Los inputs usan `inputMode`/`type` correctos para mostrar el teclado adecuado en
móvil. El teléfono es opcional, pero si se ingresa se valida.

---

## 6. Pruebas de seguridad - OWASP ZAP

**Aclaración importante:** el sitio `zapitmedical.com` que se mencionó NO es una
herramienta de testing (es un producto de cumplimiento de seguridad radiológica
para hospitales). La herramienta correcta para pruebas de seguridad es
**OWASP ZAP (Zed Attack Proxy)**, que fue la que mencionó la profesora.

### Cómo ejecutar un escaneo baseline (no intrusivo)
Requiere Docker. No modifica datos de producción.

```bash
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t https://helios-web-production.up.railway.app \
  -r zap_report.html
```

### Qué revisa
- Cabeceras de seguridad (CSP, X-Frame-Options, HSTS, etc.)
- Cookies (flags Secure/HttpOnly)
- Exposición de información, formularios sin protección, etc.

### Interpretación
Muchas alertas del baseline son **informativas** (faltan cabeceras
recomendadas). Se documentan por severidad y se priorizan: las cabeceras de
seguridad se pueden agregar en el `Dockerfile`/servidor en una tarea de
hardening. **No** rompe producción porque el baseline solo navega, no ataca.

---

## 7. Pruebas de rendimiento - Lighthouse

### Cómo ejecutar
Desde Chrome: DevTools -> pestaña Lighthouse -> Analyze. O por línea de comandos:

```bash
npx lighthouse https://helios-web-production.up.railway.app \
  --output html --output-path lighthouse_report.html
```

### Métricas que captura
- **LCP** (Largest Contentful Paint) - cuándo carga el contenido principal
- **CLS** (Cumulative Layout Shift) - estabilidad visual
- **TBT** (Total Blocking Time) - bloqueo del hilo principal
- Puntajes de Performance, Accessibility, Best Practices y SEO

El bundle reducido en B-21 (754 -> 496 KB) ayuda directamente al LCP y al TBT.

---

## 8. Subtareas para Jira (HELL-3) - listas para pegar

> Nota: el asistente no tiene conectado el MCP de Atlassian, así que estas
> subtareas se entregan como texto para copiar/pegar en la issue HELL-3.

Orden de ejecución: bugs urgentes primero, luego testing, luego
cancelar/reprogramar.

| ID | Subtarea | SP | Responsable | Estado sugerido |
|---|---|---|---|---|
| ST-10 | Fix calendario zona horaria (vista botones desktop) [B-21] | 3 | Ethan | Done |
| ST-11 | Validador cédula 5 tipos + ejemplos + detección [B-22] | 3 | Ethan/Alejandro | Done |
| ST-12 | Doble confirmación cédula y contraseña [B-23] | 2 | Ethan | Done |
| ST-13 | Validación teléfono/nombre/correo [B-24] | 2 | Ethan | Done |
| ST-14 | Pruebas de seguridad OWASP ZAP + documentar | 3 | Ashley/Marian | To Do |
| ST-15 | Pruebas de rendimiento Lighthouse + documentar | 2 | Ashley | To Do |
| ST-1 | Función SQL cancelar_cita_atomica | 2 | Alejandro | To Do |
| ST-2 | Función SQL reprogramar_cita_atomica | 3 | Alejandro | To Do |
| ST-3 | Tabla citas_historial + triggers | 2 | Alejandro | To Do |
| ST-4 | Hook useCancelarCita | 1 | Ethan | To Do |
| ST-5 | Componente BotonCancelarCita + modal | 1 | Ethan | To Do |
| ST-6 | Hook + página ReprogramarCita | 3 | Ethan | To Do |
| ST-7 | Actualizar MisCitas con botones | 1 | Ethan | To Do |
| ST-8 | Actualizar dashboard médico | 1 | Ethan/Ashley | To Do |
| ST-9 | Tests E2E + smoke post-deploy | - | Ashley/Marian | To Do |

### Descripción sugerida para HELL-3 (pegar en el campo Description)

```
OBJETIVO SPRINT 2
Arreglar bugs urgentes de producción (calendario y validaciones) y luego
habilitar cancelar/reprogramar citas. Reforzar la calidad con pruebas de
seguridad (OWASP ZAP) y rendimiento (Lighthouse).

ALCANCE
1. [B-21] Fix calendario: desfase de hora por zona horaria
2. [B-22] Cédula: aceptar los 5 tipos panameños + ejemplos
3. [B-23] Doble confirmación de cédula y contraseña
4. [B-24] Validación de teléfono, nombre y correo
5. Pruebas OWASP ZAP (seguridad) + Lighthouse (rendimiento)
6. Cancelar y reprogramar cita (autoservicio del paciente)

CRITERIOS DE ACEPTACIÓN
- El calendario muestra y agenda la MISMA hora (sin desfase)
- Se aceptan cédulas PE/N/E/PI además de las naturales
- No se puede registrar con cédula/contraseña que no coincidan
- Teléfono/nombre/correo se validan antes de enviar
- 100% de los tests del Sprint 1 siguen pasando (cero regresiones)
```

---

## 9. Verificación

- `pnpm vitest run` -> 100/100 tests pasan
- `pnpm build` -> limpio; bundle 496 KB (bajó de 754 KB)
- Manual: agendar un slot "12:30" -> en "Mis Citas" se ve 12:30
- Registro: PE-5-687 aceptada; cédula que no coincide -> rechazada; teléfono con
  letras -> rechazado; nombre con números -> rechazado; ejemplos de cédula visibles

---

_Documento generado para el Sprint 2 de HELIOS - UTP Calidad de Software 2026._
"""


CSS = """
@page { margin: 1.6cm 2cm; size: Letter; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Calibri', sans-serif; line-height: 1.5; color: #0F2A36; max-width: 720px; margin: 0 auto; }
h1 { color: #0A4F6B; border-bottom: 4px solid #0A8478; padding-bottom: 10px; margin-top: 28px; font-size: 24pt; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; margin-top: 0; text-align: center; }
h2 { color: #0A8478; margin-top: 24px; font-size: 16pt; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
h3 { color: #066F66; margin-top: 16px; font-size: 12.5pt; }
p { margin: 8px 0; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 3px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; page-break-inside: avoid; }
th { background: #0A8478; color: white; padding: 7px; text-align: left; font-weight: 600; font-size: 9pt; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote { border-left: 4px solid #0A8478; padding: 8px 16px; background: #F4F7F8; margin: 12px 0; font-style: italic; }
code { background: #F4F7F8; padding: 2px 5px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 9pt; color: #B91C1C; }
pre { background: #1E1E1E; color: #D4D4D4; padding: 12px; border-radius: 5px; overflow-x: auto; font-size: 8.5pt; page-break-inside: avoid; }
pre code { background: transparent; color: #D4D4D4; padding: 0; }
strong { color: #0A4F6B; }
hr { border: none; border-top: 1px solid #ddd; margin: 22px 0; }
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


def main() -> None:
    body = markdown.markdown(DOC_MD, extensions=["tables", "fenced_code"])
    html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Documentación Sprint 2 HELIOS</title>
<style>{CSS}</style>
</head><body>{body}</body></html>"""

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_html = Path(tmpdir) / "doc.html"
        tmp_html.write_text(html, encoding="utf-8")
        if not convert_with_word(tmp_html, PDF):
            raise SystemExit("No se pudo convertir (¿Word instalado?).")

    print(f"[ok] PDF generado: {PDF}")
    print(f"[ok] Tamano: {PDF.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
