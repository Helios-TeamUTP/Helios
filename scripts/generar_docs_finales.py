"""Genera 3 PDFs individuales + 3 DOCX editables + 1 PDF combinado
de los documentos pedagogicos del Sprint 1.

Salida en: Sprint_1_Entrega/2_GUION_Y_DOCUMENTOS/
    PDF/
        01_Guion_Presentacion.pdf
        02_Glosario_HELIOS.pdf
        03_Metricas_Explicadas.pdf
        HELIOS_Documentos_Completos.pdf
    Word/
        01_Guion_Presentacion.docx
        02_Glosario_HELIOS.docx
        03_Metricas_Explicadas.docx
"""

from __future__ import annotations

import re
from pathlib import Path

import markdown2
from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Pt, RGBColor, Cm, Inches
from xhtml2pdf import pisa

ROOT = Path(__file__).resolve().parent.parent
# Sprint_1_Entrega esta junto a helios-repo (un nivel arriba del repo)
OUT_BASE = ROOT.parent / "Sprint_1_Entrega" / "2_GUION_Y_DOCUMENTOS"
OUT_PDF = OUT_BASE / "PDF"
OUT_DOCX = OUT_BASE / "Word"

OUT_PDF.mkdir(parents=True, exist_ok=True)
OUT_DOCX.mkdir(parents=True, exist_ok=True)

# Colores HELIOS (teal del Parcial 1)
TEAL = RGBColor(0x0A, 0x84, 0x78)
TEAL_DARK = RGBColor(0x0A, 0x4F, 0x6B)
INK = RGBColor(0x0F, 0x2A, 0x36)
INK_MUTED = RGBColor(0x4A, 0x6B, 0x7A)
ACCENT = RGBColor(0x3D, 0xDC, 0x97)

DOCS = [
    {
        "id": "01",
        "titulo": "Guion de Presentacion",
        "subtitulo": "Daily Scrum Sprint 1 - 5 minutos cronometrados",
        "md_path": ROOT / "docs" / "GUION_PRESENTACION_SPRINT1.md",
        "out_pdf": OUT_PDF / "01_Guion_Presentacion.pdf",
        "out_docx": OUT_DOCX / "01_Guion_Presentacion.docx",
    },
    {
        "id": "02",
        "titulo": "Glosario HELIOS",
        "subtitulo": "50+ terminos tecnicos explicados",
        "md_path": ROOT / "docs" / "GLOSARIO_HELIOS.md",
        "out_pdf": OUT_PDF / "02_Glosario_HELIOS.pdf",
        "out_docx": OUT_DOCX / "02_Glosario_HELIOS.docx",
    },
    {
        "id": "03",
        "titulo": "Metricas Explicadas",
        "subtitulo": "Como defender cada metrica del Sprint 1",
        "md_path": ROOT / "docs" / "METRICAS_EXPLICADAS.md",
        "out_pdf": OUT_PDF / "03_Metricas_Explicadas.pdf",
        "out_docx": OUT_DOCX / "03_Metricas_Explicadas.docx",
    },
]

# =========================================================================
# CSS para PDFs (estilo coherente con las diapositivas)
# =========================================================================
CSS = """
@page {
    size: letter portrait;
    margin: 2cm 1.8cm;
}
body {
    font-family: 'Helvetica', sans-serif;
    color: #0F2A36;
    font-size: 10pt;
    line-height: 1.55;
}
h1 {
    color: #0A4F6B;
    border-bottom: 3px solid #0A8478;
    padding-bottom: 6px;
    font-size: 18pt;
    margin-top: 4px;
}
h2 {
    color: #0A8478;
    font-size: 13pt;
    margin-top: 18px;
    border-bottom: 1px solid #0A8478;
    padding-bottom: 3px;
}
h3 {
    color: #0A4F6B;
    font-size: 11pt;
    margin-top: 12px;
}
h4 {
    color: #0A8478;
    font-size: 10pt;
    margin-top: 10px;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 9pt;
}
th {
    background: #0A8478;
    color: white;
    padding: 6px 8px;
    text-align: left;
    border: 1px solid #066F66;
}
td {
    padding: 5px 8px;
    border: 1px solid #ddd;
    vertical-align: top;
}
tr:nth-child(even) td { background: #F4F7F8; }
code {
    background: #ECF2F4;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    color: #066F66;
}
pre {
    background: #F4F7F8;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
    font-size: 8pt;
}
blockquote {
    border-left: 4px solid #0A8478;
    margin: 10px 0;
    padding: 5px 12px;
    background: #ECF2F4;
    font-style: italic;
    color: #4A6B7A;
}
ul, ol {
    margin: 4px 0 10px 16px;
}
li {
    margin: 3px 0;
}
.cover {
    text-align: center;
    page-break-after: always;
    padding-top: 5cm;
}
.cover h1 {
    border: none;
    color: #0A4F6B;
    font-size: 32pt;
}
.cover h2 {
    border: none;
    color: #0A8478;
    font-size: 16pt;
    font-weight: normal;
    margin-top: 0;
}
.cover-meta {
    margin-top: 4cm;
    color: #4A6B7A;
    font-size: 11pt;
}
strong { color: #0A4F6B; }
"""


def build_cover(titulo: str, subtitulo: str) -> str:
    return f"""
<div class="cover">
    <h1>HELIOS</h1>
    <h2>Sistema Unificado de Citas Medicas</h2>
    <br><br><br>
    <h2 style="color: #0F2A36; font-weight: bold;">{titulo}</h2>
    <p style="color: #0A8478; font-size: 12pt;">{subtitulo}</p>
    <div class="cover-meta">
        <p><strong>Equipo Grupo HELIOS</strong></p>
        <p>Jose Brown - Ethan Gonzalez - Alejandro Saenz<br>
           Ashley Martinez - Marian Barba</p>
        <p style="margin-top: 2cm;">
            Universidad Tecnologica de Panama<br>
            Calidad de Software - 2026
        </p>
    </div>
</div>
"""


def generate_pdf_individual(doc: dict) -> None:
    """PDF individual con portada estilizada."""
    md_content = doc["md_path"].read_text(encoding="utf-8")
    html_body = markdown2.markdown(
        md_content,
        extras=["tables", "fenced-code-blocks", "header-ids", "break-on-newline"],
    )
    cover = build_cover(doc["titulo"], doc["subtitulo"])
    final_html = f"""
<html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
{cover}
{html_body}
</body></html>
"""
    with open(doc["out_pdf"], "wb") as f:
        result = pisa.CreatePDF(final_html, dest=f, encoding="utf-8")
    if result.err:
        print(f"  [error] {doc['out_pdf'].name}: {result.err} errores")
    else:
        size_kb = doc["out_pdf"].stat().st_size / 1024
        print(f"  [ok] {doc['out_pdf'].name} ({size_kb:.1f} KB)")


# =========================================================================
# DOCX: convierte markdown a DOCX con estilos HELIOS
# =========================================================================
def set_cell_bg(cell, color_hex: str) -> None:
    """Set background color of a docx table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    tc_pr.append(shd)


def add_heading_styled(doc: Document, text: str, level: int) -> None:
    """Heading con colores HELIOS."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12 if level == 1 else 8)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        run.font.size = Pt(20)
        run.font.color.rgb = TEAL_DARK
    elif level == 2:
        run.font.size = Pt(15)
        run.font.color.rgb = TEAL
    elif level == 3:
        run.font.size = Pt(12)
        run.font.color.rgb = TEAL_DARK
    else:
        run.font.size = Pt(11)
        run.font.color.rgb = TEAL
    run.font.name = "Calibri"


def add_paragraph_styled(doc: Document, text: str) -> None:
    """Parrafo con texto plano formateado (negritas con **)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    # Parse inline bold and code
    parts = re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", text)
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            run = p.add_run(part[2:-2])
            run.bold = True
            run.font.color.rgb = TEAL_DARK
            run.font.name = "Calibri"
            run.font.size = Pt(10)
        elif part.startswith("`") and part.endswith("`"):
            run = p.add_run(part[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(9)
            run.font.color.rgb = TEAL
        else:
            run = p.add_run(part)
            run.font.color.rgb = INK
            run.font.name = "Calibri"
            run.font.size = Pt(10)


def add_list_item(doc: Document, text: str, ordered: bool = False) -> None:
    style = "List Number" if ordered else "List Bullet"
    try:
        p = doc.add_paragraph(style=style)
    except KeyError:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.8)
    parts = re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", text)
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            run = p.add_run(part[2:-2])
            run.bold = True
            run.font.color.rgb = TEAL_DARK
        elif part.startswith("`") and part.endswith("`"):
            run = p.add_run(part[1:-1])
            run.font.name = "Consolas"
            run.font.color.rgb = TEAL
            run.font.size = Pt(9)
        else:
            run = p.add_run(part)
            run.font.color.rgb = INK
        if not (part.startswith("`") and part.endswith("`")):
            run.font.name = "Calibri"
            run.font.size = Pt(10)


def add_table_from_md(doc: Document, lines: list[str]) -> None:
    """Convierte una tabla markdown a tabla DOCX con estilo."""
    # Header
    header_cells = [c.strip() for c in lines[0].strip("|").split("|")]
    # Skip separator line (lines[1])
    data_rows = lines[2:]

    table = doc.add_table(rows=1 + len(data_rows), cols=len(header_cells))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True

    # Header row
    hdr_row = table.rows[0]
    for i, cell_text in enumerate(header_cells):
        cell = hdr_row.cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(cell_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        set_cell_bg(cell, "0A8478")

    # Data rows
    for row_idx, line in enumerate(data_rows):
        cells_text = [c.strip() for c in line.strip("|").split("|")]
        for i, txt in enumerate(cells_text[: len(header_cells)]):
            cell = table.rows[row_idx + 1].cells[i]
            cell.text = ""
            p = cell.paragraphs[0]
            # Strip markdown formatting for table cells
            clean = txt.replace("**", "").replace("`", "")
            run = p.add_run(clean)
            run.font.color.rgb = INK
            run.font.name = "Calibri"
            run.font.size = Pt(9)
            if row_idx % 2 == 1:
                set_cell_bg(cell, "F4F7F8")

    doc.add_paragraph()


def generate_docx_individual(doc_meta: dict) -> None:
    """Convierte un markdown a DOCX manualmente, manteniendo estructura."""
    docx = Document()

    # Estilo base
    style = docx.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10)
    style.font.color.rgb = INK

    # Portada
    p_cover = docx.add_paragraph()
    p_cover.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_cover.paragraph_format.space_before = Pt(80)
    r = p_cover.add_run("HELIOS")
    r.font.size = Pt(36)
    r.font.bold = True
    r.font.color.rgb = TEAL_DARK
    r.font.name = "Calibri"

    p_sub = docx.add_paragraph()
    p_sub.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_sub.add_run("Sistema Unificado de Citas Medicas")
    r.font.size = Pt(16)
    r.font.color.rgb = TEAL
    r.font.name = "Calibri"

    docx.add_paragraph()
    docx.add_paragraph()

    p_t = docx.add_paragraph()
    p_t.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_t.add_run(doc_meta["titulo"])
    r.font.size = Pt(22)
    r.font.bold = True
    r.font.color.rgb = INK
    r.font.name = "Calibri"

    p_st = docx.add_paragraph()
    p_st.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_st.add_run(doc_meta["subtitulo"])
    r.font.size = Pt(12)
    r.font.italic = True
    r.font.color.rgb = INK_MUTED
    r.font.name = "Calibri"

    docx.add_paragraph()
    docx.add_paragraph()

    p_team = docx.add_paragraph()
    p_team.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_team.add_run("Equipo Grupo HELIOS")
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = TEAL
    r.font.name = "Calibri"

    p_names = docx.add_paragraph()
    p_names.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_names.add_run(
        "Jose Brown - Ethan Gonzalez - Alejandro Saenz - Ashley Martinez - Marian Barba"
    )
    r.font.size = Pt(10)
    r.font.color.rgb = INK_MUTED
    r.font.name = "Calibri"

    p_utp = docx.add_paragraph()
    p_utp.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    r = p_utp.add_run("Universidad Tecnologica de Panama - Calidad de Software 2026")
    r.font.size = Pt(10)
    r.font.color.rgb = INK_MUTED
    r.font.name = "Calibri"

    docx.add_page_break()

    # Procesar markdown
    md_lines = doc_meta["md_path"].read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(md_lines):
        line = md_lines[i]
        stripped = line.strip()

        # Saltar lineas vacias dobles
        if not stripped:
            i += 1
            continue

        # Headings
        if stripped.startswith("# "):
            add_heading_styled(docx, stripped[2:], 1)
        elif stripped.startswith("## "):
            add_heading_styled(docx, stripped[3:], 2)
        elif stripped.startswith("### "):
            add_heading_styled(docx, stripped[4:], 3)
        elif stripped.startswith("#### "):
            add_heading_styled(docx, stripped[5:], 4)

        # Tabla markdown
        elif stripped.startswith("|") and i + 1 < len(md_lines) and md_lines[i + 1].strip().startswith("|"):
            # Coleccionar lineas de tabla
            tbl_lines = []
            while i < len(md_lines) and md_lines[i].strip().startswith("|"):
                tbl_lines.append(md_lines[i])
                i += 1
            add_table_from_md(docx, tbl_lines)
            continue

        # Lista no ordenada
        elif stripped.startswith("- ") or stripped.startswith("* "):
            add_list_item(docx, stripped[2:], ordered=False)

        # Lista ordenada
        elif re.match(r"^\d+\.\s", stripped):
            add_list_item(docx, re.sub(r"^\d+\.\s", "", stripped), ordered=True)

        # Blockquote
        elif stripped.startswith("> "):
            p = docx.add_paragraph()
            p.paragraph_format.left_indent = Cm(1)
            r = p.add_run(stripped[2:])
            r.font.italic = True
            r.font.color.rgb = INK_MUTED
            r.font.name = "Calibri"
            r.font.size = Pt(10)

        # Separator
        elif stripped == "---":
            docx.add_paragraph()

        # Codigo
        elif stripped.startswith("```"):
            # Skip code block delimiters - just process content as code paragraph
            i += 1
            code_lines = []
            while i < len(md_lines) and not md_lines[i].strip().startswith("```"):
                code_lines.append(md_lines[i])
                i += 1
            if code_lines:
                p = docx.add_paragraph()
                r = p.add_run("\n".join(code_lines))
                r.font.name = "Consolas"
                r.font.size = Pt(8)
                r.font.color.rgb = TEAL
            i += 1
            continue

        # Parrafo normal
        else:
            add_paragraph_styled(docx, stripped)

        i += 1

    docx.save(doc_meta["out_docx"])
    size_kb = doc_meta["out_docx"].stat().st_size / 1024
    print(f"  [ok] {doc_meta['out_docx'].name} ({size_kb:.1f} KB)")


def main() -> None:
    print(f"[salida] {OUT_BASE}")
    print()
    print("[pdf] Generando PDFs individuales...")
    for doc in DOCS:
        generate_pdf_individual(doc)
    print()
    print("[docx] Generando DOCX editables...")
    for doc in DOCS:
        generate_docx_individual(doc)
    print()
    print("[ok] Todos los documentos generados.")


if __name__ == "__main__":
    main()
