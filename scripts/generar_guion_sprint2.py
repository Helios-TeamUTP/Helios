"""Genera 2 PDFs de guion para la presentacion de Sprint 2 (5 minutos):
- Guion_Equipo_Sprint2.pdf: que dice cada integrante, dividido por persona.
- Guion_Jose_Sprint2.pdf: la parte de Jose con explicaciones simples + preguntas.

Output:
    dailys/Entrega_Viernes/Guion_Equipo_Sprint2.pdf
    dailys/Entrega_Viernes/Guion_Jose_Sprint2.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "dailys" / "Entrega_Viernes"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CSS = """
@page { margin: 1.5cm 2cm; size: Letter; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; line-height: 1.55; color: #0F2A36; max-width: 720px; margin: 0 auto; }
h1 { color: #0A4F6B; border-bottom: 3px solid #0A8478; padding-bottom: 8px; margin-top: 24px; font-size: 22pt; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; margin-top: 0; }
h2 { color: #0A8478; margin-top: 22px; font-size: 16pt; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
h3 { color: #066F66; margin-top: 16px; font-size: 13pt; }
p { margin: 8px 0; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; page-break-inside: avoid; }
th { background: #0A8478; color: white; padding: 8px; text-align: left; font-weight: 600; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote { border-left: 4px solid #0A8478; padding: 10px 16px; background: #F4F7F8; margin: 12px 0; color: #0F2A36; font-style: italic; }
code { background: #F4F7F8; padding: 2px 5px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 9pt; color: #B91C1C; }
strong { color: #0A4F6B; }
hr { border: none; border-top: 1px solid #ddd; margin: 22px 0; }
"""

GUION_EQUIPO = r"""# Guion EQUIPO — Sprint 2 (5 minutos)

> Presentacion de Sprint 2 (Cancelacion y Reprogramacion) para el equipo HELIOS.
> Pareja con `HELIOS_Sprint2.pptx` (8 slides).

## Distribucion (5:00)

| Tiempo | Slide | Quien | Tema |
|---|---|---|---|
| 0:00 - 0:50 | 1 + 2 | Marian | Portada + Daily Scrum |
| 0:50 - 1:50 | 3 | Ashley | Demo en vivo (cancelar + reprogramar) |
| 1:50 - 2:40 | 4 | Jose | 6 bugs resueltos |
| 2:40 - 3:40 | 5 | Ethan + Alejandro | Como construimos cancelar/reprogramar |
| 3:40 - 4:15 | 6 | Alejandro | Seguridad (B-26) |
| 4:15 - 4:55 | 7 | Jose | Metricas |
| 4:55 - 5:00 | 8 | Jose | Cierre |

---

## MARIAN — Slides 1 + 2 (50s)

[Slide 1: Portada]
> "Buenos dias. Somos el Grupo HELIOS. Hoy presentamos el Sprint 2 de nuestro
> sistema de citas medicas: cancelacion y reprogramacion de citas, mas seis bugs
> resueltos y un refuerzo de seguridad."

[Slide 2: Daily Scrum]
> "Respondo las 3 preguntas del Daily:
> **Que hicimos?** Implementamos cancelar y reprogramar citas como autoservicio
> del paciente, una tabla de auditoria de cambios, resolvimos 6 bugs y cerramos
> un hueco de seguridad en la base de datos.
> **Que sigue?** Sprint 3 sincronizacion entre sedes, Sprint 4 notificaciones, y
> Sprint 5 pruebas de seguridad y cierre.
> **Bloqueos?** El code review detecto un bug critico en la cancelacion (una
> restriccion UNIQUE) que arreglamos antes de desplegar. Cero regresiones.
> Le paso a Ashley para el demo."

## ASHLEY — Slide 3 (60s)

[Slide 3: Demo en vivo]
> "Hagamos una demo en vivo. Escaneen el QR o entren a la URL.
> *(Inicia sesion y va a 'Mis Citas')*
> En una cita confirmada ahora hay dos botones nuevos: **Cancelar** y **Reprogramar**.
> *(Clic en Cancelar)* Pide confirmacion — es una accion que no se deshace.
> Confirmo, y la cita queda marcada 'Cancelada' y su horario se libera para otros.
> *(Clic en Reprogramar en otra cita)* Se abre el calendario con los horarios del
> mismo medico, elijo otra hora, confirmo, y la cita se mueve sin perder su codigo.
> Le paso a Jose."

## JOSE — Slide 4 (50s)

[Slide 4: Bugs resueltos] — (ver guion personal de Jose para el detalle)
> "En este sprint resolvimos 6 bugs detectados en uso real:
> B-21 el calendario desfasaba la hora por zona horaria; B-22 la cedula rechazaba
> tipos validos como PE; B-23 agregamos doble confirmacion; B-24 validamos
> telefono, nombre y correo; B-25 ya no deja agendar horas que ya pasaron; y B-26
> cerramos un hueco de seguridad. Cada bug tiene su test."

## ETHAN + ALEJANDRO — Slide 5 (60s)

[Slide 5: Como construimos]
**Ethan (frontend, ~30s):**
> "En frontend cree dos hooks, useCancelarCita y useReprogramarCita, un boton de
> cancelar con modal de confirmacion, y un modal de reprogramar que reutiliza el
> calendario timezone-safe. En Mis Citas agregue badges de estado por color y los
> botones solo aparecen en citas confirmadas."

**Alejandro (backend, ~30s):**
> "En la base de datos cree dos funciones SQL atomicas: cancelar_cita_atomica y
> reprogramar_cita_atomica. Son SECURITY DEFINER: validan que la cita sea del
> paciente y usan bloqueos FOR UPDATE para que dos pacientes no tomen el mismo
> horario. Mas una tabla de auditoria con trigger. El code review encontro un bug
> critico de una restriccion UNIQUE que arregle con un indice parcial."

## ALEJANDRO — Slide 6 (35s)

[Slide 6: Seguridad B-26]
> "Sobre seguridad: descubrimos que una policy permisiva vieja seguia activa en 7
> tablas, lo que permitia a cualquier usuario tocar datos ajenos por la API.
> Lo cerramos con una migracion transaccional que primero re-crea las reglas
> estrictas y despues elimina la permisiva, sin romper nada. Importante: no se
> borro ningun usuario, contraseña ni dato — solo cambiaron las reglas de permiso."

## JOSE — Slides 7 + 8 (45s)

[Slide 7: Metricas]
> "Las metricas del sprint: 117 tests automatizados pasando, 52 mas que el Sprint
> 1. Cero bugs pendientes: 6 detectados, 6 resueltos. El bundle bajo a 503 KB. Y 3
> funciones SQL atomicas que garantizan consistencia."

[Slide 8: Cierre]
> "En resumen: cancelar y reprogramar en produccion, 6 bugs resueltos, auditoria
> de cambios y seguridad reforzada. Sprint 2 entregado. Gracias. Preguntas?"

---

## PREGUNTAS COMUNES (todos pueden responder)

**Por que no se puede cancelar una cita ya pasada?** Solo se cancelan citas
confirmadas; una cita pasada el medico la marca como completada o no asistio.

**Que pasa si dos pacientes reprograman al mismo horario?** El bloqueo FOR UPDATE
en la base de datos serializa: solo uno lo obtiene, el otro recibe "ya reservado".

**Borraron datos con el cambio de seguridad?** No. Solo cambiaron reglas de
permiso (policies). Los usuarios, contraseñas y citas siguen intactos.

**Esta todo probado?** 117 tests automatizados + code review que detecto y
corrigio un bug critico antes del deploy.
"""

GUION_JOSE = r"""# Guion Personal de Jose — Sprint 2 (5 min)

> Tu parte de la presentacion de Sprint 2, con explicaciones en lenguaje simple
> y preguntas anticipadas. Pareja con `HELIOS_Sprint2.pptx`.

## Tu tiempo: ~1 min 35s (slides 4, 7 y 8)

---

## SLIDE 4 — "6 bugs resueltos" (50s)

> "En este sprint resolvimos seis bugs, todos detectados probando el sistema en
> uso real:
> - **B-21:** el calendario mostraba una hora pero agendaba otra, por un problema
>   de zona horaria. Lo arreglamos y de paso quitamos una libreria pesada.
> - **B-22:** el sistema rechazaba cedulas validas cortas. Ahora acepta los 5
>   tipos de cedula panameña y muestra ejemplos.
> - **B-23:** agregamos confirmar la cedula y la contraseña dos veces, para evitar
>   errores de tipeo.
> - **B-24:** ahora validamos que el telefono, el nombre y el correo tengan
>   formato correcto.
> - **B-25:** ya no deja agendar una hora de hoy que ya paso.
> - **B-26:** cerramos un hueco de seguridad en la base de datos.
> Cada bug quedo con su prueba automatica para que no vuelva."

### Si preguntan "como detectaron los bugs?"
> "Probando el sistema en uso real, como lo haria un paciente. Esa es nuestra
> filosofia de calidad: el feedback real encuentra cosas que los tests solos no."

---

## SLIDE 7 — "Metricas" (40s)

> "Las metricas del Sprint 2:
> - **117 tests automatizados** pasando, 52 mas que el sprint pasado.
> - **Cero bugs pendientes:** 6 detectados, 6 resueltos.
> - **Bundle de 503 KB** (bajo desde 754 al quitar una libreria).
> - **3 funciones SQL atomicas** que garantizan que las operaciones de citas sean
>   consistentes (no se corrompen aunque varios usen el sistema a la vez)."

### Explicacion por si preguntan:
- **Test automatizado:** un mini-programa que verifica solo que algo funcione.
- **Funcion SQL atomica:** una operacion en la base de datos que se hace
  "todo o nada" — si algo falla, no queda a medias. Asi dos pacientes no pueden
  tomar el mismo horario.
- **Bundle:** el tamaño del codigo que descarga el navegador. Mas pequeño = mas
  rapido.

---

## SLIDE 8 — Cierre (25s)

> "En resumen: cancelar y reprogramar citas funcionando en produccion, seis bugs
> resueltos, auditoria de cambios y seguridad reforzada. Sprint 2 entregado.
> El siguiente es Sincronizacion entre sedes. Gracias. Preguntas?"

---

## PREGUNTAS QUE TE PUEDEN HACER (con respuestas)

**Que es 'reprogramar' vs 'cancelar'?**
> "Cancelar elimina la cita y libera el horario. Reprogramar mueve la misma cita a
> otra hora del mismo medico, sin perder el codigo de confirmacion."

**Que es el hueco de seguridad que cerraron (B-26)?**
> "Habia una regla vieja en la base de datos que permitia a cualquier usuario ver
> o modificar datos de otros. La cerramos. Ahora cada quien solo accede a lo suyo.
> No se borro ningun dato ni cuenta."

**Como aseguran que no se rompa al cancelar/reprogramar?**
> "Las operaciones son atomicas y validadas en la base de datos: verifican que la
> cita sea tuya y usan bloqueos para evitar choques entre usuarios. Ademas el code
> review encontro un bug critico que arreglamos antes de desplegar."

**Cuantos tests tienen?**
> "117 automatizados, todos pasando. Cada bug que arreglamos genero su propia
> prueba para que no regrese."

**Que sigue despues de este sprint?**
> "Sprint 3 sincronizacion entre sedes, Sprint 4 notificaciones por email, y
> Sprint 5 pruebas de seguridad con OWASP ZAP y rendimiento con Lighthouse."

---

## 3 numeros clave que NO debes olvidar

| Numero | Que es |
|---|---|
| **117** | Tests automatizados pasando |
| **6** | Bugs resueltos (B-21 a B-26) |
| **2** | Funciones nuevas: cancelar + reprogramar |

**Suerte. Vas preparado.**
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


def render(md: str, pdf: Path):
    body = markdown.markdown(md, extensions=["tables", "fenced_code"])
    html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{body}</body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        h = Path(tmp) / "g.html"
        h.write_text(html, encoding="utf-8")
        if not to_pdf_word(h, pdf):
            raise SystemExit("No se pudo convertir (Word).")
    print(f"[ok] {pdf} ({pdf.stat().st_size/1024:.1f} KB)")


def main():
    render(GUION_EQUIPO, OUT_DIR / "Guion_Equipo_Sprint2.pdf")
    render(GUION_JOSE, OUT_DIR / "Guion_Jose_Sprint2.pdf")


if __name__ == "__main__":
    main()
