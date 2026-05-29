"""Genera PDF guion del equipo v3 (10 min, 12 slides).

Distribuye el guion de cada miembro EXCEPTO Jose (que tiene el suyo aparte).

Output:
    dailys/Entrega_Viernes/Guion_Equipo_v3.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "dailys" / "Entrega_Viernes" / "Guion_Equipo_v3.pdf"
PDF.parent.mkdir(parents=True, exist_ok=True)


GUION_MD = """# Guion EQUIPO v3 (10 minutos, 12 slides)

> Distribucion de TODOS los presentadores excepto Jose (que tiene su PDF propio).
> Presentacion del viernes 29/05/2026.

---

## DISTRIBUCION COMPLETA (10 minutos)

| Tiempo | Slide | Quien | Tema | Segundos |
|---|---|---|---|---|
| 0:00 - 0:40 | 1+2 | Marian | Portada + Daily Scrum | 40s |
| 0:40 - 1:35 | 3 | Ashley | QR + demo en vivo | 55s |
| 1:35 - 2:25 | 4 | Jose | Que hizo cada uno | 50s |
| 2:25 - 3:00 | 5 | Ethan | Frontend especifico | 35s |
| 3:00 - 3:35 | 6 | Alejandro | Backend / SQL | 35s |
| 3:35 - 4:25 | 7 | Jose | Diagrama flujo usuario | 50s |
| 4:25 - 5:40 | 8 | Jose | AGENTES IA (nuevo) | 75s |
| 5:40 - 6:30 | 9 | Jose | Metricas ISTQB | 50s |
| **6:30 - 8:10** | **10** | **Marian** | **BUGS DETECTADOS (nuevo)** | **100s** |
| 8:10 - 9:30 | 11 | Ashley + Jose | SonarCloud LIVE | 80s |
| 9:30 - 9:50 | 12 | Marian | Kanban + Sprint 2 | 20s |
| 9:50 - 10:00 | 12 | Jose | Cierre | 10s |

---

# MARIAN (Scrum Master / DevOps) - 160 segundos totales

## SLIDE 1+2 - Portada + Daily Scrum (40 segundos)

[Slide 1: Portada]

> "Buenos dias profesora. Somos el Grupo HELIOS: Jose como Product Owner, Ethan en Frontend, Alejandro Tech Lead, Ashley en QA, y yo Marian como Scrum Master y DevOps. Presentamos el Sprint 1 de nuestro sistema de citas medicas."

[Cambia a Slide 2: 3 preguntas Daily Scrum]

> "Empiezo respondiendo las 3 preguntas obligatorias del Daily Scrum:
>
> **Que hicimos este sprint?** Completamos 5 historias de usuario, desplegamos el dashboard medico, implementamos seguridad RLS multicapa, mantenemos 65 tests automatizados, cazamos 20 bugs, y configuramos 5 agentes IA especializados.
>
> **Que haremos en Sprint 2?** Cancelar y reprogramar citas como autoservicio del paciente. Tabla de historial para auditoria. Tests E2E con Playwright. Integrar SonarCloud al CI. Subir Locust a 300 usuarios.
>
> **Que bloqueos tuvimos?** El bug B-20 requirio 4 iteraciones. Tambien tuvimos spinner lento tras F5. Todos resueltos en sesion con el proceso Plan-Code-Review-Test-Deploy. Cero pendientes al cierre.
>
> Le paso a Ashley para el demo en vivo."

---

## SLIDE 10 - BUGS DETECTADOS (100 segundos) - **EL NUEVO MAS IMPORTANTE**

Aqui tienes mas tiempo. Tomalo con calma. Vas a explicar:

1. La distribucion por severidad
2. Quien los detecto
3. Caso destacado B-20 con 4 iteraciones

> "Durante el Sprint 1 detectamos y resolvimos **20 bugs en uso real**. Cada uno con ID, causa raiz, fix aplicado y test de regresion para que nunca vuelva. Todos trazables en GitHub.
>
> **Distribucion por severidad:**
>
> - 7 bugs criticos: incluyen el seed destructivo, el loading infinito, la RLS permisiva por defecto y el flow de registro
> - 8 bugs de severidad alta: el dashboard medico faltante, el spinner por falta de indice, los hooks sin try/catch
> - 4 bugs de severidad media: como el regex de cedula muy estricto, el toolbar que no respondia
> - 1 bug de severidad baja: el locale es_PA de Faker que no existe
>
> **Quien los detecto?**
>
> 15 bugs (el 75%) los detecto Jose como PO probando produccion en vivo. 3 bugs los detecto code review automatico antes de mergear. Solo 2 los detectaron los tests automatizados. Esto demuestra el **valor del feedback de usuario real** vs tests sinteticos.
>
> **Caso destacado: el bug B-20.**
>
> Este bug nos costo **4 iteraciones** para encontrar la causa raiz real:
>
> - **B-20:** Separamos el registro del login pensando que asi se arreglaba
> - **B-20.1:** Agregamos signOut tras signUp para evitar auto-login
> - **B-20.2:** Implementamos polling JWT y errores visibles para diagnosticar
> - **B-20.3:** Fix DEFINITIVO. Movimos el INSERT del paciente al listener de useAuth.onAuthStateChange. Asi corre secuencial antes de loadPerfil, sin race con setSession de React.
>
> La pista que nos llevo al fix real fue del PO Jose: **'si cierro sesion y vuelvo a entrar, funciona'**. Sin esa pista en uso real, los tests automatizados no lo habrian encontrado.
>
> Esto valida nuestro proceso: detectar en uso real, arreglar en sesion, agregar test de regresion. Tasa final de 8.70 bugs por mil lineas de codigo, en rango profesional."

### Si te preguntan: "Por que tantos bugs?"

> "Es honestidad profesional. Cada bug fue detectado durante el sprint, no escondido. Si dijeramos cero bugs seria mentira. La industria considera 5-10 bugs/KLOC profesional normal."

### Si te preguntan: "Que es el race React de B-20.3?"

> "Es un problema sutil donde el listener de Supabase actualizaba el estado de React de manera asincrona, pero nuestro codigo intentaba usar ese estado antes de que React lo procesara. Movimos la logica dentro del listener mismo para que todo corra secuencial."

---

## SLIDE 12 - Kanban + Sprint 2 (20 segundos)

> "Para cerrar muestro el estado del tablero Kanban en Jira.
>
> En **Done** tenemos 20 bugs cerrados y las 5 historias del Sprint 1.
>
> En **In Progress** estan cancelar y reprogramar citas, que pasan al Sprint 2.
>
> En **To Do** tenemos el epic HELL-3 del Sprint 2 con 9 subtareas definidas: 3 backend SQL, 6 frontend.
>
> Le paso a Jose para el cierre."

---

# ASHLEY (QA Engineer) - 135 segundos totales

## SLIDE 3 - QR + Demo en vivo (55 segundos)

> "Hagamos una demo en vivo. **Profesora y companeros, por favor escaneen este codigo QR con su celular.** Mientras escanean, yo agendo una cita desde mi laptop.
>
> *(Abre el navegador en /login con sesion ya cargada)*
>
> Estoy adentro como paciente. Voy al wizard de agendamiento.
>
> *(Click Agendar -> Cardiologia + Sede Central)*
>
> **Paso 1:** elijo especialidad y sede. **Paso 2:** el sistema me filtra los medicos disponibles. **Paso 3:** el calendario me muestra solo los horarios reales del medico. **Paso 4:** confirmo mis datos.
>
> Listo. Aqui aparece mi codigo unico de cita. Quedo registrada en mi historial.
>
> **Quien logro agendar?** Levanten la mano.
>
> Le paso a Jose para que les muestre quien hizo que."

---

## SLIDE 11 - SonarCloud LIVE con Jose (80 segundos)

Comparten este slide. Ashley clickea, Jose narra (o al reves segun decidan).

> "Como apoyo de Jose, voy abriendo el dashboard de SonarCloud en pantalla mientras explica los hallazgos.
>
> *(Abrir https://sonarcloud.io/project/overview?id=MarianC-programing_Helios)*
>
> En el dashboard pueden ver:
>
> - El **Quality Gate** que indica si el codigo pasa los thresholds
> - Los **bugs** detectados automaticamente por SonarCloud
> - Los **code smells** y **vulnerabilidades**
> - El **coverage** que coincide con lo que Vitest reporta
>
> Cualquiera puede acceder al dashboard desde el repo en GitHub, no es privado."

---

# ETHAN (Dev Frontend) - 35 segundos

## SLIDE 5 - Frontend especifico

> "Como Frontend, construimos la app en React 19 con TypeScript 6 y Vite 8. El bundle final pesa 754 kilobytes que comprimidos son solo 217 KB.
>
> Usamos Tailwind 3 para el design system, React Router 7 para navegacion como SPA, y FullCalendar 6 para la vista de calendario en desktop. Para mobile creamos una vista lista propia (componente CalendarioCitasLista) que se activa cuando detectamos pantalla menor a 768px.
>
> En total entregamos 8 componentes reutilizables. Los mas criticos son el wizard de 4 pasos (SelectorEspecialidad, ListaMedicos, CalendarioCitas, FormularioConfirmacion), el MedicoDashboard para los medicos, y el ProtectedRoute que valida rol antes de renderizar.
>
> Cero `any` en todo el codigo, tipado estricto activado.
>
> Le paso a Alejandro para que hable del backend."

---

# ALEJANDRO (Tech Lead) - 35 segundos

## SLIDE 6 - Backend / SQL

> "Como Tech Lead, mis 3 decisiones tecnicas clave fueron:
>
> **Primero, usar Supabase como BaaS.** Nos da base de datos PostgreSQL, autenticacion y API REST en un solo servicio. Ahorramos semanas de desarrollo backend.
>
> **Segundo, diseno de 6 tablas mas 2 vinculos auth.** Las tablas principales son sedes, especialidades, medicos, horarios, pacientes y citas. Los vinculos auth_paciente_link y auth_medico_link separan la autenticacion del modelo de negocio.
>
> **Tercero, seguridad multicapa.** Implementamos Row Level Security estricta en todas las tablas: un paciente solo ve sus citas, un medico solo ve las suyas. Esto es a nivel base de datos, NO solo en frontend. Aunque un atacante use DevTools para manipular consultas, la base de datos rechaza lo que no le corresponde.
>
> Y creamos una funcion SQL atomica llamada crear_cita_atomica que garantiza que dos pacientes no puedan reservar el mismo horario simultaneamente.
>
> Le paso a Jose para el diagrama de flujo."

---

# CHECKLIST PRESENTACION

## 30 min antes (Marian coordina)
- [ ] Verificar PPTX v3 (10 min) en pantalla compartida
- [ ] Verificar conexion a internet en sala
- [ ] Ashley con sesion HELIOS lista en navegador
- [ ] SonarCloud abierto en otra tab
- [ ] Cronometro discreto
- [ ] Cada miembro con su guion en celular

## Durante la presentacion
- [ ] Hablar lento y claro
- [ ] Cada uno mira la slide cuando le toca
- [ ] Si alguien se pasa de tiempo, terminar idea y pasar
- [ ] Aclarar dudas tipo "que es X" sin culpa

## Reglas
1. Pausado pero sin pausas largas
2. Frases cortas
3. Si necesitan leer, esta bien
4. Mirar a la profesora cuando responden
5. Si NO saben algo: "Excelente observacion, lo investigamos para Sprint 2"

---

# PREGUNTAS COMUNES (todos pueden responder)

**Que herramientas usaron?**
> "GitHub, Jira, Vitest, Locust, Supabase, Railway y SonarCloud. Las 7 documentadas en el repositorio."

**Cuanto tiempo les tomo?**
> "Dos sprints de 2 semanas cada uno. Sprint 0 setup, Sprint 1 implementacion."

**Esta listo para produccion real?**
> "Es MVP academico. Para produccion comercial faltan email confirmation, MFA, monitoreo con Sentry. Esta en el roadmap Sprint 3."

**Cuantos commits hizo cada uno?**
> "Marian 26, Jose 22, Ashley 6, Ethan 3, Alejandro 2. Pero el numero no refleja el aporte: Alejandro hizo decisiones arquitectonicas criticas."

---

**Suerte equipo. El viernes salimos brillando.**
"""


CSS = """
@page { margin: 1.5cm 2cm; size: Letter; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; line-height: 1.55; color: #0F2A36;
       max-width: 720px; margin: 0 auto; }
h1 { color: #0A4F6B; border-bottom: 3px solid #0A8478; padding-bottom: 8px;
     margin-top: 24px; font-size: 22pt; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; margin-top: 0; }
h2 { color: #0A8478; margin-top: 24px; font-size: 16pt;
     border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
h3 { color: #066F66; margin-top: 16px; font-size: 13pt; }
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
<title>Guion Equipo v3 - 10 min</title><style>{CSS}</style>
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
