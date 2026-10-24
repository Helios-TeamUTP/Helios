"""Genera la PPTX v2 actualizada con feedback de la profesora (28/05/2026):

Cambios respecto a v1:
- Slide nuevo "Que hizo cada uno individualmente"
- Slide nuevo con diagrama de flujo del usuario
- Slide ISTQB simplificado (sin TMMi + TQM, recomendacion profesora)
- Slide nuevo SonarCloud live demo
- NO se incluyen capturas de codigo
- Daily Scrum claro y explicito en slide 2

Distribucion 3 minutos:
- 0:00-0:25  Marian: Portada + Daily Scrum (25s)
- 0:25-1:00  Ashley: QR + demo en vivo (35s)
- 1:00-1:25  Jose: Que hizo cada uno (25s)
- 1:25-1:50  Jose: Diagrama de flujo del usuario (25s)
- 1:50-2:15  Jose: Metricas ISTQB (25s)
- 2:15-2:50  Ashley + Jose: SonarCloud LIVE (35s)
- 2:50-3:00  Jose cierra + preguntas (10s)

Output:
    dailys/Entrega_Viernes/HELIOS_Sprint1_v2.pptx
    dailys/Entrega_Viernes/HELIOS_Sprint1_v2_diapositivas.pdf
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt, Emu

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "dailys" / "Entrega_Viernes"
OUT_PPTX = OUT_DIR / "HELIOS_Sprint1_v2.pptx"
OUT_PDF = OUT_DIR / "HELIOS_Sprint1_v2_diapositivas.pdf"
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


def add_text_box(slide, left, top, width, height, text, *,
                 font_size=14, bold=False, color=INK, align=PP_ALIGN.LEFT,
                 anchor=MSO_ANCHOR.TOP, font_name="Calibri"):
    """Helper para agregar caja de texto."""
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


def add_rect(slide, left, top, width, height, fill_color, *,
             line_color=None):
    """Helper para agregar rectangulo de color."""
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
    """Chip pequeno tipo badge."""
    chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   left, top, Inches(1.4), Inches(0.32))
    chip.fill.solid()
    chip.fill.fore_color.rgb = color
    chip.line.fill.background()
    chip.shadow.inherit = False
    tf = chip.text_frame
    tf.margin_left = Pt(8)
    tf.margin_right = Pt(8)
    tf.margin_top = Pt(2)
    tf.margin_bottom = Pt(2)
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
    """Footer estandar."""
    add_text_box(slide, Inches(0.4), Inches(7.0), Inches(9), Inches(0.3),
                 text, font_size=9, color=INK_MUTED, align=PP_ALIGN.LEFT)


def add_page_num(slide, n):
    """Numero de pagina."""
    add_text_box(slide, Inches(12.0), Inches(7.0), Inches(1), Inches(0.3),
                 f"{n} / 8", font_size=9, color=INK_MUTED, align=PP_ALIGN.RIGHT)


# ===========================================================================
# SLIDE 1 - PORTADA
# ===========================================================================
def slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    # Fondo claro
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, MIST)
    # Banda lateral teal
    add_rect(slide, 0, 0, Inches(0.4), prs.slide_height, TEAL)

    # Marca HELIOS
    add_text_box(slide, Inches(1.0), Inches(1.2), Inches(11), Inches(0.6),
                 "HELIOS", font_size=44, bold=True, color=TEAL_DARK)
    add_text_box(slide, Inches(1.0), Inches(1.9), Inches(11), Inches(0.4),
                 "Sistema unificado de citas medicas",
                 font_size=18, color=INK_MUTED)

    # Titulo principal
    add_text_box(slide, Inches(1.0), Inches(2.9), Inches(11), Inches(1.0),
                 "Sprint 1 - Daily Scrum",
                 font_size=36, bold=True, color=INK)
    add_text_box(slide, Inches(1.0), Inches(3.8), Inches(11), Inches(0.5),
                 "Confirmacion de cita medica end-to-end",
                 font_size=20, color=TEAL)

    # Equipo
    add_text_box(slide, Inches(1.0), Inches(5.0), Inches(11), Inches(0.4),
                 "Grupo HELIOS",
                 font_size=14, bold=True, color=INK)
    add_text_box(slide, Inches(1.0), Inches(5.4), Inches(11), Inches(0.4),
                 "Jose Brown (PO) - Ethan Gonzalez (Frontend) - Alejandro Saenz (Tech Lead)",
                 font_size=12, color=INK_MUTED)
    add_text_box(slide, Inches(1.0), Inches(5.75), Inches(11), Inches(0.4),
                 "Ashley Martinez (QA) - Marian Barba (Scrum Master / DevOps)",
                 font_size=12, color=INK_MUTED)

    # Datos pie
    add_text_box(slide, Inches(1.0), Inches(6.5), Inches(11), Inches(0.4),
                 "UTP - Calidad de Software - 2026 - 3 minutos",
                 font_size=11, color=INK_MUTED)
    add_page_num(slide, 1)


# ===========================================================================
# SLIDE 2 - DAILY SCRUM (3 preguntas)
# ===========================================================================
def slide_2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    # Chip y titulo
    add_chip(slide, Inches(0.5), Inches(0.4), "DAILY SCRUM")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Respuesta a las 3 preguntas obligatorias",
                 font_size=28, bold=True, color=INK)

    # Tres cards (preguntas)
    cards_y = Inches(2.0)
    card_w = Inches(4.05)
    gap = Inches(0.10)
    left_start = Inches(0.5)

    preguntas = [
        ("Que hicimos esta sprint?", [
            "- 5 historias de usuario (US-01 a US-05) al 100%",
            "- Dashboard medico desplegado en produccion",
            "- Seguridad multicapa con RLS por rol",
            "- 65 tests automatizados PASS",
            "- 20 bugs detectados y resueltos",
        ], TEAL),
        ("Que haremos en Sprint 2?", [
            "- Cancelar cita (paciente autoservicio)",
            "- Reprogramar cita a otro horario",
            "- Tabla citas_historial para auditoria",
            "- Tests E2E con Playwright",
            "- Locust a 300 usuarios",
        ], TEAL_LIGHT),
        ("Que bloqueos tuvimos?", [
            "- Bug B-20 race React (4 iteraciones)",
            "- Detectado en uso real por PO",
            "- Spinner >10s tras F5 (B-15+B-17)",
            "- Cero pendientes al cierre del sprint",
            "- Resueltos con Plan Mode + tests",
        ], AMBER),
    ]
    for i, (titulo, items, color) in enumerate(preguntas):
        left = left_start + (card_w + gap) * i
        # Card
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, cards_y, card_w, Inches(4.5))
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(2)
        card.shadow.inherit = False

        # Borde colorido superior
        add_rect(slide, left, cards_y, card_w, Inches(0.08), color)

        # Titulo card
        add_text_box(slide, left + Inches(0.2), cards_y + Inches(0.2),
                     card_w - Inches(0.4), Inches(0.6),
                     titulo, font_size=14, bold=True, color=color)

        # Items
        tb = slide.shapes.add_textbox(left + Inches(0.2), cards_y + Inches(0.85),
                                       card_w - Inches(0.4), Inches(3.5))
        tf = tb.text_frame
        tf.word_wrap = True
        for j, item in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            run = p.add_run()
            run.text = item
            run.font.size = Pt(11)
            run.font.color.rgb = INK
            run.font.name = "Calibri"
            p.space_after = Pt(5)

    add_footer(slide, "Marian (Scrum Master) - 25s")
    add_page_num(slide, 2)


# ===========================================================================
# SLIDE 3 - QR + DEMO EN VIVO
# ===========================================================================
def slide_3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "DEMO EN VIVO")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Escanea el QR y pruebalo en tu celular",
                 font_size=28, bold=True, color=INK)

    # QR a la izquierda
    if QR_IMG.exists():
        slide.shapes.add_picture(str(QR_IMG), Inches(0.8), Inches(2.0),
                                  width=Inches(4.5), height=Inches(4.5))
    else:
        add_rect(slide, Inches(0.8), Inches(2.0), Inches(4.5), Inches(4.5), MIST,
                  line_color=TEAL)
        add_text_box(slide, Inches(0.8), Inches(4.0), Inches(4.5), Inches(0.6),
                     "[QR Code]", font_size=20, bold=True, color=TEAL,
                     align=PP_ALIGN.CENTER)

    # URL debajo del QR
    add_text_box(slide, Inches(0.8), Inches(6.7), Inches(4.5), Inches(0.3),
                 "helios-web-production.up.railway.app",
                 font_size=10, color=INK_MUTED, align=PP_ALIGN.CENTER)

    # Pasos del demo a la derecha
    pasos = [
        ("1.", "Registrate con un correo nuevo (ej: prueba@gmail.com)"),
        ("2.", "Elige especialidad y sede"),
        ("3.", "Selecciona medico de la lista"),
        ("4.", "Elige horario en el calendario"),
        ("5.", "Confirma con tu cedula panamena"),
        ("6.", "Recibe tu codigo de cita unico"),
    ]
    y_start = Inches(2.0)
    for i, (num, paso) in enumerate(pasos):
        y = y_start + Inches(0.6) * i
        # Numero en circulo
        circle = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                         Inches(5.8), y, Inches(0.45), Inches(0.45))
        circle.fill.solid()
        circle.fill.fore_color.rgb = TEAL
        circle.line.fill.background()
        circle.shadow.inherit = False
        tf = circle.text_frame
        tf.margin_left = Pt(0)
        tf.margin_right = Pt(0)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = num.replace(".", "")
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = WHITE
        # Texto del paso
        add_text_box(slide, Inches(6.45), y + Inches(0.05),
                     Inches(6.5), Inches(0.5),
                     paso, font_size=14, color=INK)

    add_footer(slide, "Ashley (QA) - 35s - Demo en vivo")
    add_page_num(slide, 3)


# ===========================================================================
# SLIDE 4 - QUE HIZO CADA UNO INDIVIDUALMENTE (NUEVO)
# ===========================================================================
def slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "QUE HIZO CADA UNO")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Aporte individual de cada integrante",
                 font_size=28, bold=True, color=INK)

    # 5 cards horizontales
    integrantes = [
        ("Jose Brown", "Product Owner", [
            "Validacion de cada deploy real",
            "Deteccion 8 bugs criticos en uso",
            "Lidero las 4 iteraciones del B-20",
            "Priorizo backlog del sprint",
        ], TEAL),
        ("Marian Barba", "Scrum Master / DevOps", [
            "Setup inicial del proyecto",
            "Deploys CI/CD a Railway (26 commits)",
            "Configuracion 5 agentes IA",
            "Coordinacion ceremonias Scrum",
        ], TEAL_DARK),
        ("Ethan Gonzalez", "Dev Frontend", [
            "Componentes React + TypeScript",
            "Fix B-05 (toolbar) y B-08 (hooks)",
            "Vista mobile del calendario",
            "Integracion con Supabase Auth",
        ], TEAL_LIGHT),
        ("Alejandro Saenz", "Tech Lead", [
            "Arquitectura Supabase + RLS",
            "Funcion SQL crear_cita_atomica",
            "Fix B-09 (seguridad sessionStorage)",
            "Decisiones tecnicas del sprint",
        ], ACCENT),
        ("Ashley Martinez", "QA Engineer", [
            "Pruebas funcionales del wizard",
            "Documentacion de metricas (6 commits)",
            "Casos de prueba para el demo",
            "Calculo tasa defectos 8.70 bugs/KLOC",
        ], AMBER),
    ]

    card_w = Inches(2.43)
    card_h = Inches(4.5)
    gap = Inches(0.10)
    left_start = Inches(0.4)
    y = Inches(2.0)

    for i, (nombre, rol, items, color) in enumerate(integrantes):
        left = left_start + (card_w + gap) * i
        # Card
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False

        # Header del color
        add_rect(slide, left, y, card_w, Inches(0.9), color)

        # Nombre
        add_text_box(slide, left + Inches(0.1), y + Inches(0.1),
                     card_w - Inches(0.2), Inches(0.4),
                     nombre, font_size=13, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        # Rol
        add_text_box(slide, left + Inches(0.1), y + Inches(0.45),
                     card_w - Inches(0.2), Inches(0.4),
                     rol, font_size=10, color=WHITE,
                     align=PP_ALIGN.CENTER)

        # Items
        tb = slide.shapes.add_textbox(left + Inches(0.15), y + Inches(1.05),
                                       card_w - Inches(0.3), Inches(3.3))
        tf = tb.text_frame
        tf.word_wrap = True
        for j, item in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            run = p.add_run()
            run.text = "- " + item
            run.font.size = Pt(9)
            run.font.color.rgb = INK
            run.font.name = "Calibri"
            p.space_after = Pt(6)

    add_footer(slide, "Jose (PO) - 25s - Quien hizo que")
    add_page_num(slide, 4)


# ===========================================================================
# SLIDE 5 - DIAGRAMA DE FLUJO DEL USUARIO (NUEVO)
# ===========================================================================
def slide_5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "FLUJO DEL USUARIO")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Como navega un paciente / medico por el sistema",
                 font_size=28, bold=True, color=INK)

    # Diagrama en el centro
    if FLUJO_IMG.exists():
        # Calculamos tamano para que quepa centrado
        slide.shapes.add_picture(str(FLUJO_IMG),
                                  Inches(3.5), Inches(1.9),
                                  height=Inches(5.0))
    else:
        add_text_box(slide, Inches(0.5), Inches(3.5), Inches(12.5), Inches(0.5),
                     "[Diagrama de flujo del usuario]",
                     font_size=18, color=TEAL, align=PP_ALIGN.CENTER)

    # Leyenda lateral
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(2.8), Inches(0.4),
                 "Rutas principales:", font_size=12, bold=True, color=INK)
    leyenda = [
        ("Paciente nuevo:", "Registro -> Login -> Agendar"),
        ("Paciente existe:", "Login -> Agendar / Mis Citas"),
        ("Medico:", "Login -> Dashboard agenda hoy"),
        ("Race React fix:", "INSERT en useAuth listener"),
    ]
    for i, (k, v) in enumerate(leyenda):
        y = Inches(2.5) + Inches(0.8) * i
        add_text_box(slide, Inches(0.5), y, Inches(2.8), Inches(0.3),
                     k, font_size=11, bold=True, color=TEAL_DARK)
        add_text_box(slide, Inches(0.5), y + Inches(0.3), Inches(2.8), Inches(0.4),
                     v, font_size=10, color=INK_MUTED)

    add_footer(slide, "Jose (PO) - 25s - Mostrar diagrama")
    add_page_num(slide, 5)


# ===========================================================================
# SLIDE 6 - METRICAS ISTQB (sin TMMi+TQM)
# ===========================================================================
def slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "METRICAS ISTQB")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Lo que medimos segun el estandar internacional",
                 font_size=28, bold=True, color=INK)

    # 4 cuadrantes grandes
    metricas = [
        ("65", "Tests automatizados",
         "Vitest + RTL. Todos pasan.\nThreshold 60% activo en CI.", TEAL),
        ("61.4%", "Cobertura de codigo",
         "Statements 61.4% - Functions 90.9%.\nBuild falla si baja de 60%.", TEAL_LIGHT),
        ("300 ms", "Latencia P95",
         "Locust con 200 usuarios concurrentes.\nMeta era 2s. Lo superamos 6.6x.", ACCENT),
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

        # Card
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = color
        card.line.width = Pt(1.5)
        card.shadow.inherit = False

        # Numero grande
        add_text_box(slide, left + Inches(0.2), y + Inches(0.2),
                     Inches(2.0), Inches(1.5),
                     num, font_size=48, bold=True, color=color)

        # Titulo a la derecha
        add_text_box(slide, left + Inches(2.4), y + Inches(0.3),
                     card_w - Inches(2.6), Inches(0.5),
                     titulo, font_size=18, bold=True, color=INK)

        # Descripcion
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
            run.font.name = "Calibri"

    add_footer(slide, "Jose (PO) - 25s - Solo ISTQB (recomendacion profesora)")
    add_page_num(slide, 6)


# ===========================================================================
# SLIDE 7 - SONARCLOUD LIVE DEMO (NUEVO)
# ===========================================================================
def slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "SONARCLOUD LIVE", color=RED)
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Analisis de calidad y seguridad en vivo",
                 font_size=28, bold=True, color=INK)

    # Bloque grande tipo "demo en vivo"
    # Izquierda: que vamos a mostrar
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "Vamos a abrir SonarCloud y mostrar:",
                 font_size=16, bold=True, color=TEAL_DARK)

    items_demo = [
        ("Bugs detectados", "Issues que SonarCloud encontro automaticamente"),
        ("Code smells", "Patrones que podrian causar problemas"),
        ("Vulnerabilidades", "Problemas de seguridad detectados"),
        ("Coverage", "% de codigo cubierto por nuestros tests"),
        ("Duplication", "Codigo duplicado que se debe refactorizar"),
        ("Quality Gate", "Pasa o falla el threshold de calidad"),
    ]
    for i, (k, v) in enumerate(items_demo):
        y = Inches(2.7) + Inches(0.55) * i
        # Bullet teal
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

    # Derecha: caja "abriremos en vivo"
    box_left = Inches(7.0)
    box_top = Inches(2.0)
    box_w = Inches(5.8)
    box_h = Inches(4.8)

    add_rect(slide, box_left, box_top, box_w, box_h, INK, line_color=TEAL)

    # Logo/texto SonarCloud
    add_text_box(slide, box_left, box_top + Inches(0.5), box_w, Inches(0.6),
                 "SonarCloud", font_size=32, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)

    # URL del proyecto
    add_text_box(slide, box_left, box_top + Inches(1.2), box_w, Inches(0.4),
                 "sonarcloud.io/project/overview?id=MarianC-programing_Helios",
                 font_size=9, color=ACCENT, align=PP_ALIGN.CENTER)

    # Box destacado
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

    add_footer(slide, "Ashley + Jose - 35s - SonarCloud en vivo")
    add_page_num(slide, 7)


# ===========================================================================
# SLIDE 8 - HERRAMIENTAS + KANBAN + CIERRE
# ===========================================================================
def slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)

    add_chip(slide, Inches(0.5), Inches(0.4), "CIERRE")
    add_text_box(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.7),
                 "Herramientas + Kanban + Preguntas",
                 font_size=28, bold=True, color=INK)

    # Izquierda: Herramientas
    add_text_box(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(0.5),
                 "7 herramientas usadas", font_size=16, bold=True, color=TEAL_DARK)

    herramientas = [
        ("GitHub", "Repositorio + 80+ commits"),
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
        # Card columna
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                       left, col_y, col_w, col_h)
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(2)
        card.shadow.inherit = False
        # Header
        add_rect(slide, left, col_y, col_w, Inches(0.5), color)
        add_text_box(slide, left, col_y + Inches(0.08), col_w, Inches(0.4),
                     titulo, font_size=12, bold=True, color=WHITE,
                     align=PP_ALIGN.CENTER)
        # Descripcion
        add_text_box(slide, left + Inches(0.1), col_y + Inches(0.7),
                     col_w - Inches(0.2), Inches(2.2),
                     desc, font_size=10, color=INK, align=PP_ALIGN.CENTER)

    # Cierre grande
    add_rect(slide, Inches(0.5), Inches(6.0), Inches(12.5), Inches(0.9), TEAL_DARK)
    add_text_box(slide, Inches(0.5), Inches(6.05), Inches(12.5), Inches(0.45),
                 "MVP funcional - Metricas medidas - Proceso documentado",
                 font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text_box(slide, Inches(0.5), Inches(6.5), Inches(12.5), Inches(0.4),
                 "Gracias. Preguntas?",
                 font_size=14, color=ACCENT, align=PP_ALIGN.CENTER)

    add_footer(slide, "Jose - 10s - Cierre + preguntas")
    add_page_num(slide, 8)


# ===========================================================================
# CONVERSION A PDF VIA POWERPOINT
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
        deck.SaveAs(str(pdf.absolute()), 32)  # PpFormat.ppSaveAsPDF
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
    # 16:9 aspect ratio
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
    else:
        print("[warn] PDF no se genero (PowerPoint no disponible)")


if __name__ == "__main__":
    main()
