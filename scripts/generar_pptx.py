"""Genera la mini-presentacion Daily Scrum del Sprint 1 — Semana 2.

Estilo: similar al Plan de Recuperación Parcial 1 (teal, fondo claro, sans serif).
Output: dailys/Daily_S2_Sprint1_HELIOS.pptx
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dailys" / "Daily_S2_Sprint1_HELIOS.pptx"
OUT.parent.mkdir(parents=True, exist_ok=True)

# Paleta HELIOS (consistente con Parcial 1)
TEAL = RGBColor(0x0A, 0x84, 0x78)
TEAL_DARK = RGBColor(0x0A, 0x4F, 0x6B)
TEAL_LIGHT = RGBColor(0x1F, 0xA8, 0x9B)
ACCENT = RGBColor(0x3D, 0xDC, 0x97)
INK = RGBColor(0x0F, 0x2A, 0x36)
INK_MUTED = RGBColor(0x4A, 0x6B, 0x7A)
MIST = RGBColor(0xF4, 0xF7, 0xF8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
AMBER = RGBColor(0xCA, 0x8A, 0x04)
RED = RGBColor(0xB9, 0x1C, 0x1C)


def set_slide_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_textbox(slide, left, top, width, height, text, *,
                size=14, bold=False, color=INK, align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(0)
    tf.margin_top = tf.margin_bottom = Emu(0)
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font
    return box


def add_bullets(slide, left, top, width, height, items, *,
                size=12, color=INK, font="Calibri"):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(0)
    tf.margin_top = tf.margin_bottom = Emu(0)
    for idx, item in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(4)
        marker = item.get("marker", "•")
        text = item["text"]
        run_marker = p.add_run()
        run_marker.text = f"{marker}  "
        run_marker.font.size = Pt(size)
        run_marker.font.bold = True
        run_marker.font.color.rgb = item.get("marker_color", TEAL)
        run_marker.font.name = font
        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.color.rgb = item.get("color", color)
        run.font.name = font
    return box


def add_rect(slide, left, top, width, height, fill_color, line_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line_color
    shape.shadow.inherit = False
    return shape


def add_pill(slide, left, top, width, height, text, fill, text_color):
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    pill.fill.solid()
    pill.fill.fore_color.rgb = fill
    pill.line.fill.background()
    pill.adjustments[0] = 0.5
    tf = pill.text_frame
    tf.margin_left = Emu(0)
    tf.margin_right = Emu(0)
    tf.margin_top = Emu(0)
    tf.margin_bottom = Emu(0)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = text_color
    run.font.name = "Calibri"
    return pill


def add_section_header(slide, label):
    add_textbox(
        slide,
        Inches(0.5),
        Inches(0.4),
        Inches(12),
        Inches(0.3),
        label.upper(),
        size=11,
        bold=True,
        color=TEAL,
    )


def add_slide_number(slide, num, total):
    add_textbox(
        slide,
        Inches(12.4),
        Inches(0.4),
        Inches(0.8),
        Inches(0.3),
        f"P{num}",
        size=11,
        bold=True,
        color=TEAL,
        align=PP_ALIGN.RIGHT,
    )
    add_textbox(
        slide,
        Inches(12.4),
        Inches(7.2),
        Inches(0.8),
        Inches(0.3),
        f"{num} / {total}",
        size=9,
        color=INK_MUTED,
        align=PP_ALIGN.RIGHT,
    )


def add_footer(slide):
    add_textbox(
        slide,
        Inches(0.5),
        Inches(7.2),
        Inches(8),
        Inches(0.3),
        "HELIOS — Daily Scrum Semana 2 · Sprint 1 — UTP Calidad de Software · 2026",
        size=9,
        color=INK_MUTED,
    )


# -------------------------------------------------------------------------
# Construccion
# -------------------------------------------------------------------------
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

TOTAL = 5

blank_layout = prs.slide_layouts[6]  # layout en blanco


# ===== Slide 1: PORTADA =====
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, TEAL_DARK)

# Adornos
add_rect(slide, Inches(11), Inches(-1), Inches(4), Inches(4), TEAL_LIGHT)
add_rect(slide, Inches(10.5), Inches(5.5), Inches(4), Inches(3), TEAL)

add_textbox(
    slide,
    Inches(0.7),
    Inches(0.6),
    Inches(10),
    Inches(0.4),
    "UTP · CALIDAD DE SOFTWARE · PARCIAL 2 · UNIDAD II",
    size=12,
    bold=True,
    color=ACCENT,
)

add_textbox(
    slide,
    Inches(0.7),
    Inches(1.3),
    Inches(11.5),
    Inches(1.5),
    "Daily Scrum — Semana 2",
    size=44,
    bold=True,
    color=WHITE,
)
add_textbox(
    slide,
    Inches(0.7),
    Inches(2.4),
    Inches(11.5),
    Inches(1.2),
    "Sprint 1 · Agendamiento de Citas",
    size=32,
    bold=True,
    color=WHITE,
)
add_textbox(
    slide,
    Inches(0.7),
    Inches(3.5),
    Inches(11.5),
    Inches(0.6),
    "Avance semanal · ISTQB · TMMi · TQM aplicados a HELIOS",
    size=18,
    color=ACCENT,
)

# Linea decorativa
add_rect(slide, Inches(0.7), Inches(4.4), Inches(0.4), Inches(0.05), ACCENT)

add_textbox(
    slide,
    Inches(0.7),
    Inches(4.6),
    Inches(5),
    Inches(0.4),
    "Equipo Grupo HELIOS",
    size=14,
    bold=True,
    color=WHITE,
)
add_textbox(
    slide,
    Inches(0.7),
    Inches(5.0),
    Inches(11.5),
    Inches(0.5),
    "José Brown · Ethan Gonzalez · Alejandro Saenz · Ashley Martinez · Marian Barba",
    size=14,
    color=WHITE,
)

add_textbox(
    slide,
    Inches(0.7),
    Inches(6.7),
    Inches(7),
    Inches(0.4),
    f"Universidad Tecnológica de Panamá · {date.today().strftime('%d de %B de %Y')}",
    size=11,
    color=ACCENT,
)


# ===== Slide 2: ¿Qué hicimos esta semana? =====
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, MIST)
add_section_header(slide, "Pregunta 1 — Avance del Sprint")
add_slide_number(slide, 2, TOTAL)

add_textbox(
    slide,
    Inches(0.5),
    Inches(0.8),
    Inches(12),
    Inches(0.8),
    "¿Qué hicimos esta semana?",
    size=32,
    bold=True,
    color=TEAL_DARK,
)
add_textbox(
    slide,
    Inches(0.5),
    Inches(1.7),
    Inches(12),
    Inches(0.4),
    "Pasamos de Sprint 0 (documentación) a producto funcional desplegado",
    size=14,
    color=INK_MUTED,
)

# Columna izquierda: Infraestructura (reducida para dejar espacio al QR)
col_left = Inches(0.5)
col_right = Inches(5.3)
col_w = Inches(4.7)
col_top = Inches(2.3)

add_rect(slide, col_left, col_top, col_w, Inches(0.06), TEAL)
add_textbox(
    slide,
    col_left,
    Inches(2.45),
    col_w,
    Inches(0.4),
    "INFRAESTRUCTURA",
    size=12,
    bold=True,
    color=TEAL,
)
add_bullets(
    slide,
    col_left,
    Inches(2.9),
    col_w,
    Inches(2.5),
    [
        {"marker": "✓", "text": "Schema PostgreSQL ejecutado en Supabase (7 tablas + RLS + RPC atómica)"},
        {"marker": "✓", "text": "Supabase Auth habilitado con email/password"},
        {"marker": "✓", "text": "Frontend Vite + React 19 + TS 6 conectado a Supabase"},
        {"marker": "✓", "text": "Deploy en Railway con dominio público"},
        {"marker": "✓", "text": "Tablero Jira HELL actualizado · Sprint 1 en progreso"},
    ],
    size=12,
)

# Columna derecha: Features
add_rect(slide, col_right, col_top, col_w, Inches(0.06), ACCENT)
add_textbox(
    slide,
    col_right,
    Inches(2.45),
    col_w,
    Inches(0.4),
    "FEATURES IMPLEMENTADAS",
    size=12,
    bold=True,
    color=TEAL,
)
add_bullets(
    slide,
    col_right,
    Inches(2.9),
    col_w,
    Inches(2.5),
    [
        {"marker": "✓", "text": "US-01 · Selector Especialidad + Sede"},
        {"marker": "✓", "text": "US-02 · Lista de médicos filtrada"},
        {"marker": "✓", "text": "US-03 · Calendario con horarios reales (FullCalendar)"},
        {"marker": "✓", "text": "US-04 · Formulario de confirmación + código de cita"},
        {"marker": "✓", "text": "US-05 · Página Mis Citas con joins a Supabase"},
        {"marker": "✓", "text": "Auth: Registro + Login + Protección de rutas"},
    ],
    size=12,
)

# Bloque QR + URL Railway (esquina derecha)
qr_path = ROOT / "dailys" / "qr_helios_demo.png"
if qr_path.exists():
    slide.shapes.add_picture(
        str(qr_path), Inches(10.5), Inches(2.3), width=Inches(2.3), height=Inches(2.3),
    )
    add_textbox(slide, Inches(10.5), Inches(4.65), Inches(2.3), Inches(0.3),
                "Escanea el QR", size=10, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(10.5), Inches(4.95), Inches(2.3), Inches(0.3),
                "helios-web-production", size=8, color=INK_MUTED, align=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(10.5), Inches(5.18), Inches(2.3), Inches(0.3),
                ".up.railway.app", size=8, color=INK_MUTED, align=PP_ALIGN.CENTER)

# Barra inferior con stats reales
bar_top = Inches(5.7)
bar_h = Inches(1.1)
add_rect(slide, Inches(0.5), bar_top, Inches(12.3), bar_h, WHITE)
add_rect(slide, Inches(0.5), bar_top, Inches(0.1), bar_h, TEAL)

stats = [
    ("32", "archivos TS/TSX"),
    ("39", "tests pasando"),
    ("65%", "cobertura stmts"),
    ("2,700", "horarios en BD"),
    ("5/5", "US implementadas"),
]
stat_w = Inches(2.4)
stat_left = Inches(0.8)
for i, (val, lbl) in enumerate(stats):
    x = stat_left + stat_w * i
    add_textbox(slide, x, bar_top + Inches(0.18), stat_w, Inches(0.5),
                val, size=24, bold=True, color=TEAL)
    add_textbox(slide, x, bar_top + Inches(0.7), stat_w, Inches(0.4),
                lbl, size=10, color=INK_MUTED)

add_footer(slide)


# ===== Slide 3: ¿Qué haremos próxima semana? =====
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, MIST)
add_section_header(slide, "Pregunta 2 — Planificación")
add_slide_number(slide, 3, TOTAL)

add_textbox(
    slide,
    Inches(0.5),
    Inches(0.8),
    Inches(12),
    Inches(0.8),
    "¿Qué haremos la próxima semana?",
    size=32,
    bold=True,
    color=TEAL_DARK,
)
add_textbox(
    slide,
    Inches(0.5),
    Inches(1.7),
    Inches(12),
    Inches(0.4),
    "Semana del 1 al 7 de junio · cierre Sprint 1: 11 de junio",
    size=14,
    color=INK_MUTED,
)

# 3 columnas: ALTA, MEDIA, BAJA
prios = [
    ("PRIORIDAD ALTA", TEAL, [
        ("HU-02", "Agenda médico en Realtime — Alejandro"),
        ("RLS", "Endurecer políticas por rol — Alejandro"),
        ("TESTS", "Subir cobertura a 70%+ — Ashley"),
        ("UX", "Aplicar cuestionario SUS — Ashley"),
    ]),
    ("PRIORIDAD MEDIA", TEAL_LIGHT, [
        ("SONAR", "Ejecutar pasada SonarCloud — Ethan"),
        ("TIPOS", "Codegen Supabase tipos TS — Ethan"),
        ("CARGA", "Locust 1000 usuarios — Ashley"),
        ("CI/CD", "GitHub Actions con tests + Sonar — Marian"),
    ]),
    ("PRIORIDAD BAJA", ACCENT, [
        ("EMAIL", "Notificaciones Supabase Edge — Alejandro"),
        ("PWA", "Instalable en móvil — Ethan"),
        ("LOGS", "Telemetría / Supabase logs — Marian"),
        ("DEMO", "Pulir copy y diseño — José"),
    ]),
]

col_top = Inches(2.4)
col_w = Inches(4.0)
gap = Inches(0.2)
col_left = Inches(0.5)
for i, (titulo, color, items) in enumerate(prios):
    x = col_left + (col_w + gap) * i
    add_rect(slide, x, col_top, col_w, Inches(0.55), color)
    add_textbox(slide, x + Inches(0.2), col_top + Inches(0.13), col_w, Inches(0.4),
                titulo, size=12, bold=True, color=WHITE)
    add_rect(slide, x, col_top + Inches(0.55), col_w, Inches(3.8), WHITE)
    y = col_top + Inches(0.75)
    for tag, txt in items:
        add_pill(slide, x + Inches(0.2), y, Inches(0.8), Inches(0.3), tag, color, WHITE)
        add_textbox(slide, x + Inches(1.05), y - Inches(0.02), col_w - Inches(1.1), Inches(0.4),
                    txt, size=11, color=INK)
        y += Inches(0.55)

# Cierre del sprint
add_rect(slide, Inches(0.5), Inches(6.6), Inches(12.3), Inches(0.45), TEAL_DARK)
add_textbox(slide, Inches(0.7), Inches(6.67), Inches(12), Inches(0.4),
            "Sprint 1 cierra el 11 de junio · próximo demo a la profesora · siguiente módulo: Cancelación y Reprogramación",
            size=12, bold=True, color=WHITE)

add_footer(slide)


# ===== Slide 4: Bloqueos =====
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, MIST)
add_section_header(slide, "Pregunta 3 — Bloqueos y mitigaciones")
add_slide_number(slide, 4, TOTAL)

add_textbox(
    slide,
    Inches(0.5),
    Inches(0.8),
    Inches(12),
    Inches(0.8),
    "¿Qué problemas tuvimos?",
    size=32,
    bold=True,
    color=TEAL_DARK,
)
add_textbox(
    slide,
    Inches(0.5),
    Inches(1.7),
    Inches(12),
    Inches(0.4),
    "Bloqueos identificados durante la semana y cómo los resolvimos",
    size=14,
    color=INK_MUTED,
)

blockers = [
    ("RESUELTO", ACCENT, "Stack muy nuevo (React 19.2 + TS 6 + Vite 8)",
     "TypeScript falla con tipos genéricos en cliente Supabase",
     "Mitigación: cliente sin tipado genérico para Sprint 1 + ticket de codegen para Sprint 2."),
    ("RESUELTO", ACCENT, "Validación de cédula panameña rechazaba PE-12-345",
     "El regex inicial era demasiado estricto",
     "Mitigación: simplificada a '5-12 dígitos tras quitar prefijo y guiones' + 7 casos de prueba."),
    ("RESUELTO", ACCENT, "Vitest 4 mock hoisting con variables externas",
     "Tests fallaban con 'Cannot access X before initialization'",
     "Mitigación: usar vi.hoisted() para variables compartidas entre mock y test."),
    ("EN CURSO", AMBER, "RLS permisivo en Sprint 1",
     "Política USING (true) permite ver datos de otros pacientes",
     "Mitigación: documentado como deuda técnica conocida. Primer ticket del Sprint 2."),
    ("PENDIENTE", RED, "Métrica P95 de Locust aún no medida en deploy",
     "Solo medido en local; falta correr contra Railway",
     "Mitigación: Ashley correrá Locust el martes y agregará el reporte HTML."),
]

y = Inches(2.4)
row_h = Inches(0.85)
for badge, badge_color, titulo, problema, mitigacion in blockers:
    # tarjeta
    add_rect(slide, Inches(0.5), y, Inches(12.3), row_h - Inches(0.1), WHITE)
    add_rect(slide, Inches(0.5), y, Inches(0.1), row_h - Inches(0.1), badge_color)
    # badge
    add_pill(slide, Inches(0.75), y + Inches(0.12), Inches(1.1), Inches(0.3), badge, badge_color, WHITE)
    # titulo
    add_textbox(slide, Inches(2.0), y + Inches(0.08), Inches(10.5), Inches(0.35),
                titulo, size=12, bold=True, color=INK)
    # problema y mitigacion en una linea
    add_textbox(slide, Inches(2.0), y + Inches(0.4), Inches(10.5), Inches(0.3),
                problema, size=10, color=INK_MUTED)
    add_textbox(slide, Inches(2.0), y + Inches(0.6), Inches(10.5), Inches(0.3),
                "→ " + mitigacion, size=10, color=TEAL)
    y += row_h

add_footer(slide)


# ===== Slide 5: Métricas Unidad II =====
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, MIST)
add_section_header(slide, "Aplicación de la Unidad II — ISTQB · TMMi · TQM")
add_slide_number(slide, 5, TOTAL)

add_textbox(
    slide,
    Inches(0.5),
    Inches(0.8),
    Inches(12),
    Inches(0.7),
    "Métricas Sprint 1 — Semana 2",
    size=28,
    bold=True,
    color=TEAL_DARK,
)
add_textbox(
    slide,
    Inches(0.5),
    Inches(1.55),
    Inches(12),
    Inches(0.4),
    "Cada métrica está alineada con un marco de calidad de la Unidad II",
    size=13,
    color=INK_MUTED,
)

# Tabla de metricas
table_left = Inches(0.5)
table_top = Inches(2.1)
table_w = Inches(12.3)
header_h = Inches(0.4)
row_h = Inches(0.35)

rows = [
    ("Requerimientos", "Cobertura US con criterios", "100% (5/5)", "Notion + Obsidian", "ISTQB · TMMi"),
    ("Requerimientos", "Trazabilidad US→BD→Comp→Test", "5/5", "Matriz manual", "TMMi Nivel 3"),
    ("Requerimientos", "Volatilidad", "0 cambios mid-sprint", "Backlog Jira", "TQM"),
    ("Diseño", "Tablas BD vs documentadas", "7/7 (100%)", "Supabase + Obsidian", "ISO/IEC 25010"),
    ("Diseño", "Componentes con SRP", "9/9", "Code review", "TMMi"),
    ("Código", "Cobertura statements (Vitest)", "65.26%  (≥ 60% target)", "Vitest v8", "ISTQB"),
    ("Código", "Cobertura branches", "53.71%  (≥ 50% target)", "Vitest v8", "ISTQB"),
    ("Código", "Cobertura lines / functions", "81.72% / 89.28%", "Vitest v8", "ISTQB"),
    ("Código", "Tests automatizados pasando", "39/39 (100%)", "Vitest", "TMMi"),
    ("Código", "Vulnerabilidades críticas", "0 (pendiente confirmar SonarCloud)", "SonarCloud", "ISTQB"),
    ("Clásicas (Pressman)", "KLOC del Sprint", "≈ 1.4 KLOC", "cloc / SonarCloud", "Pressman"),
    ("Clásicas (Pressman)", "Productividad", "0.28 KLOC/persona", "Cálculo manual", "Pressman"),
    ("Proceso", "Ciclo de medición Goal→Metric→Acción", "Documentado en este daily", "Daily Scrum semanal", "TQM mejora continua"),
]

# Header
headers = ["Categoría", "Métrica", "Valor real medido", "Herramienta", "Marco"]
col_widths = [Inches(2.0), Inches(3.5), Inches(2.8), Inches(2.2), Inches(1.8)]

add_rect(slide, table_left, table_top, table_w, header_h, TEAL_DARK)
x = table_left
for i, h in enumerate(headers):
    add_textbox(slide, x + Inches(0.1), table_top + Inches(0.08), col_widths[i] - Inches(0.1),
                Inches(0.3), h, size=11, bold=True, color=WHITE)
    x += col_widths[i]

# Rows
y = table_top + header_h
for idx, row in enumerate(rows):
    row_color = WHITE if idx % 2 == 0 else RGBColor(0xEC, 0xF2, 0xF4)
    add_rect(slide, table_left, y, table_w, row_h, row_color)
    x = table_left
    for i, cell in enumerate(row):
        col_color = TEAL if i == 0 or i == 4 else INK
        bold = i == 0 or i == 4
        size = 9
        add_textbox(slide, x + Inches(0.1), y + Inches(0.06), col_widths[i] - Inches(0.1),
                    Inches(0.3), cell, size=size, bold=bold, color=col_color)
        x += col_widths[i]
    y += row_h

# Pie del slide
add_rect(slide, Inches(0.5), Inches(7.05), Inches(12.3), Inches(0.32), TEAL_DARK)
add_textbox(slide, Inches(0.7), Inches(7.08), Inches(12), Inches(0.3),
            "Marcos aplicados: ISTQB Foundation 2018 · TMMi (medición y control) · TQM (mejora continua) · ISO/IEC 25010 · Pressman (2010)",
            size=10, bold=True, color=WHITE)


# -------------------------------------------------------------------------
prs.save(str(OUT))
print(f"OK: {OUT}")
print(f"Tamano: {OUT.stat().st_size / 1024:.1f} KB · slides: {TOTAL}")
