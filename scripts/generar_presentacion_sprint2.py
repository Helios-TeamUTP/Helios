"""Genera la presentacion de Sprint 2 (Cancelacion y Reprogramacion) en PPTX+PDF.

5 minutos, 8 slides, dividido por integrante (como Sprint 1):
- Marian (Scrum Master): portada + Daily Scrum (slides 1-2, ~50s)
- Ashley (QA): demo en vivo cancelar + reprogramar (slide 3, ~60s)
- Jose (PO): bugs B-21..B-26 (slide 4, ~50s)
- Ethan (Frontend) + Alejandro (Tech Lead): cancelar/reprogramar (slide 5, ~60s)
- Alejandro (Tech Lead): seguridad B-26 (slide 6, ~35s)
- Jose (PO): metricas (slide 7, ~40s) + cierre (slide 8, ~25s)

Output:
    dailys/Entrega_Viernes/HELIOS_Sprint2.pptx
    dailys/Entrega_Viernes/HELIOS_Sprint2_diapositivas.pdf
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
OUT_PPTX = OUT_DIR / "HELIOS_Sprint2.pptx"
OUT_PDF = OUT_DIR / "HELIOS_Sprint2_diapositivas.pdf"
QR_IMG = ROOT / "dailys" / "qr_helios_demo.png"
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

TOTAL = 10
FLUJO_IMG = OUT_DIR / "diagrama_flujo_usuario.png"
ARQUI_IMG = OUT_DIR / "diagrama_arquitectura.png"


def tb(slide, l, t, w, h, text, *, size=14, bold=False, color=INK,
       align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = "Calibri"
    return box


def rect(slide, l, t, w, h, color, *, line=None):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = color
    if line:
        s.line.color.rgb = line
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    return s


def chip(slide, l, t, text, color=TEAL, w=1.8):
    c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, Inches(w), Inches(0.35))
    c.fill.solid()
    c.fill.fore_color.rgb = color
    c.line.fill.background()
    c.shadow.inherit = False
    p = c.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = WHITE
    return c


def foot(slide, text, n):
    tb(slide, Inches(0.4), Inches(7.05), Inches(9), Inches(0.3), text, size=9, color=INK_MUTED)
    tb(slide, Inches(12.0), Inches(7.05), Inches(1), Inches(0.3), f"{n} / {TOTAL}",
       size=9, color=INK_MUTED, align=PP_ALIGN.RIGHT)


def bullets(slide, l, t, w, h, items, *, size=11, color=INK):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run()
        r.text = "•  " + it
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.font.name = "Calibri"
        p.space_after = Pt(5)


def title(slide, chip_text, h1, *, chip_color=TEAL, chip_w=1.8):
    rect(slide, 0, 0, prs.slide_width, prs.slide_height, WHITE)
    chip(slide, Inches(0.5), Inches(0.4), chip_text, color=chip_color, w=chip_w)
    tb(slide, Inches(0.5), Inches(0.9), Inches(12.5), Inches(0.8), h1, size=27, bold=True, color=INK)


# === SLIDE 1: Portada ===
def s1():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    rect(slide, 0, 0, prs.slide_width, prs.slide_height, MIST)
    rect(slide, 0, 0, Inches(0.4), prs.slide_height, TEAL)
    tb(slide, Inches(1.0), Inches(1.0), Inches(11), Inches(0.7), "HELIOS", size=44, bold=True, color=TEAL_DARK)
    tb(slide, Inches(1.0), Inches(1.7), Inches(11), Inches(0.4), "Sistema unificado de citas medicas", size=18, color=INK_MUTED)
    tb(slide, Inches(1.0), Inches(2.7), Inches(11.5), Inches(1.0), "Sprint 2 — Cancelacion y Reprogramacion", size=34, bold=True, color=INK)
    tb(slide, Inches(1.0), Inches(3.6), Inches(11.5), Inches(0.5), "+ 6 bugs resueltos · seguridad RLS reforzada · 117 tests", size=18, color=TEAL)
    tb(slide, Inches(1.0), Inches(4.8), Inches(11), Inches(0.4), "Grupo HELIOS", size=14, bold=True, color=INK)
    tb(slide, Inches(1.0), Inches(5.2), Inches(11.5), Inches(0.4), "Jose Brown (PO) · Ethan Gonzalez (Frontend) · Alejandro Saenz (Tech Lead)", size=12, color=INK_MUTED)
    tb(slide, Inches(1.0), Inches(5.55), Inches(11.5), Inches(0.4), "Ashley Martinez (QA) · Marian Barba (Scrum Master / DevOps)", size=12, color=INK_MUTED)
    tb(slide, Inches(1.0), Inches(6.5), Inches(11), Inches(0.4), "UTP · Calidad de Software · 2026 · Presentacion 5 minutos", size=11, color=INK_MUTED)
    tb(slide, Inches(12.0), Inches(7.05), Inches(1), Inches(0.3), f"1 / {TOTAL}", size=9, color=INK_MUTED, align=PP_ALIGN.RIGHT)


# === SLIDE 2: Daily Scrum ===
def s2():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "DAILY SCRUM", "Las 3 preguntas del Sprint 2")
    cols = [
        ("Que hicimos?", [
            "Cancelar cita (autoservicio)",
            "Reprogramar cita a otro horario",
            "Tabla de auditoria citas_historial",
            "6 bugs resueltos (B-21..B-26)",
            "Cerramos hueco de seguridad RLS",
        ], TEAL),
        ("Que sigue?", [
            "Sprint 3: Sincronizacion entre sedes",
            "Sprint 4: Notificaciones por email",
            "Sprint 5: Pruebas (OWASP ZAP +",
            "  Lighthouse) y cierre",
            "Mover chequeo cedula a RPC",
        ], TEAL_LIGHT),
        ("Bloqueos?", [
            "Bug critico de UNIQUE en cancelar",
            "  (lo detecto el code review)",
            "Resuelto: indice unico parcial",
            "Cero regresiones del Sprint 1",
            "Todo en produccion",
        ], AMBER),
    ]
    cy = Inches(1.9)
    cw = Inches(4.1)
    gap = Inches(0.1)
    for i, (t_, items, color) in enumerate(cols):
        left = Inches(0.45) + (cw + gap) * i
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, cy, cw, Inches(4.6))
        card.fill.solid()
        card.fill.fore_color.rgb = MIST
        card.line.color.rgb = color
        card.line.width = Pt(2)
        card.shadow.inherit = False
        rect(slide, left, cy, cw, Inches(0.08), color)
        tb(slide, left + Inches(0.2), cy + Inches(0.2), cw - Inches(0.4), Inches(0.5), t_, size=15, bold=True, color=color)
        bullets(slide, left + Inches(0.2), cy + Inches(0.85), cw - Inches(0.4), Inches(3.6), items, size=11)
    foot(slide, "Marian (Scrum Master) — 40s", 2)


# === SLIDE 3: Demo en vivo ===
def s3():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "DEMO EN VIVO", "Cancelar y reprogramar una cita", chip_color=RED, chip_w=1.7)
    if QR_IMG.exists():
        slide.shapes.add_picture(str(QR_IMG), Inches(0.8), Inches(2.0), width=Inches(4.3), height=Inches(4.3))
    tb(slide, Inches(0.8), Inches(6.5), Inches(4.3), Inches(0.3), "helios-web-production.up.railway.app", size=10, color=INK_MUTED, align=PP_ALIGN.CENTER)
    pasos = [
        ("1.", "Inicia sesion y ve a 'Mis Citas'"),
        ("2.", "En una cita confirmada: Cancelar o Reprogramar"),
        ("3.", "Cancelar -> confirma -> queda 'Cancelada'"),
        ("4.", "El horario se libera para otros pacientes"),
        ("5.", "Reprogramar -> elige otra hora del calendario"),
        ("6.", "La cita se mueve, sin perder el codigo"),
    ]
    for i, (n, p) in enumerate(pasos):
        y = Inches(2.0) + Inches(0.7) * i
        circ = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.7), y, Inches(0.5), Inches(0.5))
        circ.fill.solid()
        circ.fill.fore_color.rgb = TEAL
        circ.line.fill.background()
        circ.shadow.inherit = False
        pp = circ.text_frame.paragraphs[0]
        pp.alignment = PP_ALIGN.CENTER
        rr = pp.add_run()
        rr.text = n.replace(".", "")
        rr.font.size = Pt(15)
        rr.font.bold = True
        rr.font.color.rgb = WHITE
        tb(slide, Inches(6.4), y + Inches(0.06), Inches(6.6), Inches(0.5), p, size=14, color=INK)
    foot(slide, "Ashley (QA) — 60s — Demo en vivo", 3)


# === SLIDE 4: Bugs resueltos ===
def s4():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "BUGS RESUELTOS", "6 bugs arreglados en Sprint 2", chip_color=RED, chip_w=2.0)
    bugs = [
        ("B-21", "Calendario desfasaba la hora (zona horaria)", "Vista de botones timezone-safe; se quito FullCalendar (bundle -34%)"),
        ("B-22", "Cedula rechazaba tipos validos (PE-5-687)", "Soporta 5 tipos panameños + ejemplos + deteccion de tipo"),
        ("B-23", "Sin doble confirmacion", "Confirmar cedula y contraseña deben coincidir"),
        ("B-24", "Sin validar telefono/nombre/correo", "Validaciones que rechazan datos basura"),
        ("B-25", "Dejaba agendar horas ya pasadas de hoy", "Filtra slots vencidos del dia actual"),
        ("B-26", "RLS permisiva: acceso a datos ajenos", "Cerrado el hueco sprint1_all en 7 tablas"),
    ]
    y = Inches(1.85)
    for i, (id_, prob, fix) in enumerate(bugs):
        ry = y + Inches(0.82) * i
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), ry, Inches(0.9), Inches(0.5))
        badge.fill.solid()
        badge.fill.fore_color.rgb = TEAL_DARK
        badge.line.fill.background()
        badge.shadow.inherit = False
        bp = badge.text_frame.paragraphs[0]
        bp.alignment = PP_ALIGN.CENTER
        br = bp.add_run()
        br.text = id_
        br.font.size = Pt(12)
        br.font.bold = True
        br.font.color.rgb = WHITE
        tb(slide, Inches(1.6), ry - Inches(0.02), Inches(5.6), Inches(0.5), prob, size=12, bold=True, color=INK)
        tb(slide, Inches(1.6), ry + Inches(0.36), Inches(11.2), Inches(0.45), fix, size=11, color=INK_MUTED)
    foot(slide, "Jose (PO) — 50s", 4)


# === SLIDE 5: Cancelar / Reprogramar (frontend | backend) ===
def s5():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "CANCELAR / REPROGRAMAR", "Como lo construimos", chip_w=2.5)

    # Izquierda: Frontend
    tb(slide, Inches(0.5), Inches(1.8), Inches(6.0), Inches(0.4), "FRONTEND (Ethan)", size=14, bold=True, color=TEAL_LIGHT)
    bullets(slide, Inches(0.6), Inches(2.3), Inches(6.0), Inches(4.4), [
        "Hooks useCancelarCita / useReprogramarCita",
        "Boton Cancelar con modal de confirmacion",
        "Modal Reprogramar que reusa el calendario",
        "  (vista de botones timezone-safe)",
        "MisCitas: badges por estado + botones solo",
        "  en citas confirmadas",
        "Dashboard medico: oculta canceladas de hoy",
        "Manejo de errores con mensaje claro",
    ], size=11)

    rect(slide, Inches(6.6), Inches(1.7), Inches(0.02), Inches(5.2), INK_MUTED)

    # Derecha: Backend
    tb(slide, Inches(7.0), Inches(1.8), Inches(6.0), Inches(0.4), "BACKEND / SQL (Alejandro)", size=14, bold=True, color=ACCENT)
    bullets(slide, Inches(7.1), Inches(2.3), Inches(6.0), Inches(4.4), [
        "cancelar_cita_atomica(cita): libera horario",
        "reprogramar_cita_atomica(cita, nuevo): swap",
        "Ambas SECURITY DEFINER: validan dueño",
        "FOR UPDATE: evita 2 pacientes mismo slot",
        "Tabla citas_historial + trigger (auditoria)",
        "Fix critico (code review): UNIQUE(horario_id)",
        "  -> indice unico PARCIAL (excluye canceladas)",
    ], size=11)
    foot(slide, "Ethan + Alejandro — 60s", 5)


# === SLIDE 6: Seguridad B-26 ===
def s6():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "SEGURIDAD", "B-26: cerramos un hueco real de RLS", chip_color=RED, chip_w=1.7)

    # Antes / Despues
    rect(slide, Inches(0.5), Inches(2.0), Inches(6.0), Inches(2.2), MIST, line=RED)
    tb(slide, Inches(0.7), Inches(2.1), Inches(5.6), Inches(0.4), "ANTES (vulnerable)", size=13, bold=True, color=RED)
    bullets(slide, Inches(0.7), Inches(2.55), Inches(5.6), Inches(1.6), [
        "Policy 'sprint1_all' permisiva en 7 tablas",
        "Cualquier usuario podia leer/modificar/",
        "  borrar datos de OTROS por la API",
        "B-14 agrego reglas estrictas pero no",
        "  borro la permisiva (se anulaban)",
    ], size=10, color=INK)

    rect(slide, Inches(6.8), Inches(2.0), Inches(6.0), Inches(2.2), MIST, line=GREEN_OK)
    tb(slide, Inches(7.0), Inches(2.1), Inches(5.6), Inches(0.4), "DESPUES (seguro)", size=13, bold=True, color=GREEN_OK)
    bullets(slide, Inches(7.0), Inches(2.55), Inches(5.6), Inches(1.6), [
        "Migracion transaccional: re-crea reglas",
        "  estrictas y LUEGO borra la permisiva",
        "Cada quien ve/edita SOLO lo suyo",
        "Sin romper nada (0 datos perdidos)",
        "Con rollback de emergencia incluido",
    ], size=10, color=INK)

    rect(slide, Inches(0.5), Inches(4.6), Inches(12.3), Inches(1.4), INK)
    tb(slide, Inches(0.7), Inches(4.75), Inches(11.9), Inches(0.4), "Importante: NO se borro ningun usuario, contraseña ni dato.", size=14, bold=True, color=WHITE)
    tb(slide, Inches(0.7), Inches(5.2), Inches(11.9), Inches(0.7), "Solo se cambiaron REGLAS de permiso (policies). auth.users intacto. Las cuentas de la demo siguen funcionando igual.", size=12, color=ACCENT)
    foot(slide, "Alejandro (Tech Lead) — 35s", 6)


# === SLIDE 7: Diagramas (avance del desarrollo) ===
def s7():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "DIAGRAMAS", "Flujo del usuario y arquitectura", chip_w=1.6)
    if FLUJO_IMG.exists():
        slide.shapes.add_picture(str(FLUJO_IMG), Inches(0.7), Inches(1.9), height=Inches(5.0))
    tb(slide, Inches(0.7), Inches(6.95), Inches(4.5), Inches(0.3), "Fig 1. Flujo paciente/medico", size=9, color=INK_MUTED)
    if ARQUI_IMG.exists():
        slide.shapes.add_picture(str(ARQUI_IMG), Inches(6.4), Inches(2.1), height=Inches(4.4))
    tb(slide, Inches(6.4), Inches(6.6), Inches(6.0), Inches(0.3), "Fig 2. Arquitectura: GitHub -> Railway -> React -> Supabase (RLS)", size=9, color=INK_MUTED)
    foot(slide, "Ethan / Alejandro — diagramas (evidencia)", 7)


# === SLIDE 8: Medicion Unidad II (ISTQB + TMMi + TQM) ===
def s8():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "MEDICION (UNIDAD II)", "ISTQB · TMMi · TQM", chip_w=2.1)

    # ISTQB (izquierda, 4 numeros)
    tb(slide, Inches(0.5), Inches(1.75), Inches(6.0), Inches(0.4), "ISTQB — metricas", size=13, bold=True, color=TEAL_DARK)
    mets = [("117", "tests pasan"), ("61.4%", "cobertura"), ("300 ms", "P95 200 users"), ("6/0", "bugs res./pend.")]
    for i, (num, lbl) in enumerate(mets):
        col = i % 2
        row = i // 2
        left = Inches(0.5) + Inches(3.0) * col
        yy = Inches(2.2) + Inches(1.25) * row
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, yy, Inches(2.85), Inches(1.1))
        card.fill.solid(); card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = TEAL; card.line.width = Pt(1.2); card.shadow.inherit = False
        tb(slide, left + Inches(0.15), yy + Inches(0.1), Inches(2.6), Inches(0.6), num, size=24, bold=True, color=TEAL)
        tb(slide, left + Inches(0.15), yy + Inches(0.7), Inches(2.6), Inches(0.35), lbl, size=10, color=INK_MUTED)

    rect(slide, Inches(6.6), Inches(1.7), Inches(0.02), Inches(5.2), INK_MUTED)

    # TMMi + TQM (derecha)
    tb(slide, Inches(7.0), Inches(1.75), Inches(6.0), Inches(0.4), "TMMi — madurez (Nivel 2)", size=13, bold=True, color=TEAL_DARK)
    bullets(slide, Inches(7.05), Inches(2.2), Inches(6.0), Inches(1.8), [
        "Metricas registradas por sprint",
        "Code review obligatorio antes de merge",
        "Threshold cobertura >=60% en CI",
        "Cada bug genera test de regresion",
    ], size=10.5)
    tb(slide, Inches(7.0), Inches(4.5), Inches(6.0), Inches(0.4), "TQM — mejora continua", size=13, bold=True, color=ACCENT)
    bullets(slide, Inches(7.05), Inches(4.95), Inches(6.0), Inches(1.8), [
        "PO prueba el deploy real antes de entregar",
        "Bugs de uso real se arreglan en la jornada",
        "Plan Mode antes de codificar; doc viva",
        "Bug critico cazado por review (antes de prod)",
    ], size=10.5)
    foot(slide, "Jose (PO) — ISTQB + TMMi + TQM", 8)


# === SLIDE 9: Registro de metricas + Herramientas + Kanban ===
def s9():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "REGISTRO", "Metricas + Herramientas + Kanban", chip_w=1.6)

    # Registro de metricas (izquierda)
    tb(slide, Inches(0.5), Inches(1.75), Inches(6.0), Inches(0.4), "Registro de metricas", size=13, bold=True, color=TEAL_DARK)
    reg = [
        ("Requerimientos", "HELL-3: cancelar + reprogramar 100%"),
        ("Diseno", "2 RPC SQL + 1 tabla + 4 hooks/comp."),
        ("Codigo", "~2.6 KLOC · 11 archivos · commits firmados"),
        ("Defectos", "6 detectados · 6 resueltos · 0 pend."),
        ("Esfuerzo", "ciclos <30 min/bug · ~2 sem"),
        ("Productividad", "~2 deploys/dia · bundle -34%"),
        ("Calidad", "117 tests · P95 300ms · RLS"),
    ]
    for i, (k, v) in enumerate(reg):
        y = Inches(2.25) + Inches(0.62) * i
        tb(slide, Inches(0.55), y, Inches(1.9), Inches(0.55), k, size=10.5, bold=True, color=INK)
        tb(slide, Inches(2.5), y, Inches(4.0), Inches(0.55), v, size=10, color=INK_MUTED)

    rect(slide, Inches(6.6), Inches(1.7), Inches(0.02), Inches(5.2), INK_MUTED)

    # Herramientas + Kanban (derecha)
    tb(slide, Inches(7.0), Inches(1.75), Inches(6.0), Inches(0.4), "Herramientas", size=13, bold=True, color=TEAL_DARK)
    bullets(slide, Inches(7.05), Inches(2.2), Inches(6.0), Inches(2.0), [
        "GitHub (commits firmados, code review)",
        "Jira (Kanban HELL-3 + 13 subtareas)",
        "Vitest + RTL (117 tests) · Locust (carga)",
        "Supabase (BD+Auth+RLS) · Railway (deploy)",
        "SonarCloud configurado (analisis estatico)",
    ], size=10.5)
    tb(slide, Inches(7.0), Inches(4.5), Inches(6.0), Inches(0.4), "Kanban HELL-3", size=13, bold=True, color=TEAL_DARK)
    bullets(slide, Inches(7.05), Inches(4.95), Inches(6.0), Inches(1.8), [
        "Done: 6 bugs + cancelar + reprogramar + historial",
        "In Progress: (sprint cerrado)",
        "To Do (Sprint 5): OWASP ZAP + Lighthouse",
    ], size=10.5)
    foot(slide, "Jose (PO) — registro + herramientas + Kanban", 9)


# === SLIDE 10: Cierre ===
def s10():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    title(slide, "CIERRE", "Sprint 2 completo")
    bullets(slide, Inches(0.6), Inches(2.0), Inches(12.0), Inches(3.0), [
        "Cancelar y reprogramar citas en produccion",
        "6 bugs resueltos (calendario, cedula, validaciones, seguridad)",
        "Auditoria de cambios con citas_historial",
        "Hueco de seguridad RLS cerrado (B-26)",
        "117 tests · build limpio · cero regresiones",
    ], size=15)
    rect(slide, Inches(0.5), Inches(5.4), Inches(12.3), Inches(1.2), TEAL_DARK)
    tb(slide, Inches(0.5), Inches(5.55), Inches(12.3), Inches(0.5), "Sprint 2 entregado. Siguiente: Sincronizacion entre sedes (Sprint 3).", size=15, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    tb(slide, Inches(0.5), Inches(6.05), Inches(12.3), Inches(0.4), "Gracias. Preguntas?", size=14, color=ACCENT, align=PP_ALIGN.CENTER)
    foot(slide, "Jose (PO) — cierre", 10)


def to_pdf(pptx, pdf):
    try:
        import comtypes.client
    except ImportError:
        return False
    app = None
    try:
        app = comtypes.client.CreateObject("PowerPoint.Application")
        app.Visible = 1
        deck = app.Presentations.Open(str(pptx.absolute()), WithWindow=False)
        deck.SaveAs(str(pdf.absolute()), 32)
        deck.Close()
        return True
    except Exception as e:
        print(f"[error] PowerPoint: {e}")
        return False
    finally:
        if app is not None:
            try:
                app.Quit()
            except Exception:
                pass


prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)


def main():
    s1(); s2(); s3(); s4(); s5(); s6(); s7(); s8(); s9(); s10()
    prs.save(str(OUT_PPTX))
    print(f"[ok] PPTX: {OUT_PPTX} ({OUT_PPTX.stat().st_size/1024:.1f} KB)")
    if to_pdf(OUT_PPTX, OUT_PDF):
        print(f"[ok] PDF: {OUT_PDF} ({OUT_PDF.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
