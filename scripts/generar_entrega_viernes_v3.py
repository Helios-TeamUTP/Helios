"""Genera la PPTX v3 - 10 minutos con 12 slides + cambios pedidos por Jose:

Cambios respecto a v2:
- DURACION: 3 min -> 10 min (mas espacio para detalle tecnico)
- 12 slides en lugar de 8
- Slide NUEVO 'Agentes IA HELIOS' (Jose presenta)
- Slide NUEVO 'Bugs detectados' (Marian presenta - antes era seccion implicita)
- Slides individuales para Ethan (Frontend) y Alejandro (Backend/SQL)

DISTRIBUCION 10 minutos:
- 0:00-0:40  Marian: Portada + Daily Scrum (40s)
- 0:40-1:35  Ashley: QR + demo en vivo (55s)
- 1:35-2:25  Jose: Que hizo cada uno (50s)
- 2:25-3:00  Ethan: Frontend especifico (35s)
- 3:00-3:35  Alejandro: Backend / SQL (35s)
- 3:35-4:25  Jose: Diagrama flujo usuario (50s)
- 4:25-5:40  Jose: AGENTES IA HELIOS (75s) NUEVO
- 5:40-6:30  Jose: Metricas ISTQB (50s)
- 6:30-8:10  Marian: BUGS DETECTADOS (100s) NUEVO
- 8:10-9:30  Ashley+Jose: SonarCloud LIVE (80s)
- 9:30-9:50  Marian: Kanban + Sprint 2 (20s)
- 9:50-10:00 Jose: Cierre (10s)

Output:
    dailys/Entrega_Viernes/HELIOS_Sprint1_v3_10min.pptx
    dailys/Entrega_Viernes/HELIOS_Sprint1_v3_10min_diapositivas.pdf
"""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "dailys" / "Entrega_Viernes"
OUT_PPTX = OUT_DIR / "HELIOS_Sprint1_v3_10min.pptx"
OUT_PDF = OUT_DIR / "HELIOS_Sprint1_v3_10min_diapositivas.pdf"
QR_IMG = ROOT / "dailys" / "qr_helios_demo.png"
FLUJO_IMG = OUT_DIR / "diagrama_flujo_usuario.png"
ARQUI_IMG = OUT_DIR / "diagrama_arquitectura.png"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Colores HELIOS
TEAL = RGBColor(0x0A, 0x84, 0x78)
TEAL_DARK = RGBColor(0x0A, 0x4F, 0x6B)
TEAL_LIGHT = RGBColor(0x1F, 0xA8, 0x9B)
ACCENT = RGBColor(0x3D, 0xDC, 0x97)
INK = RGBColor(0x0F, 0x2A, 0x36)
INK_MUTED = RGBColor(0x4A, 0x6B, 0x7A)
MIST = RGBColor(0xF4, 0xF7, 0xF8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
AMBER = RGBColor(0xCA, 0x8A, 0x04)
RED = RGBColor(0xDC, 0x26, 0x26)
GREEN_OK = RGBColor(0x10, 0xB9, 0x81)
PURPLE = RGBColor(0x8B, 0x5C, 0xF6)

TOTAL_SLIDES = 12


def add_text_box(slide, left, top, width, height, text, *,
                 font_size=14, bold=False, color=INK, align=PP_ALIGN.LEFT,
                 anchor=MSO_ANCHOR.TOP, font_name="Calibri"):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font_name
    return tb


def add_rect(slide, left, top, width, height, fill_color, *, line_color=None):
    rect = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    rect.fill.solid()
    rect.fill.fore_color.rgb = fill_color
    if line_color:
        rect.line.color.rgb = line_color
    else:
        rect.line.fill.background()
    rect.shadow.inherit = False
    return rect


def add_chip(slide, left, top, text, color=TEAL):
    chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   left, top, Inches(1.6), Inches(0.35))
    chip.fill.solid()
    chip.fill.fore_color.rgb = color
    chip.line.fill.background()
    chip.shadow.inherit = False
    tf = chip.text_frame
    tf.margin_left = Pt(8)
    tf.margin_right = Pt(8)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = WHITE
    run.font.name = "Calibri"
    return chip


def add_footer(slide, text):
    add_text_box(slide, Inches(0.4), Inches(7.0), Inches(9), Inches(0.3),
                 text, font_size=9, color=INK_MUTED, align=PP_ALIGN.LEFT)


def add_page_num(slide, n):
    add_text_box(slide, Inches(12.0), Inches(7.0), Inches(1), Inches(0.3),
                 f"{n} / {TOTAL_SLIDES}", font_size=9, color=INK_MUTED,
                 align=PP_ALIGN.RIGHT)


def add_bullet_list(slide, left, top, width, height, items,
                    font_size=11, color=INK, bold_keys=False):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run = p.add_run()
        run.text = "- " + item if not item.startswith("-") else item
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
        run.font.name = "Calibri"
        run.font.bold = bold_keys
        p.space_after = Pt(4)
    return tb


# ===========================================================================
# SLIDE 1 - PORTADA
# ===========================================================================
def slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, MIST)
    add_rect(slide, 0, 0, Inches(0.4), prs.slide_height, TEAL)

    add_text_box(slide, Inches(1.0), Inches(1.0), Inches(11), Inches(0.6),
                 "HELIOS", font_size=44, bold=True, color=TEAL_DARK)
    add_text_box(slide, Inches(1.0), Inches(1.7), Inches(11), Inches(0.4),
                 "Sistema unificado de citas medicas",
                 font_size=18, color=INK_MUTED)

    add_text_box(slide, Inches(1.0), Inches(2.7), Inches(11), Inches(1.0),
                 "Sprint 1 - Confirmacion de cita",
                 font_size=36, bold=True, color=INK)
    add_text_box(slide, Inches(1.0), Inches(3.6), Inches(11), Inches(0.5),
                 "MVP funcional en produccion - 20 bugs resueltos - 5 agentes IA",
                 font_size=18, color=TEAL)

    add_text_box(slide, Inches(1.0), Inches(4.8), Inches(11), Inches(0.4),
                 "Grupo HELIOS", font_size=14, bold=True, color=INK)
    add_text_box(slide, Inches(1.0), Inches(5.2), Inches(11), Inches(0.4),
                 "Jose Brown (PO) - Ethan Gonzalez (Frontend) - Alejandro Saenz (Tech Lead)",
                 font_size=12, color=INK_MUTED)
    add_text_box(slide, Inches(1.0), Inches(5.55), Inches(11), Inches(0.4),
                 "Ashley Martinez (QA) - Marian Barba (Scrum Master / DevOps)",
                 font_size=12, color=INK_MUTED)

    add_text_box(slide, Inches(1.0), Inches(6.5), Inches(11), Inches(0.4),
                 "UTP - Calidad de Software - 2026 - Presentacion 10 minutos",
                 font_size=11, color=INK_MUTED)
    add_page_num(slide, 1)


# ===========================================================================
# SLIDE 2 - DAILY SCRUM
# ===========================================================================
def slide_2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "DAILY SCRUM")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Las 3 preguntas obligatorias del Daily",
                 font_size=28, bold=True, color=INK)

    preguntas = [
        ("Que hicimos?", [
            "5 historias completadas (US-01 a US-05)",
            "Dashboard medico desplegado",
            "Seguridad RLS multicapa",
            "65 tests automatizados PASS",
            "20 bugs cazados y resueltos",
            "5 agentes IA configurados",
        ], TEAL),
        ("Que haremos en Sprint 2?", [
            "Cancelar cita (autoservicio)",
            "Reprogramar cita a otro horario",
            "Tabla citas_historial (auditoria)",
            "Tests E2E con Playwright",
            "SonarCloud en CI",
            "Locust a 300 usuarios",
        ], TEAL_LIGHT),
        ("Que bloqueos tuvimos?", [
            "Bug B-20 race React (4 iteraciones)",
            "Detectado en uso real por PO",
            "Spinner >10s tras F5 (B-15+B-17)",
            "Resueltos con Plan Mode + tests",
            "Cero pendientes al cierre",
            "Documentados en GitHub",
        ], AMBER),
    ]
    cards_y = Inches(1.9)
    card_w = Inches(4.1)
    gap = Inches(0.10)
    left_start = Inches(0.45)

    for i, (titulo, items, color) in enumerate(preguntas):
        left = left_start + (card_w + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, cards_y, card_w, Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(2)
        card.shadow.inherit = False
        add_rect(slide, left, cards_y, card_w, Inches(0.08), color)
        add_text_box(slide, left + Inches(0.2), cards_y + Inches(0.2),
                     card_w - Inches(0.4), Inches(0.6),
                     titulo, font_size=15, bold=True, color=color)
        add_bullet_list(slide, left + Inches(0.2), cards_y + Inches(0.9),
                        card_w - Inches(0.4), Inches(3.6), items, font_size=11)

    add_footer(slide, "Marian (Scrum Master) - 40s")
    add_page_num(slide, 2)


# ===========================================================================
# SLIDE 3 - QR + DEMO
# ===========================================================================
def slide_3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "DEMO EN VIVO")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Escanea el QR y pruebalo en tu celular",
                 font_size=28, bold=True, color=INK)

    if QR_IMG.exists():
        slide.shapes.add_picture(str(QR_IMG), Inches(0.8), Inches(2.0),
                                  width=Inches(4.5), height=Inches(4.5))
    else:
        add_rect(slide, Inches(0.8), Inches(2.0), Inches(4.5), Inches(4.5),
                  MIST, line_color=TEAL)
        add_text_box(slide, Inches(0.8), Inches(4.0), Inches(4.5), Inches(0.6),
                     "[QR]", font_size=20, bold=True, color=TEAL,
                     align=PP_ALIGN.CENTER)

    add_text_box(slide, Inches(0.8), Inches(6.7), Inches(4.5), Inches(0.3),
                 "helios-web-production.up.railway.app",
                 font_size=10, color=INK_MUTED, align=PP_ALIGN.CENTER)

    pasos = [
        ("1.", "Registrate con un correo nuevo"),
        ("2.", "Elige especialidad y sede"),
        ("3.", "Selecciona medico de la lista"),
        ("4.", "Elige horario en el calendario"),
        ("5.", "Confirma con tu cedula panamena"),
        ("6.", "Recibe codigo de cita unico"),
    ]
    y_start = Inches(2.0)
    for i, (num, paso) in enumerate(pasos):
        y = y_start + Inches(0.65) * i
        circle = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                         Inches(5.8), y, Inches(0.5), Inches(0.5))
        circle.fill.solid()
        circle.fill.fore_color.rgb = TEAL
        circle.line.fill.background()
        circle.shadow.inherit = False
        tf = circle.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = num.replace(".", "")
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = WHITE
        add_text_box(slide, Inches(6.5), y + Inches(0.08),
                     Inches(6.5), Inches(0.5),
                     paso, font_size=15, color=INK)

    add_footer(slide, "Ashley (QA) - 55s - Demo en vivo desde el celular")
    add_page_num(slide, 3)


# ===========================================================================
# SLIDE 4 - QUE HIZO CADA UNO
# ===========================================================================
def slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "APORTE INDIVIDUAL")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Que hizo cada integrante en el Sprint 1",
                 font_size=28, bold=True, color=INK)

    integrantes = [
        ("Jose Brown", "Product Owner", "22 commits", [
            "Validacion de cada deploy en produccion",
            "Detecto 8 bugs criticos en uso real",
            "Lidero las 4 iteraciones del B-20",
            "Configuro los 5 agentes IA",
            "Priorizo backlog del sprint",
        ], TEAL),
        ("Marian Barba", "Scrum Master / DevOps", "26 commits", [
            "Setup inicial del proyecto",
            "Deploys CI/CD a Railway",
            "Documentacion de metricas",
            "Coordinacion ceremonias Scrum",
            "Gestion del Kanban en Jira",
        ], TEAL_DARK),
        ("Ethan Gonzalez", "Dev Frontend", "3 commits + paircoding", [
            "Componentes React + TypeScript",
            "Fix B-05 (toolbar sticky)",
            "Fix B-08 (try/catch 5 hooks)",
            "Vista mobile del calendario",
            "Integracion Supabase Auth",
        ], TEAL_LIGHT),
        ("Alejandro Saenz", "Tech Lead", "2 commits + arquitectura", [
            "Arquitectura Supabase + RLS",
            "Funcion SQL crear_cita_atomica",
            "Fix B-09 (seguridad sessionStorage)",
            "6 tablas + 3 vinculos auth",
            "Decisiones tecnicas del sprint",
        ], ACCENT),
        ("Ashley Martinez", "QA Engineer", "6 commits", [
            "Pruebas funcionales del wizard",
            "Documentacion de metricas",
            "Casos de prueba para el demo",
            "Calculo 8.70 bugs/KLOC",
            "Validacion criterios aceptacion",
        ], AMBER),
    ]

    card_w = Inches(2.46)
    card_h = Inches(4.7)
    gap = Inches(0.08)
    left_start = Inches(0.4)
    y = Inches(1.9)

    for i, (nombre, rol, commits, items, color) in enumerate(integrantes):
        left = left_start + (card_w + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_rect(slide, left, y, card_w, Inches(1.0), color)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.1),
                     card_w - Inches(0.2), Inches(0.4),
                     nombre, font_size=13, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.45),
                     card_w - Inches(0.2), Inches(0.35),
                     rol, font_size=10, color=WHITE, align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.72),
                     card_w - Inches(0.2), Inches(0.3),
                     commits, font_size=9, color=WHITE, align=PP_ALIGN.CENTER)
        add_bullet_list(slide, left + Inches(0.15), y + Inches(1.15),
                        card_w - Inches(0.3), Inches(3.5), items,
                        font_size=9, color=INK)

    add_footer(slide, "Jose (PO) - 50s - Aporte por persona")
    add_page_num(slide, 4)


# ===========================================================================
# SLIDE 5 - FRONTEND (ETHAN)
# ===========================================================================
def slide_5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "FRONTEND", color=TEAL_LIGHT)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Lo que construimos en React + TypeScript + Vite",
                 font_size=28, bold=True, color=INK)

    # Lado izquierdo: stack frontend
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Stack frontend", font_size=18, bold=True, color=TEAL_DARK)
    stack = [
        ("React 19", "Componentes funcionales + hooks"),
        ("TypeScript 6", "Tipado estricto, cero `any`"),
        ("Vite 8", "Bundle 754 KB / 217 KB gzip"),
        ("Tailwind 3", "Design system consistente"),
        ("React Router 7", "SPA con ProtectedRoute"),
        ("FullCalendar 6", "Vista calendario desktop"),
    ]
    for i, (k, v) in enumerate(stack):
        y = Inches(2.6) + Inches(0.5) * i
        add_text_box(slide, Inches(0.6), y, Inches(2.0), Inches(0.35),
                     "- " + k, font_size=12, bold=True, color=INK)
        add_text_box(slide, Inches(2.7), y, Inches(3.8), Inches(0.35),
                     v, font_size=11, color=INK_MUTED)

    # Lado derecho: componentes construidos
    add_text_box(slide, Inches(7.0), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Componentes construidos", font_size=18, bold=True, color=TEAL_DARK)
    componentes = [
        ("SelectorEspecialidad", "Lista filtrable con loading"),
        ("ListaMedicos", "Cards con foto + datos"),
        ("CalendarioCitas", "Slots disponibles tiempo real"),
        ("CalendarioCitasLista", "Vista mobile (B-18)"),
        ("FormularioConfirmacion", "Validacion cedula panamena"),
        ("ResumenCita", "Codigo unico generado"),
        ("MedicoDashboard", "Agenda hoy + historial"),
        ("ProtectedRoute", "Guard por rol (B-13)"),
    ]
    for i, (k, v) in enumerate(componentes):
        y = Inches(2.6) + Inches(0.42) * i
        add_text_box(slide, Inches(7.1), y, Inches(2.8), Inches(0.35),
                     "- " + k, font_size=11, bold=True, color=INK)
        add_text_box(slide, Inches(9.9), y, Inches(3.2), Inches(0.35),
                     v, font_size=10, color=INK_MUTED)

    add_footer(slide, "Ethan (Frontend) - 35s")
    add_page_num(slide, 5)


# ===========================================================================
# SLIDE 6 - BACKEND / SQL (ALEJANDRO)
# ===========================================================================
def slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "BACKEND / SQL", color=ACCENT)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Arquitectura Supabase + Row Level Security",
                 font_size=28, bold=True, color=INK)

    # Bloque grande: arquitectura
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "6 tablas + 3 vinculos auth", font_size=18, bold=True, color=TEAL_DARK)
    tablas = [
        ("sedes", "3 policlinicas"),
        ("especialidades", "5 especialidades"),
        ("medicos", "20 cuentas demo"),
        ("horarios", "1200+ slots disponibles"),
        ("pacientes", "Datos personales + cedula"),
        ("citas", "Tabla central + estados"),
        ("auth_paciente_link", "Mapea auth.users -> pacientes"),
        ("auth_medico_link", "Mapea auth.users -> medicos"),
    ]
    for i, (k, v) in enumerate(tablas):
        y = Inches(2.6) + Inches(0.42) * i
        add_text_box(slide, Inches(0.6), y, Inches(2.5), Inches(0.35),
                     "- " + k, font_size=11, bold=True, color=INK)
        add_text_box(slide, Inches(3.1), y, Inches(3.4), Inches(0.35),
                     v, font_size=10, color=INK_MUTED)

    # Lado derecho: seguridad + RPC
    add_text_box(slide, Inches(7.0), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Seguridad + funcion atomica", font_size=18, bold=True, color=TEAL_DARK)

    # Box RLS
    add_rect(slide, Inches(7.0), Inches(2.6), Inches(6.0), Inches(2.2),
              MIST, line_color=TEAL)
    add_text_box(slide, Inches(7.2), Inches(2.7), Inches(5.6), Inches(0.4),
                 "Row Level Security (RLS)", font_size=14, bold=True, color=TEAL_DARK)
    rls = [
        "paciente_ve_sus_citas: auth.uid = dueno",
        "medico_ve_sus_citas: auth.uid = asignado",
        "paciente_crea_su_link: WITH CHECK estricto",
        "Atacante con DevTools NO puede modificar ajeno",
    ]
    add_bullet_list(slide, Inches(7.2), Inches(3.1), Inches(5.6), Inches(1.6),
                    rls, font_size=10, color=INK)

    # Box RPC
    add_rect(slide, Inches(7.0), Inches(4.95), Inches(6.0), Inches(2.0),
              MIST, line_color=ACCENT)
    add_text_box(slide, Inches(7.2), Inches(5.05), Inches(5.6), Inches(0.4),
                 "Funcion SQL atomica", font_size=14, bold=True, color=TEAL_DARK)
    add_text_box(slide, Inches(7.2), Inches(5.5), Inches(5.6), Inches(0.4),
                 "crear_cita_atomica(paciente, horario)",
                 font_size=11, bold=True, color=ACCENT)
    rpc = [
        "Reserva horario + crea cita en 1 transaccion",
        "Evita race: 2 pacientes mismo slot",
        "SECURITY DEFINER + validacion auth.uid",
        "Tested con Locust 200 usuarios concurrentes",
    ]
    add_bullet_list(slide, Inches(7.2), Inches(5.9), Inches(5.6), Inches(1.5),
                    rpc, font_size=10, color=INK)

    add_footer(slide, "Alejandro (Tech Lead) - 35s")
    add_page_num(slide, 6)


# ===========================================================================
# SLIDE 7 - DIAGRAMA DE FLUJO
# ===========================================================================
def slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "FLUJO USUARIO")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Como navega un paciente / medico por HELIOS",
                 font_size=28, bold=True, color=INK)

    if FLUJO_IMG.exists():
        slide.shapes.add_picture(str(FLUJO_IMG),
                                  Inches(3.5), Inches(1.8),
                                  height=Inches(5.2))
    else:
        add_text_box(slide, Inches(0.5), Inches(3.5), Inches(12.5), Inches(0.5),
                     "[Diagrama flujo usuario]", font_size=18, color=TEAL,
                     align=PP_ALIGN.CENTER)

    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(2.8), Inches(0.4),
                 "Rutas principales:", font_size=12, bold=True, color=INK)
    leyenda = [
        ("Paciente nuevo:", "Registro -> Login -> Agendar"),
        ("Paciente existente:", "Login -> Agendar / Mis Citas"),
        ("Medico:", "Login -> Dashboard agenda hoy"),
        ("Race React (B-20):", "INSERT en onAuthStateChange"),
    ]
    for i, (k, v) in enumerate(leyenda):
        y = Inches(2.5) + Inches(0.85) * i
        add_text_box(slide, Inches(0.5), y, Inches(2.8), Inches(0.3),
                     k, font_size=11, bold=True, color=TEAL_DARK)
        add_text_box(slide, Inches(0.5), y + Inches(0.32), Inches(2.8),
                     Inches(0.4), v, font_size=10, color=INK_MUTED)

    add_footer(slide, "Jose (PO) - 50s")
    add_page_num(slide, 7)


# ===========================================================================
# SLIDE 8 - AGENTES IA HELIOS (NUEVO - JOSE)
# ===========================================================================
def slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "AGENTES IA", color=PURPLE)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "5 agentes IA especializados del equipo HELIOS",
                 font_size=28, bold=True, color=INK)

    add_text_box(slide, Inches(0.5), Inches(1.6), Inches(12.5), Inches(0.4),
                 "Cada agente esta especializado en una responsabilidad. Coordinacion automatica.",
                 font_size=12, color=INK_MUTED)

    agentes = [
        ("orchestrator", "Team Orchestrator",
         "Coordina al equipo segun el cambio. SIEMPRE se invoca primero.",
         "Decide que agentes lanzar y en que orden", PURPLE),
        ("frontend", "Frontend Expert",
         "React 19 + TS 6 + Vite + Tailwind + Supabase",
         "Conoce el stack exacto del proyecto", TEAL),
        ("bug-hunter", "Bug Hunter",
         "Detecta loading infinitos, race conditions, promesas sin catch",
         "Invocar antes de cada deploy + en bugs reportados", RED),
        ("clean-code", "Clean Code",
         "JSDoc, naming, complexity, codigo muerto, agrupacion imports",
         "Invocar tras fixes grandes o antes de merge", ACCENT),
        ("test-engineer", "Test Engineer",
         "Vitest + RTL, cobertura >=60%, tests de regresion por bug",
         "Invocar tras agregar feature o fix de bug", AMBER),
    ]

    # 5 agentes en una fila
    card_w = Inches(2.46)
    card_h = Inches(4.2)
    gap = Inches(0.08)
    left_start = Inches(0.4)
    y = Inches(2.2)

    for i, (icon, nombre, desc, cuando, color) in enumerate(agentes):
        left = left_start + (card_w + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        # Header
        add_rect(slide, left, y, card_w, Inches(0.85), color)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.1),
                     card_w - Inches(0.2), Inches(0.4),
                     nombre, font_size=12, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.5),
                     card_w - Inches(0.2), Inches(0.3),
                     "helios-" + icon, font_size=9, color=WHITE,
                     align=PP_ALIGN.CENTER)
        # Descripcion principal
        add_text_box(slide, left + Inches(0.15), y + Inches(1.0),
                     card_w - Inches(0.3), Inches(1.6),
                     desc, font_size=10, color=INK)
        # Cuando invocar
        add_text_box(slide, left + Inches(0.15), y + Inches(2.7),
                     card_w - Inches(0.3), Inches(0.35),
                     "Cuando:", font_size=9, bold=True, color=color)
        add_text_box(slide, left + Inches(0.15), y + Inches(3.05),
                     card_w - Inches(0.3), Inches(1.1),
                     cuando, font_size=9, color=INK_MUTED)

    # Pie con valor
    add_rect(slide, Inches(0.5), Inches(6.6), Inches(12.5), Inches(0.45),
              TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(6.65), Inches(12.5), Inches(0.35),
                 "Resultado: ciclos Plan->Code->Review->Test->Deploy en <30 min cada bug",
                 font_size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    add_footer(slide, "Jose (PO) - 75s - Innovacion: agentes IA especializados")
    add_page_num(slide, 8)


# ===========================================================================
# SLIDE 9 - METRICAS ISTQB
# ===========================================================================
def slide_9(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "METRICAS ISTQB")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Lo que medimos segun el estandar internacional",
                 font_size=28, bold=True, color=INK)

    metricas = [
        ("65", "Tests automatizados",
         "Vitest + RTL. Todos pasan.\nThreshold 60% activo en CI.", TEAL),
        ("61.4%", "Cobertura de codigo",
         "Statements 61.4% - Functions 90.9%.\nBuild falla si baja de 60%.", TEAL_LIGHT),
        ("300 ms", "Latencia P95",
         "Locust 200 usuarios concurrentes.\nMeta era 2s. Lo superamos 6.6x.", ACCENT),
        ("20", "Defectos resueltos",
         "Tasa 8.70 bugs/KLOC (rango profesional).\nCero pendientes al cierre.", AMBER),
    ]
    card_w = Inches(5.9)
    card_h = Inches(2.3)
    gap = Inches(0.2)
    left_start = Inches(0.6)
    y_start = Inches(1.9)

    for i, (num, titulo, desc, color) in enumerate(metricas):
        col = i % 2
        row = i // 2
        left = left_start + (card_w + gap) * col
        y = y_start + (card_h + gap) * row
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_text_box(slide, left + Inches(0.2), y + Inches(0.2),
                     Inches(2.0), Inches(1.5),
                     num, font_size=48, bold=True, color=color)
        add_text_box(slide, left + Inches(2.4), y + Inches(0.3),
                     card_w - Inches(2.6), Inches(0.5),
                     titulo, font_size=18, bold=True, color=INK)
        tb = slide.shapes.add_textbox(left + Inches(2.4), y + Inches(0.9),
                                       card_w - Inches(2.6), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        for j, linea in enumerate(desc.split("\n")):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            run = p.add_run()
            run.text = linea
            run.font.size = Pt(11)
            run.font.color.rgb = INK_MUTED

    add_footer(slide, "Jose (PO) - 50s - Solo ISTQB (recomendacion profesora)")
    add_page_num(slide, 9)


# ===========================================================================
# SLIDE 10 - BUGS DETECTADOS (NUEVO - MARIAN)
# ===========================================================================
def slide_10(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "BUGS DETECTADOS", color=RED)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "20 bugs cazados y resueltos en uso real",
                 font_size=28, bold=True, color=INK)

    # Resumen arriba
    add_text_box(slide, Inches(0.5), Inches(1.6), Inches(12.5), Inches(0.4),
                 "Cada bug tiene ID, causa raiz, fix aplicado y test de regresion. Trazables en GitHub.",
                 font_size=11, color=INK_MUTED)

    # Tabla por severidad
    add_text_box(slide, Inches(0.5), Inches(2.1), Inches(6.0), Inches(0.4),
                 "Distribucion por severidad", font_size=14, bold=True, color=TEAL_DARK)
    severidades = [
        ("Critica", "7 bugs", "B-06, B-07, B-11, B-14, B-19, B-20.x", RED),
        ("Alta", "8 bugs", "B-04, B-08, B-10, B-12, B-13, B-15, B-17, B-18", AMBER),
        ("Media", "4 bugs", "B-01, B-05, B-09, B-16", TEAL_LIGHT),
        ("Baja", "1 bug", "B-03", GREEN_OK),
    ]
    for i, (sev, cant, ids, color) in enumerate(severidades):
        y = Inches(2.55) + Inches(0.55) * i
        chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                       Inches(0.5), y, Inches(1.0), Inches(0.4))
        chip.fill.solid()
        chip.fill.fore_color.rgb = color
        chip.line.fill.background()
        chip.shadow.inherit = False
        tf = chip.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = sev
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.color.rgb = WHITE
        add_text_box(slide, Inches(1.6), y + Inches(0.05), Inches(0.8),
                     Inches(0.35), cant, font_size=11, bold=True, color=INK)
        add_text_box(slide, Inches(2.5), y + Inches(0.05), Inches(4.0),
                     Inches(0.35), ids, font_size=9, color=INK_MUTED)

    # Quien los detecto
    add_text_box(slide, Inches(0.5), Inches(4.9), Inches(6.0), Inches(0.4),
                 "Quien detecto los bugs", font_size=14, bold=True, color=TEAL_DARK)
    detector = [
        ("PO en uso real:", "15 bugs (75%)"),
        ("Code review:", "3 bugs (15%)"),
        ("Tests automaticos:", "2 bugs (10%)"),
    ]
    for i, (k, v) in enumerate(detector):
        y = Inches(5.35) + Inches(0.4) * i
        add_text_box(slide, Inches(0.6), y, Inches(2.5), Inches(0.35),
                     k, font_size=11, color=INK)
        add_text_box(slide, Inches(3.2), y, Inches(2.5), Inches(0.35),
                     v, font_size=11, bold=True, color=TEAL)

    # Lado derecho: caso destacado B-20
    add_rect(slide, Inches(7.0), Inches(2.1), Inches(6.0), Inches(4.7),
              MIST, line_color=RED)
    add_chip(slide, Inches(7.1), Inches(2.2), "CASO DESTACADO", color=RED)
    add_text_box(slide, Inches(7.1), Inches(2.65), Inches(5.8), Inches(0.5),
                 "B-20: race React closure",
                 font_size=18, bold=True, color=INK)
    add_text_box(slide, Inches(7.1), Inches(3.15), Inches(5.8), Inches(0.4),
                 "4 iteraciones hasta el fix definitivo",
                 font_size=11, bold=True, color=RED)
    iteraciones = [
        ("B-20:", "Separar registro de login (signUp + sessionStorage)"),
        ("B-20.1:", "signOut tras signUp evita auto-login"),
        ("B-20.2:", "Polling JWT + errores visibles en pantalla"),
        ("B-20.3:", "FIX DEFINITIVO: mover INSERT a useAuth listener"),
    ]
    for i, (k, v) in enumerate(iteraciones):
        y = Inches(3.7) + Inches(0.55) * i
        add_text_box(slide, Inches(7.2), y, Inches(0.8), Inches(0.35),
                     k, font_size=11, bold=True, color=RED)
        add_text_box(slide, Inches(8.0), y, Inches(4.8), Inches(0.4),
                     v, font_size=10, color=INK)

    add_text_box(slide, Inches(7.1), Inches(6.05), Inches(5.8), Inches(0.4),
                 "La pista del PO fue clave:",
                 font_size=11, bold=True, color=TEAL_DARK)
    add_text_box(slide, Inches(7.1), Inches(6.4), Inches(5.8), Inches(0.4),
                 "\"si cierro sesion y vuelvo a entrar, funciona\"",
                 font_size=11, color=INK)

    add_footer(slide, "Marian (Scrum Master) - 100s - Bugs detectados y caso B-20")
    add_page_num(slide, 10)


# ===========================================================================
# SLIDE 11 - SONARCLOUD LIVE
# ===========================================================================
def slide_11(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "SONARCLOUD LIVE", color=RED)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Analisis de calidad y seguridad en vivo",
                 font_size=28, bold=True, color=INK)

    # Izquierda: que vamos a mostrar
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Vamos a abrir SonarCloud y mostrar:",
                 font_size=16, bold=True, color=TEAL_DARK)

    items_demo = [
        ("Bugs detectados", "Issues encontrados automaticamente"),
        ("Code smells", "Patrones que pueden causar problemas"),
        ("Vulnerabilidades", "Problemas de seguridad"),
        ("Coverage", "Codigo cubierto por nuestros tests"),
        ("Duplication", "Codigo duplicado que refactorizar"),
        ("Quality Gate", "Pasa o falla threshold de calidad"),
    ]
    for i, (k, v) in enumerate(items_demo):
        y = Inches(2.7) + Inches(0.55) * i
        bullet = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                         Inches(0.6), y + Inches(0.1),
                                         Inches(0.15), Inches(0.15))
        bullet.fill.solid()
        bullet.fill.fore_color.rgb = TEAL
        bullet.line.fill.background()
        bullet.shadow.inherit = False
        add_text_box(slide, Inches(0.9), y, Inches(2.0), Inches(0.4),
                     k, font_size=13, bold=True, color=INK)
        add_text_box(slide, Inches(2.9), y, Inches(3.7), Inches(0.4),
                     v, font_size=11, color=INK_MUTED)

    # Derecha: caja demo
    box_left = Inches(7.0)
    box_top = Inches(2.0)
    box_w = Inches(5.8)
    box_h = Inches(4.8)
    add_rect(slide, box_left, box_top, box_w, box_h, INK, line_color=TEAL)
    add_text_box(slide, box_left, box_top + Inches(0.5), box_w, Inches(0.6),
                 "SonarCloud", font_size=32, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
    add_text_box(slide, box_left, box_top + Inches(1.2), box_w, Inches(0.4),
                 "sonarcloud.io/project/overview?id=MarianC-programing_Helios",
                 font_size=9, color=ACCENT, align=PP_ALIGN.CENTER)
    add_rect(slide, box_left + Inches(0.5), box_top + Inches(1.9),
              box_w - Inches(1.0), Inches(2.5), TEAL_DARK)
    add_text_box(slide, box_left + Inches(0.5), box_top + Inches(2.0),
                 box_w - Inches(1.0), Inches(0.5),
                 "DEMO EN VIVO", font_size=18, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
    add_text_box(slide, box_left + Inches(0.5), box_top + Inches(2.6),
                 box_w - Inches(1.0), Inches(0.5),
                 "Abriremos el dashboard", font_size=14, color=WHITE,
                 align=PP_ALIGN.CENTER)
    add_text_box(slide, box_left + Inches(0.5), box_top + Inches(3.1),
                 box_w - Inches(1.0), Inches(0.5),
                 "y revisaremos los hallazgos", font_size=14, color=WHITE,
                 align=PP_ALIGN.CENTER)
    add_text_box(slide, box_left + Inches(0.5), box_top + Inches(3.7),
                 box_w - Inches(1.0), Inches(0.5),
                 "(escanea cada push automatico)", font_size=11,
                 color=ACCENT, align=PP_ALIGN.CENTER)

    add_footer(slide, "Ashley + Jose - 80s - SonarCloud en vivo")
    add_page_num(slide, 11)


# ===========================================================================
# SLIDE 12 - KANBAN + CIERRE
# ===========================================================================
def slide_12(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "KANBAN + CIERRE")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Estado del Sprint 1 + roadmap Sprint 2",
                 font_size=28, bold=True, color=INK)

    # Izquierda: 7 herramientas
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "7 herramientas usadas", font_size=16, bold=True, color=TEAL_DARK)
    herramientas = [
        ("GitHub", "Repositorio + commits firmados"),
        ("Jira", "Tablero Kanban 21 issues"),
        ("Vitest", "65 tests automatizados"),
        ("Locust", "P95 300ms con 200 users"),
        ("Supabase", "BD + Auth + API"),
        ("Railway", "Deploy CI automatico"),
        ("SonarCloud", "Calidad + seguridad (NUEVO)"),
    ]
    for i, (k, v) in enumerate(herramientas):
        y = Inches(2.6) + Inches(0.42) * i
        add_text_box(slide, Inches(0.6), y, Inches(1.8), Inches(0.35),
                     "- " + k, font_size=12, bold=True, color=INK)
        add_text_box(slide, Inches(2.4), y, Inches(4.0), Inches(0.35),
                     v, font_size=11, color=INK_MUTED)

    # Derecha: Kanban
    add_text_box(slide, Inches(7.0), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Tablero Kanban Jira", font_size=16, bold=True, color=TEAL_DARK)
    columnas = [
        ("Done", "20 bugs + 5 US Sprint 1", GREEN_OK),
        ("In Progress", "Cancelar / reprogramar cita", TEAL),
        ("To Do", "Sprint 2: HELL-3 (9 subtareas)", AMBER),
    ]
    col_w = Inches(1.85)
    col_h = Inches(3.0)
    col_y = Inches(2.6)
    for i, (titulo, desc, color) in enumerate(columnas):
        left = Inches(7.0) + (col_w + Inches(0.1)) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, col_y, col_w, col_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(2)
        card.shadow.inherit = False
        add_rect(slide, left, col_y, col_w, Inches(0.5), color)
        add_text_box(slide, left, col_y + Inches(0.08), col_w, Inches(0.4),
                     titulo, font_size=12, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), col_y + Inches(0.7),
                     col_w - Inches(0.2), Inches(2.2),
                     desc, font_size=10, color=INK, align=PP_ALIGN.CENTER)

    # Cierre
    add_rect(slide, Inches(0.5), Inches(6.0), Inches(12.5), Inches(0.9), TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(6.05), Inches(12.5), Inches(0.45),
                 "MVP funcional - Metricas medidas - Proceso documentado - Agentes IA",
                 font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text_box(slide, Inches(0.5), Inches(6.5), Inches(12.5), Inches(0.4),
                 "Gracias. Preguntas?",
                 font_size=14, color=ACCENT, align=PP_ALIGN.CENTER)

    add_footer(slide, "Marian 20s (Kanban) + Jose 10s (cierre)")
    add_page_num(slide, 12)


# ===========================================================================
# CONVERSION A PDF
# ===========================================================================
def convert_pptx_to_pdf(pptx: Path, pdf: Path) -> bool:
    try:
        import comtypes.client  # type: ignore
    except ImportError:
        return False
    ppt = None
    try:
        ppt = comtypes.client.CreateObject("PowerPoint.Application")
        ppt.Visible = 1
        deck = ppt.Presentations.Open(str(pptx.absolute()), WithWindow=False)
        deck.SaveAs(str(pdf.absolute()), 32)
        deck.Close()
        return True
    except Exception as e:
        print(f"[error] PowerPoint fallo: {e}")
        return False
    finally:
        if ppt is not None:
            try:
                ppt.Quit()
            except Exception:
                pass


def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    slide_1(prs)
    slide_2(prs)
    slide_3(prs)
    slide_4(prs)
    slide_5(prs)
    slide_6(prs)
    slide_7(prs)
    slide_8(prs)
    slide_9(prs)
    slide_10(prs)
    slide_11(prs)
    slide_12(prs)

    prs.save(str(OUT_PPTX))
    print(f"[ok] PPTX generado: {OUT_PPTX} ({OUT_PPTX.stat().st_size / 1024:.1f} KB)")

    if convert_pptx_to_pdf(OUT_PPTX, OUT_PDF):
        print(f"[ok] PDF generado: {OUT_PDF} ({OUT_PDF.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
