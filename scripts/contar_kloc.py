"""Cuenta KLOC reales del proyecto HELIOS.

Cuenta lineas no vacias que NO empiezan con comentario (//, /*, *, #).
Excluye node_modules, coverage, dist, archivos de test.

Uso:
    python scripts/contar_kloc.py

Salida: KLOC por categoria (producto, tests, scripts, SQL) y total.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


DIRS_EXCLUIDOS = ("node_modules", "coverage", "dist", "__pycache__")
COMENTARIOS_CODIGO = ("//", "/*", "*", "#")
COMENTARIOS_TESTS = ("//", "/*", "*")


def _debe_omitir(f: Path, excluir_tests: bool) -> bool:
    """True si el archivo no debe contarse (test o carpeta excluida)."""
    if excluir_tests and ".test." in f.name:
        return True
    return any(skip in str(f) for skip in DIRS_EXCLUIDOS)


def _contar_lineas(contenido: str, prefijos_comentario: tuple[str, ...]) -> tuple[int, int]:
    """Devuelve (total_lineas, lineas_codigo) de un texto."""
    total = 0
    codigo = 0
    for linea in contenido.splitlines():
        total += 1
        limpia = linea.strip()
        if limpia and not limpia.startswith(prefijos_comentario):
            codigo += 1
    return total, codigo


def cuenta_lineas_utiles(path: Path, extensiones: tuple[str, ...], excluir_tests: bool = True) -> tuple[int, int, int]:
    """Devuelve (total_lineas, lineas_codigo, archivos)."""
    total = 0
    codigo = 0
    archivos = 0
    if not path.exists():
        return 0, 0, 0
    for ext in extensiones:
        for f in path.rglob(f"*{ext}"):
            if _debe_omitir(f, excluir_tests):
                continue
            archivos += 1
            try:
                contenido = f.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            t, c = _contar_lineas(contenido, COMENTARIOS_CODIGO)
            total += t
            codigo += c
    return total, codigo, archivos


def cuenta_solo_tests(path: Path) -> tuple[int, int, int]:
    total = 0
    codigo = 0
    archivos = 0
    if not path.exists():
        return 0, 0, 0
    for f in path.rglob("*.test.*"):
        archivos += 1
        try:
            contenido = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        t, c = _contar_lineas(contenido, COMENTARIOS_TESTS)
        total += t
        codigo += c
    return total, codigo, archivos


def main() -> None:
    print("=" * 60)
    print("CONTEO DE LINEAS DE CODIGO — Proyecto HELIOS Sprint 1")
    print("=" * 60)

    frontend = ROOT / "frontend" / "src"
    scripts = ROOT / "scripts"
    supabase = ROOT / "supabase"

    t1, c1, f1 = cuenta_lineas_utiles(frontend, (".ts", ".tsx"))
    print(f"\nFrontend TS/TSX (sin tests): {f1:>3} archivos | {t1:>5} totales | {c1:>5} codigo")

    t2, c2, f2 = cuenta_solo_tests(frontend)
    print(f"Tests Vitest:                {f2:>3} archivos | {t2:>5} totales | {c2:>5} codigo")

    t3, c3, f3 = cuenta_lineas_utiles(scripts, (".py",))
    print(f"Scripts Python:              {f3:>3} archivos | {t3:>5} totales | {c3:>5} codigo")

    t4, c4, f4 = cuenta_lineas_utiles(supabase, (".sql",))
    print(f"SQL schema:                  {f4:>3} archivos | {t4:>5} totales | {c4:>5} codigo")

    total_producto = c1 + c4
    total_apoyo = c2 + c3
    total_general = total_producto + total_apoyo

    print()
    print("-" * 60)
    print("PRODUCTO (frontend + SQL):", end=" ")
    print(f"{total_producto:>5} lineas = {total_producto / 1000:.2f} KLOC")
    print("Apoyo (tests + scripts): ", end=" ")
    print(f"{total_apoyo:>5} lineas = {total_apoyo / 1000:.2f} KLOC")
    print("TOTAL REPO:              ", end=" ")
    print(f"{total_general:>5} lineas = {total_general / 1000:.2f} KLOC")
    print("=" * 60)

    print(f"\nMetrica para el slide 6: PRODUCTO = {total_producto / 1000:.2f} KLOC")
    productividad = (total_producto / 1000) / 5
    print(f"Productividad (5 personas): {productividad:.3f} KLOC/persona/sprint")
    tasa_defectos = 3 / (total_producto / 1000)
    print(f"Tasa defectos (3 bugs detectados): {tasa_defectos:.2f} bugs/KLOC")


if __name__ == "__main__":
    main()
