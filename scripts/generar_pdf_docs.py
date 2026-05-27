"""Combina los 3 documentos markdown del equipo en UN solo PDF
para imprimir o compartir antes del viernes.

Documentos incluidos:
1. Guion de presentacion (5 min, cronometrado)
2. Glosario HELIOS (terminos tecnicos)
3. Metricas explicadas (defensa de cada metrica)

Uso:
    python scripts/generar_pdf_docs.py
"""

from __future__ import annotations

from pathlib import Path

import markdown2
from xhtml2pdf import pisa

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / "Sprint_1_Entrega" / "2_GUION_Y_DOCUMENTOS" / "PDF" / "HELIOS_Documentos_Completos.pdf"
DOCS = [
    ("GUION DE PRESENTACION", ROOT / "docs" / "GUION_PRESENTACION_SPRINT1.md"),
    ("METRICAS FACILES CON EJEMPLOS", ROOT / "docs" / "METRICAS_FACILES_CON_EJEMPLOS.md"),
    ("GLOSARIO HELIOS", ROOT / "docs" / "GLOSARIO_HELIOS.md"),
    ("METRICAS EXPLICADAS (TECNICO)", ROOT / "docs" / "METRICAS_EXPLICADAS.md"),
    ("FUENTE EXACTA DE CADA METRICA", ROOT / "docs" / "FUENTE_DE_METRICAS.md"),
]

CSS = """
@page {
    size: letter portrait;
    margin: 2cm 1.8cm 2cm 1.8cm;
    @frame footer {
        -pdf-frame-content: footerContent;
        bottom: 1cm;
        left: 1.8cm;
        height: 1cm;
        width: 17cm;
    }
}
body {
    font-family: 'Helvetica', sans-serif;
    color: #0F2A36;
    font-size: 10pt;
    line-height: 1.5;
}
h1 {
    color: #0A4F6B;
    border-bottom: 3px solid #0A8478;
    padding-bottom: 6px;
    font-size: 20pt;
    margin-top: 14px;
    page-break-before: always;
}
h1.first { page-break-before: avoid; }
h2 {
    color: #0A8478;
    font-size: 14pt;
    margin-top: 16px;
    border-bottom: 1px solid #0A8478;
    padding-bottom: 3px;
}
h3 {
    color: #0A4F6B;
    font-size: 11pt;
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
    overflow-x: auto;
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
    font-size: 28pt;
    page-break-before: avoid;
}
.cover h2 {
    border: none;
    color: #0A8478;
    font-size: 16pt;
    font-weight: normal;
}
.cover-meta {
    margin-top: 3cm;
    color: #4A6B7A;
    font-size: 11pt;
}
"""

# Portada del PDF
COVER_HTML = """
<div class="cover">
    <h1>HELIOS</h1>
    <h2>Sistema Unificado de Citas Médicas</h2>
    <br><br>
    <h2 style="color: #0F2A36;">Documentación del Sprint 1</h2>
    <p style="color: #0A8478; font-weight: bold; font-size: 12pt;">
        Para defender la presentación del viernes
    </p>
    <div class="cover-meta">
        <p><strong>Contenido:</strong></p>
        <p>1. Guion de presentación (5 minutos cronometrados)</p>
        <p>2. Glosario de términos técnicos</p>
        <p>3. Métricas explicadas con respuestas listas</p>
        <br>
        <p style="margin-top: 2cm;">
            Grupo HELIOS<br>
            José Brown · Ethan Gonzalez · Alejandro Saenz · Ashley Martinez · Marian Barba<br>
            <br>
            Universidad Tecnológica de Panamá<br>
            Calidad de Software · 2026
        </p>
    </div>
</div>
"""


def main() -> None:
    html_parts = ['<html><head><meta charset="utf-8"></head><body>']
    html_parts.append(COVER_HTML)

    for idx, (titulo, path) in enumerate(DOCS):
        if not path.exists():
            print(f"[advertencia] Falta {path}")
            continue
        md_content = path.read_text(encoding="utf-8")
        html_doc = markdown2.markdown(
            md_content,
            extras=["tables", "fenced-code-blocks", "header-ids", "break-on-newline"],
        )
        first_h1 = ' class="first"' if idx == 0 else ""
        html_parts.append(f'<h1{first_h1}>Sección {idx + 1} — {titulo}</h1>')
        html_parts.append(html_doc)

    html_parts.append("</body></html>")
    final_html = (
        f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
        + "".join(html_parts[1:])  # quita el body opener duplicado
    )

    print(f"[pdf] Generando {OUT.name}...")
    with open(OUT, "wb") as f:
        result = pisa.CreatePDF(final_html, dest=f, encoding="utf-8")

    if result.err:
        print(f"[error] Fallo con {result.err} errores")
    else:
        size_kb = OUT.stat().st_size / 1024
        print(f"[ok] PDF generado: {OUT}")
        print(f"[ok] Tamano: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
