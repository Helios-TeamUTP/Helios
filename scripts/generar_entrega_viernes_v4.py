"""Genera la PPTX v4 - 10 minutos en SOLO 8 slides (consolidado).

Cambios respecto a v3:
- 12 slides -> 8 slides (consolidacion)
- Ethan y Alejandro ya no tienen slide propio, hablan en slide 4 (5 cards)
- Metricas ISTQB y Bugs detectados se combinan en slide 7 (split horizontal)
- SonarCloud, Kanban y cierre se combinan en slide 8

DISTRIBUCION 10 minutos (9:50 real):
- 0:00-0:40  Marian: Portada (slide 1, 15s) + Daily (slide 2, 25s)
- 0:40-1:35  Ashley: QR + demo en vivo (slide 3, 55s)
- 1:35-3:15  Jose + Ethan + Alejandro: Que hizo cada uno (slide 4, 100s)
  * Jose introduce 40s (todos los miembros)
  * Ethan explica su parte 30s (componentes frontend)
  * Alejandro explica su parte 30s (backend SQL + RLS)
- 3:15-4:00  Jose: Diagrama flujo usuario (slide 5, 45s)
- 4:00-5:30  Jose: AGENTES IA HELIOS (slide 6, 90s)
- 5:30-7:30  Jose + Marian: Metricas + Bugs (slide 7, 120s)
  * Jose: ISTQB izquierda (40s)
  * Marian: Bugs derecha (80s)
- 7:30-9:50  Ashley + Jose + Marian: SonarCloud + Kanban + Cierre (slide 8, 140s)
  * Ashley + Jose: SonarCloud LIVE (90s)
  * Marian: Kanban + Sprint 2 (40s)
  * Jose: Cierre (10s)

Output:
    dailys/Entrega_Viernes/HELIOS_Sprint1_v4_8slides.pptx
    dailys/Entrega_Viernes/HELIOS_Sprint1_v4_8slides.pdf
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
OUT_PPTX = OUT_DIR / "HELIOS_Sprint1_v4_8slides.pptx"
OUT_PDF = OUT_DIR / "HELIOS_Sprint1_v4_8slides.pdf"
QR_IMG = ROOT / "dailys" / "qr_helios_demo.png"
FLUJO_IMG = OUT_DIR / "diagrama_flujo_usuario.png"
OUT_DIR.mkdir(parents=True, exist_ok=True)

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

TOTAL_SLIDES = 8


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


def add_chip(slide, left, top, text, color=TEAL, width=1.6):
    chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   left, top, Inches(width), Inches(0.35))
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
                 "MVP en produccion - 20 bugs resueltos - 5 agentes IA",
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

    add_footer(slide, "Marian (Scrum Master) - 25s")
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
# SLIDE 4 - QUE HIZO CADA UNO (con Frontend+Backend integrados)
# ===========================================================================
def slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "APORTE INDIVIDUAL", width=1.9)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Que hizo cada integrante del equipo",
                 font_size=28, bold=True, color=INK)

    integrantes = [
        ("Jose Brown", "PO - 22 commits", [
            "Valido cada deploy real",
            "Detecto 8 bugs en uso",
            "Lidero las 4 iteraciones B-20",
            "Configuro agentes IA",
        ], TEAL),
        ("Marian Barba", "Scrum/DevOps - 26 commits", [
            "Setup proyecto + CI/CD",
            "Deploys a Railway",
            "Configura agentes IA",
            "Coordina Scrum",
        ], TEAL_DARK),
        ("Ethan Gonzalez", "Frontend - React 19+TS", [
            "8 componentes React",
            "Fix B-05 + B-08",
            "Vista mobile (B-18)",
            "Tipado estricto (cero any)",
        ], TEAL_LIGHT),
        ("Alejandro Saenz", "Tech Lead - Supabase+SQL", [
            "Arquitectura RLS multicapa",
            "Funcion atomica SQL",
            "Fix B-09 seguridad",
            "6 tablas + 2 vinculos auth",
        ], ACCENT),
        ("Ashley Martinez", "QA - 6 commits docs", [
            "Pruebas funcionales",
            "Documentacion metricas",
            "Casos de prueba demo",
            "Calculo 8.70 bugs/KLOC",
        ], AMBER),
    ]

    card_w = Inches(2.46)
    card_h = Inches(4.7)
    gap = Inches(0.08)
    left_start = Inches(0.4)
    y = Inches(1.9)

    for i, (nombre, rol, items, color) in enumerate(integrantes):
        left = left_start + (card_w + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_rect(slide, left, y, card_w, Inches(0.9), color)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.1),
                     card_w - Inches(0.2), Inches(0.4),
                     nombre, font_size=13, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.5),
                     card_w - Inches(0.2), Inches(0.35),
                     rol, font_size=10, color=WHITE, align=PP_ALIGN.CENTER)
        add_bullet_list(slide, left + Inches(0.15), y + Inches(1.05),
                        card_w - Inches(0.3), Inches(3.5), items,
                        font_size=10, color=INK)

    add_footer(slide, "Jose + Ethan + Alejandro - 100s - Aportes individuales")
    add_page_num(slide, 4)


# ===========================================================================
# SLIDE 5 - DIAGRAMA DE FLUJO
# ===========================================================================
def slide_5(prs):
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

    add_footer(slide, "Jose (PO) - 45s")
    add_page_num(slide, 5)


# ===========================================================================
# SLIDE 6 - AGENTES IA HELIOS (JOSE)
# ===========================================================================
def slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "AGENTES IA", color=PURPLE)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "5 agentes IA especializados del equipo HELIOS",
                 font_size=28, bold=True, color=INK)

    add_text_box(slide, Inches(0.5), Inches(1.6), Inches(12.5), Inches(0.4),
                 "Cada agente esta especializado. Coordinacion automatica via orchestrator.",
                 font_size=12, color=INK_MUTED)

    agentes = [
        ("Team Orchestrator", "helios-orchestrator",
         "Coordina al equipo segun el tipo de cambio. SIEMPRE primero.",
         PURPLE),
        ("Frontend Expert", "helios-frontend-expert",
         "React 19 + TS 6 + Vite + Tailwind + Supabase. Conoce el stack.",
         TEAL),
        ("Bug Hunter", "helios-bug-hunter",
         "Detecta loading infinitos, race conditions, promesas sin catch.",
         RED),
        ("Clean Code", "helios-clean-code",
         "JSDoc, naming, complexity, codigo muerto, agrupacion imports.",
         ACCENT),
        ("Test Engineer", "helios-test-engineer",
         "Vitest + RTL, cobertura >=60%, tests de regresion por bug.",
         AMBER),
    ]

    card_w = Inches(2.46)
    card_h = Inches(4.0)
    gap = Inches(0.08)
    left_start = Inches(0.4)
    y = Inches(2.2)

    for i, (nombre, slug, desc, color) in enumerate(agentes):
        left = left_start + (card_w + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_rect(slide, left, y, card_w, Inches(0.9), color)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.1),
                     card_w - Inches(0.2), Inches(0.4),
                     nombre, font_size=12, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), y + Inches(0.5),
                     card_w - Inches(0.2), Inches(0.35),
                     slug, font_size=9, color=WHITE, align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.15), y + Inches(1.05),
                     card_w - Inches(0.3), Inches(2.8),
                     desc, font_size=10, color=INK)

    # Pie con resultado
    add_rect(slide, Inches(0.5), Inches(6.5), Inches(12.5), Inches(0.5),
              TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(6.55), Inches(12.5), Inches(0.4),
                 "Resultado: ciclos Plan->Code->Review->Test->Deploy en <30 min por bug",
                 font_size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    add_footer(slide, "Jose (PO) - 90s - Innovacion: agentes IA especializados")
    add_page_num(slide, 6)


# ===========================================================================
# SLIDE 7 - METRICAS ISTQB + BUGS DETECTADOS (split)
# ===========================================================================
def slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "METRICAS + BUGS", width=1.9)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Lo que medimos + lo que cazamos",
                 font_size=28, bold=True, color=INK)

    # ===== IZQUIERDA: ISTQB =====
    add_text_box(slide, Inches(0.5), Inches(1.7), Inches(6.0), Inches(0.4),
                 "METRICAS ISTQB", font_size=14, bold=True, color=TEAL_DARK)

    metricas = [
        ("65", "Tests automatizados", TEAL),
        ("61.4%", "Cobertura statements", TEAL_LIGHT),
        ("300 ms", "Latencia P95 (200 users)", ACCENT),
        ("20", "Defectos resueltos", AMBER),
    ]
    card_w_l = Inches(2.95)
    card_h_l = Inches(2.0)
    gap_l = Inches(0.1)
    left_l = Inches(0.5)
    y_l = Inches(2.2)

    for i, (num, titulo, color) in enumerate(metricas):
        col = i % 2
        row = i // 2
        left = left_l + (card_w_l + gap_l) * col
        y = y_l + (card_h_l + gap_l) * row
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w_l, card_h_l)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_text_box(slide, left + Inches(0.15), y + Inches(0.15),
                     card_w_l - Inches(0.3), Inches(1.1),
                     num, font_size=36, bold=True, color=color)
        add_text_box(slide, left + Inches(0.15), y + Inches(1.25),
                     card_w_l - Inches(0.3), Inches(0.7),
                     titulo, font_size=11, color=INK)

    # Linea vertical separadora
    add_rect(slide, Inches(6.65), Inches(1.6), Inches(0.02), Inches(5.2),
              INK_MUTED)

    # ===== DERECHA: BUGS =====
    add_text_box(slide, Inches(7.0), Inches(1.7), Inches(6.0), Inches(0.4),
                 "BUGS DETECTADOS (20)", font_size=14, bold=True, color=RED)

    # Tabla por severidad
    sevs = [
        ("Critica", "7 bugs", RED),
        ("Alta", "8 bugs", AMBER),
        ("Media", "4 bugs", TEAL_LIGHT),
        ("Baja", "1 bug", GREEN_OK),
    ]
    for i, (sev, cant, color) in enumerate(sevs):
        y = Inches(2.2) + Inches(0.42) * i
        chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                       Inches(7.0), y, Inches(0.95), Inches(0.35))
        chip.fill.solid()
        chip.fill.fore_color.rgb = color
        chip.line.fill.background()
        chip.shadow.inherit = False
        tf = chip.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = sev
        run.font.size = Pt(9)
        run.font.bold = True
        run.font.color.rgb = WHITE
        add_text_box(slide, Inches(8.05), y + Inches(0.04), Inches(2.0),
                     Inches(0.3), cant, font_size=10, bold=True, color=INK)

    # Quien detecto
    add_text_box(slide, Inches(7.0), Inches(4.0), Inches(6.0), Inches(0.4),
                 "Detector de bugs:", font_size=11, bold=True, color=TEAL_DARK)
    detectores = [
        ("PO uso real:", "15 (75%)"),
        ("Code review:", "3 (15%)"),
        ("Tests auto:", "2 (10%)"),
    ]
    for i, (k, v) in enumerate(detectores):
        y = Inches(4.4) + Inches(0.32) * i
        add_text_box(slide, Inches(7.0), y, Inches(1.8), Inches(0.3),
                     k, font_size=10, color=INK)
        add_text_box(slide, Inches(8.7), y, Inches(2.0), Inches(0.3),
                     v, font_size=10, bold=True, color=TEAL)

    # Caso destacado B-20
    add_rect(slide, Inches(7.0), Inches(5.5), Inches(6.0), Inches(1.4),
              MIST, line_color=RED)
    add_text_box(slide, Inches(7.1), Inches(5.55), Inches(5.8), Inches(0.35),
                 "B-20: 4 iteraciones", font_size=12, bold=True, color=RED)
    add_text_box(slide, Inches(7.1), Inches(5.85), Inches(5.8), Inches(0.35),
                 "Race React closure (refreshPerfil)",
                 font_size=10, color=INK)
    add_text_box(slide, Inches(7.1), Inches(6.2), Inches(5.8), Inches(0.35),
                 "Fix: mover INSERT a useAuth listener",
                 font_size=10, color=INK)
    add_text_box(slide, Inches(7.1), Inches(6.5), Inches(5.8), Inches(0.35),
                 "Pista PO: \"si cierro sesion y vuelvo, funciona\"",
                 font_size=9, color=AMBER, bold=True)

    add_footer(slide, "Jose 40s (ISTQB) + Marian 80s (Bugs) - 120s total")
    add_page_num(slide, 7)


# ===========================================================================
# SLIDE 8 - SONARCLOUD + KANBAN + CIERRE
# ===========================================================================
def slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "CIERRE", color=TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "SonarCloud LIVE + Kanban + Sprint 2",
                 font_size=28, bold=True, color=INK)

    # ===== IZQUIERDA: SonarCloud =====
    add_chip(slide, Inches(0.5), Inches(1.7), "SONARCLOUD LIVE", color=RED,
              width=1.9)
    add_text_box(slide, Inches(0.5), Inches(2.15), Inches(6.0), Inches(0.4),
                 "Demo en vivo del dashboard:", font_size=12, bold=True,
                 color=TEAL_DARK)
    items_sc = [
        "Bugs detectados automaticamente",
        "Code smells (patrones problematicos)",
        "Vulnerabilidades de seguridad",
        "Coverage 61.4% (validado externamente)",
        "Quality Gate PASS/FAIL",
    ]
    add_bullet_list(slide, Inches(0.6), Inches(2.55), Inches(6.0), Inches(2.3),
                    items_sc, font_size=11)

    # Box destacado SonarCloud
    add_rect(slide, Inches(0.5), Inches(4.9), Inches(6.0), Inches(1.8),
              INK, line_color=TEAL)
    add_text_box(slide, Inches(0.5), Inches(5.0), Inches(6.0), Inches(0.5),
                 "SonarCloud", font_size=22, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
    add_text_box(slide, Inches(0.5), Inches(5.6), Inches(6.0), Inches(0.3),
                 "Abriremos en vivo el dashboard",
                 font_size=11, color=ACCENT, align=PP_ALIGN.CENTER)
    add_text_box(slide, Inches(0.5), Inches(5.95), Inches(6.0), Inches(0.4),
                 "MarianC-programing_Helios",
                 font_size=10, color=WHITE, align=PP_ALIGN.CENTER)
    add_text_box(slide, Inches(0.5), Inches(6.3), Inches(6.0), Inches(0.3),
                 "(escanea cada push automatico)",
                 font_size=9, color=ACCENT, align=PP_ALIGN.CENTER)

    # Linea separadora
    add_rect(slide, Inches(6.65), Inches(1.6), Inches(0.02), Inches(5.2),
              INK_MUTED)

    # ===== DERECHA: Kanban + Herramientas =====
    add_chip(slide, Inches(7.0), Inches(1.7), "KANBAN JIRA", color=TEAL,
              width=1.9)
    columnas = [
        ("Done", "20 bugs + 5 US", GREEN_OK),
        ("In Progress", "Cancelar / reprog.", TEAL),
        ("To Do", "Sprint 2 HELL-3", AMBER),
    ]
    col_w = Inches(1.95)
    col_y = Inches(2.2)
    for i, (titulo, desc, color) in enumerate(columnas):
        left = Inches(7.0) + (col_w + Inches(0.05)) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, col_y, col_w, Inches(1.3))
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False
        add_rect(slide, left, col_y, col_w, Inches(0.4), color)
        add_text_box(slide, left, col_y + Inches(0.05), col_w, Inches(0.35),
                     titulo, font_size=10, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        add_text_box(slide, left + Inches(0.1), col_y + Inches(0.5),
                     col_w - Inches(0.2), Inches(0.7),
                     desc, font_size=10, color=INK, align=PP_ALIGN.CENTER)

    # 7 Herramientas
    add_text_box(slide, Inches(7.0), Inches(3.8), Inches(6.0), Inches(0.4),
                 "7 herramientas:", font_size=12, bold=True, color=TEAL_DARK)
    herram = [
        ("GitHub", "Repo + commits firmados"),
        ("Jira", "Kanban 21 issues"),
        ("Vitest", "65 tests automatizados"),
        ("Locust", "P95 300ms con 200 users"),
        ("Supabase", "BD + Auth + API"),
        ("Railway", "Deploy CI"),
        ("SonarCloud", "Calidad + seguridad"),
    ]
    for i, (k, v) in enumerate(herram):
        y = Inches(4.2) + Inches(0.32) * i
        add_text_box(slide, Inches(7.0), y, Inches(1.7), Inches(0.3),
                     "- " + k, font_size=10, bold=True, color=INK)
        add_text_box(slide, Inches(8.6), y, Inches(4.4), Inches(0.3),
                     v, font_size=10, color=INK_MUTED)

    # Cierre
    add_rect(slide, Inches(0.5), Inches(7.05), Inches(12.5), Inches(0.4),
              TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(7.08), Inches(12.5), Inches(0.35),
                 "MVP funcional - Metricas - Proceso - Agentes IA - Gracias. Preguntas?",
                 font_size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    add_footer(slide, "Ashley+Jose 90s (SonarCloud) + Marian 40s + Jose 10s = 140s")
    add_page_num(slide, 8)


# ===========================================================================
# CONVERSION A PDF
# ===========================================================================
def convert_pptx_to_pdf(pptx, pdf):
    try:
        import comtypes.client
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

    prs.save(str(OUT_PPTX))
    print(f"[ok] PPTX generado: {OUT_PPTX} ({OUT_PPTX.stat().st_size / 1024:.1f} KB)")

    if convert_pptx_to_pdf(OUT_PPTX, OUT_PDF):
        print(f"[ok] PDF generado: {OUT_PDF} ({OUT_PDF.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
