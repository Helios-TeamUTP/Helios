"""Genera 2 PDFs de guion para la presentacion de Sprint 2 (5 minutos):
- Guion_Equipo_Sprint2.pdf: que dice cada integrante + TERMINOS TECNICOS por
  parte (definidos en simple con ejemplos, por si la profesora pregunta).
- Guion_Jose_Sprint2.pdf: la parte de Jose con explicaciones + preguntas.

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
body { font-family: 'Segoe UI', sans-serif; line-height: 1.5; color: #0F2A36; max-width: 720px; margin: 0 auto; }
h1 { color: #0A4F6B; border-bottom: 3px solid #0A8478; padding-bottom: 8px; margin-top: 24px; font-size: 22pt; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; margin-top: 0; }
h2 { color: #0A8478; margin-top: 22px; font-size: 16pt; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
h3 { color: #066F66; margin-top: 14px; font-size: 12.5pt; }
h4 { color: #B45309; margin-top: 12px; font-size: 11.5pt; }
p { margin: 7px 0; }
ul, ol { margin: 7px 0; padding-left: 22px; }
li { margin: 4px 0; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9.5pt; page-break-inside: avoid; }
th { background: #0A8478; color: white; padding: 7px; text-align: left; font-weight: 600; }
td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #F4F7F8; }
blockquote { border-left: 4px solid #0A8478; padding: 9px 14px; background: #F4F7F8; margin: 10px 0; color: #0F2A36; font-style: italic; }
.terminos { border-left: 4px solid #CA8A04; background: #FFFBEB; padding: 8px 14px; margin: 10px 0; }
code { background: #F4F7F8; padding: 2px 5px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 9pt; color: #B91C1C; }
strong { color: #0A4F6B; }
hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
"""

GUION_EQUIPO = r"""# Guion EQUIPO — Sprint 2 (5 minutos)

> Presentacion de Sprint 2 (Cancelacion y Reprogramacion). Pareja con
> `HELIOS_Sprint2.pptx` (8 slides).
>
> **NUEVO:** en cada parte hay un recuadro amarillo **"Terminos tecnicos por si
> preguntan"** con cada palabra definida en simple y con ejemplo. Leanlo todos.

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
> **Que hicimos?** Cancelar y reprogramar citas como autoservicio, una tabla de
> auditoria de cambios, 6 bugs resueltos y cerramos un hueco de seguridad.
> **Que sigue?** Sprint 3 sincronizacion entre sedes, Sprint 4 notificaciones,
> Sprint 5 pruebas y cierre.
> **Bloqueos?** El code review detecto un bug critico en la cancelacion que
> arreglamos antes de desplegar. Cero regresiones.
> Le paso a Ashley para el demo."

### Terminos tecnicos por si preguntan (Marian)
- **Sprint:** periodo corto de trabajo (1-2 semanas) con un objetivo. *Ej: "Sprint 2 = las 2 semanas para hacer cancelar/reprogramar."*
- **Daily Scrum:** reunion corta donde cada quien dice que hizo, que hara y si esta bloqueado. *Ej: "Un check-in rapido del equipo."*
- **Autoservicio:** que el usuario lo hace solo, sin pedirle a nadie. *Ej: "Cancelar tu cita desde la app, sin llamar a la clinica."*
- **Tabla de auditoria:** un registro que guarda cada cambio (quien, que, cuando). *Ej: "Como el historial de versiones de un documento de Word."*
- **Code review:** revision del codigo por otra persona/herramienta antes de publicarlo. *Ej: "Un segundo par de ojos que caza errores."*
- **Regresion:** cuando un cambio nuevo rompe algo que ya funcionaba. *Ej: "Arreglas A y sin querer dañas B; los tests lo detectan."*

---

## ASHLEY — Slide 3 (60s)

[Slide 3: Demo en vivo]
> "Hagamos una demo en vivo. Escaneen el QR o entren a la URL.
> *(Inicia sesion y va a 'Mis Citas')*
> En una cita confirmada ahora hay dos botones: **Cancelar** y **Reprogramar**.
> *(Clic en Cancelar)* Pide confirmacion — es una accion que no se deshace.
> Confirmo y la cita queda 'Cancelada' y su horario se libera para otros.
> *(Clic en Reprogramar)* Se abre el calendario con los horarios del mismo
> medico, elijo otra hora, confirmo, y la cita se mueve sin perder su codigo.
> Le paso a Jose."

### Terminos tecnicos por si preguntan (Ashley)
- **Estado de la cita:** la situacion de la cita: confirmada, cancelada, completada, no asistio. *Ej: "Como el estado de un pedido: pendiente, enviado, entregado."*
- **Liberar el horario:** marcar ese espacio de tiempo como disponible otra vez. *Ej: "Cancelas y ese turno vuelve a quedar libre para otro paciente."*
- **Slot / horario:** un espacio de tiempo para una cita. *Ej: "Lunes 9:00 a 9:20 es un slot."*
- **Codigo de confirmacion:** el codigo unico que identifica tu cita. *Ej: "ABC12345 — no cambia aunque reprogrames."*

---

## JOSE — Slide 4 (50s)

[Slide 4: Bugs resueltos]
> "En este sprint resolvimos 6 bugs detectados en uso real:
> B-21 el calendario desfasaba la hora por zona horaria; B-22 la cedula rechazaba
> tipos validos como PE; B-23 agregamos doble confirmacion; B-24 validamos
> telefono, nombre y correo; B-25 ya no deja agendar horas que ya pasaron; y B-26
> cerramos un hueco de seguridad. Cada bug tiene su prueba automatica."

### Terminos tecnicos por si preguntan (Jose)
- **Bug:** un error en el programa. *Ej: "El calendario mostraba 12:30 pero agendaba 7:00."*
- **Zona horaria (timezone):** la hora local de cada region; Panama es UTC-5. *Ej: "El navegador convertia la hora a otra zona y la desfasaba."*
- **Tipos de cedula (Panama):** hay varios formatos: natural (8-123-4567), PE, N, E, PI. *Ej: "PE-5-687 = panameño nacido en el extranjero."*
- **Doble confirmacion:** escribir un dato dos veces para evitar errores de tipeo. *Ej: "Como cuando te piden repetir la contraseña."*
- **Validacion:** revisar que un dato tenga el formato correcto antes de guardarlo. *Ej: "Que el telefono solo tenga numeros, no letras."*
- **Prueba automatica (test):** un mini-programa que verifica solo que algo funcione. *Ej: "Comprueba que cancelar una cita realmente la cancele."*
- **Hueco de seguridad:** una falla que permite hacer algo que no se deberia. *Ej: "Que un usuario vea datos de otro paciente."*

---

## ETHAN + ALEJANDRO — Slide 5 (60s)

[Slide 5: Como construimos]
**Ethan (frontend, ~30s):**
> "En frontend cree dos hooks (logica reutilizable) para cancelar y reprogramar,
> un boton de cancelar con su ventana de confirmacion, y una ventana de
> reprogramar que reutiliza el calendario. En Mis Citas agregue etiquetas de
> estado por color y los botones solo aparecen en citas confirmadas."

### Terminos tecnicos por si preguntan (Ethan)
- **Frontend:** lo que ve y usa el usuario (la pantalla). *Ej: "Botones, formularios, el calendario."*
- **Hook:** funcion reutilizable de React con logica; empieza con 'use'. *Ej: "useCancelarCita = el modulo que sabe como cancelar; el boton solo lo usa."*
- **Modal (ventana emergente):** una ventanita que aparece encima de la pantalla. *Ej: "El '¿Seguro que quieres cancelar?'."*
- **Badge (etiqueta de estado):** un cuadrito de color que indica el estado. *Ej: "El 'Cancelada' en gris."*
- **Timezone-safe:** que no se desfasa por zona horaria. *Ej: "La hora se muestra tal cual, sin convertirla."*
- **Componente:** una pieza reutilizable de la pantalla. *Ej: "El boton de cancelar es un componente."*

**Alejandro (backend, ~30s):**
> "En la base de datos cree dos funciones SQL atomicas: cancelar y reprogramar.
> Son de seguridad: validan que la cita sea del paciente y usan bloqueos para que
> dos pacientes no tomen el mismo horario. Mas una tabla de auditoria con trigger.
> El code review encontro un bug critico de una restriccion UNIQUE que arregle
> con un indice parcial."

### Terminos tecnicos por si preguntan (Alejandro — backend)
- **Backend:** lo que esta por detras: base de datos y logica del servidor. *Ej: "Donde se guardan y procesan las citas."*
- **SQL:** el idioma para hablar con la base de datos. *Ej: "Ordenes como SELECT (leer), INSERT (crear), UPDATE (cambiar)."*
- **Funcion SQL atomica:** una operacion en la BD que se hace TODO o NADA. *Ej: "Liberar un horario y mover la cita: o pasan las dos cosas, o ninguna; nunca queda a medias."*
- **Bloqueo (FOR UPDATE):** poner un candado temporal a un registro para que dos personas no lo cambien a la vez. *Ej: "Dos pacientes quieren el mismo turno; el candado deja pasar solo a uno."*
- **Condicion de carrera (race condition):** cuando dos acciones simultaneas chocan. *Ej: "Dos clics al mismo milisegundo por el mismo horario."*
- **Trigger:** una accion automatica de la BD cuando pasa algo. *Ej: "Cada vez que cambia una cita, se anota sola en el historial."*
- **Restriccion UNIQUE:** una regla que impide duplicados. *Ej: "Un horario no puede tener dos citas activas."*
- **Indice parcial:** una regla que solo aplica a ciertas filas. *Ej: "El UNIQUE solo cuenta las citas NO canceladas, asi un turno cancelado se puede reusar."*

---

## ALEJANDRO — Slide 6 (35s)

[Slide 6: Seguridad B-26]
> "Sobre seguridad: descubrimos que una regla de permiso vieja y permisiva seguia
> activa en 7 tablas, lo que dejaba a cualquier usuario tocar datos ajenos por la
> API. La cerramos con una migracion que primero re-crea las reglas estrictas y
> despues elimina la permisiva, todo de golpe, sin romper nada. Importante: no se
> borro ningun usuario, contraseña ni dato — solo cambiaron las reglas de permiso."

### Terminos tecnicos por si preguntan (Alejandro — seguridad)
- **RLS (Row Level Security):** reglas en la base de datos que controlan que FILAS puede ver/tocar cada usuario. *Ej: "Cada paciente solo ve SUS citas, no las de otros."*
- **Policy (regla de permiso):** una regla concreta de RLS. *Ej: "'paciente_ve_sus_citas'."*
- **Permisiva vs estricta:** permisiva deja pasar todo; estricta solo lo permitido. *Ej: "La permisiva 'sprint1_all' era el hueco — dejaba pasar todo."*
- **API:** la puerta por la que la app le pide datos al servidor. *Ej: "El navegador pide tus citas por la API."*
- **Migracion:** un script que cambia la estructura o las reglas de la BD. *Ej: "El SQL que corrimos en Supabase."*
- **Transaccional (BEGIN/COMMIT):** un bloque que se aplica completo o no se aplica. *Ej: "Si algo falla a la mitad, se deshace todo solo; nunca queda a medias."*
- **Rollback:** deshacer un cambio para volver al estado anterior. *Ej: "Si la migracion rompiera algo, el rollback la revierte."*
- **auth.users:** la tabla de Supabase con los usuarios y contraseñas. *Ej: "No la tocamos; por eso nadie perdio su cuenta."*

---

## JOSE — Slides 7 + 8 (45s)

[Slide 7: Metricas]
> "Las metricas del sprint: 117 tests automatizados pasando, 52 mas que el Sprint
> 1. Cero bugs pendientes: 6 detectados, 6 resueltos. El bundle bajo a 503 KB. Y 3
> funciones SQL atomicas que garantizan consistencia."

[Slide 8: Cierre]
> "En resumen: cancelar y reprogramar en produccion, 6 bugs resueltos, auditoria
> de cambios y seguridad reforzada. Sprint 2 entregado. Gracias. Preguntas?"

### Terminos tecnicos por si preguntan (Jose — metricas)
- **Test automatizado:** mini-programa que verifica solo que algo funcione, sin que nadie lo pruebe a mano. *Ej: "117 corren en segundos en cada cambio."*
- **Bundle:** el paquete de codigo que descarga el navegador; mas pequeño = mas rapido. *Ej: "Bajo de 754 KB a 503 KB al quitar una libreria."*
- **Libreria:** codigo hecho por terceros que reutilizas. *Ej: "FullCalendar era una libreria de calendario; la quitamos."*
- **Funcion SQL atomica:** operacion en la BD que es todo-o-nada (no se corrompe aunque varios usen el sistema a la vez). *Ej: "crear, cancelar y reprogramar cita."*
- **ISTQB:** estandar internacional de pruebas de software. *Ej: "Como una norma de calidad para testing."*

---

## GLOSARIO RAPIDO (todos) — los 10 mas probables

| Termino | En una frase |
|---|---|
| Hook | Logica reutilizable de React (empieza con 'use') |
| RLS | Reglas de la BD: cada quien ve solo lo suyo |
| Funcion SQL atomica | Operacion BD todo-o-nada |
| Trigger | Accion automatica de la BD ante un cambio |
| Condicion de carrera | Dos acciones simultaneas que chocan |
| Bloqueo (FOR UPDATE) | Candado temporal para que no choquen |
| Migracion | Script que cambia reglas/estructura de la BD |
| Rollback | Deshacer y volver atras |
| Bundle | Codigo que descarga el navegador |
| Regresion | Un cambio rompe algo que ya servia |

---

## REGLAS PARA TODOS
1. Cada quien con su slide visible cuando habla.
2. Lento y claro; frases cortas.
3. Si no saben una respuesta: "Excelente pregunta, lo revisamos para el siguiente sprint."
4. Si les preguntan un termino, esta en el recuadro amarillo de su parte.
"""

GUION_JOSE = r"""# Guion Personal de Jose — Sprint 2 (5 min)

> Tu parte de la presentacion, con explicaciones simples y preguntas anticipadas.
> Pareja con `HELIOS_Sprint2.pptx`. Tu tiempo: ~1 min 35s (slides 4, 7 y 8).

---

## SLIDE 4 — "6 bugs resueltos" (50s)

> "En este sprint resolvimos seis bugs, todos detectados probando el sistema en
> uso real:
> - **B-21:** el calendario mostraba una hora pero agendaba otra (zona horaria).
> - **B-22:** rechazaba cedulas validas cortas; ahora acepta los 5 tipos panameños.
> - **B-23:** agregamos confirmar cedula y contraseña dos veces.
> - **B-24:** validamos telefono, nombre y correo.
> - **B-25:** ya no deja agendar una hora de hoy que ya paso.
> - **B-26:** cerramos un hueco de seguridad en la base de datos.
> Cada bug quedo con su prueba automatica para que no vuelva."

### Terminos por si preguntan
- **Bug:** error del programa. *Ej: mostraba 12:30 pero agendaba 7:00.*
- **Zona horaria:** la hora local; Panama es UTC-5. *El navegador la desfasaba.*
- **Tipos de cedula:** natural (8-123-4567), PE, N, E, PI. *PE-5-687 = nacido en el extranjero.*
- **Validacion:** revisar el formato antes de guardar. *Telefono solo numeros.*
- **Prueba automatica (test):** mini-programa que verifica que algo funcione.
- **Hueco de seguridad:** falla que deja hacer algo indebido. *Ver datos de otro.*

---

## SLIDE 7 — "Metricas" (40s)

> "Las metricas del Sprint 2:
> - **117 tests automatizados** pasando, 52 mas que el sprint pasado.
> - **Cero bugs pendientes:** 6 detectados, 6 resueltos.
> - **Bundle de 503 KB** (bajo desde 754 al quitar una libreria).
> - **3 funciones SQL atomicas** que garantizan operaciones consistentes."

### Terminos por si preguntan
- **Test automatizado:** mini-programa que verifica solo que algo funcione.
- **Bundle:** el codigo que descarga el navegador; mas chico = mas rapido.
- **Libreria:** codigo de terceros que reusas. *Quitamos FullCalendar.*
- **Funcion SQL atomica:** operacion en la BD todo-o-nada. *Dos pacientes no pueden tomar el mismo horario.*
- **ISTQB:** estandar internacional de pruebas de software.

---

## SLIDE 8 — Cierre (25s)

> "En resumen: cancelar y reprogramar citas en produccion, seis bugs resueltos,
> auditoria de cambios y seguridad reforzada. Sprint 2 entregado. El siguiente es
> Sincronizacion entre sedes. Gracias. Preguntas?"

---

## PREGUNTAS QUE TE PUEDEN HACER (con respuestas)

**Que es 'reprogramar' vs 'cancelar'?**
> "Cancelar elimina la cita y libera el horario. Reprogramar mueve la misma cita a
> otra hora del mismo medico, sin perder el codigo."

**Que es el hueco de seguridad que cerraron (B-26)?**
> "Una regla vieja en la BD permitia a cualquier usuario ver o modificar datos de
> otros. La cerramos. No se borro ningun dato ni cuenta."

**Como aseguran que no se rompa al cancelar/reprogramar?**
> "Las operaciones son atomicas (todo-o-nada) y validan que la cita sea tuya; usan
> bloqueos para evitar choques. Ademas el code review encontro un bug critico que
> arreglamos antes de desplegar."

**Cuantos tests tienen?**
> "117 automatizados, todos pasando. Cada bug genero su propia prueba."

**Que sigue?**
> "Sprint 3 sincronizacion entre sedes, Sprint 4 notificaciones, Sprint 5 pruebas
> de seguridad (OWASP ZAP) y rendimiento (Lighthouse)."

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
