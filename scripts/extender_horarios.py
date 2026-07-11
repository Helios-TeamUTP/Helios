"""HELIOS — Extender horarios futuros (seguro, solo INSERT)

Problema que resuelve:
    La tabla `horarios` se sembro una sola vez con una ventana fija de
    14 dias desde la fecha en que corrio seed_data.py. El tiempo real
    ya alcanzo esa fecha limite, asi que no quedan horarios futuros
    para agendar - la app muestra "sin horarios disponibles" para
    cualquier medico, en cualquier sede, a partir de manana.

Por que NO se debe volver a correr seed_data.py para arreglar esto:
    seed_data.py BORRA y RECREA medicos desde cero (reset_tables()).
    historial_clinico.medico_id tiene ON DELETE CASCADE -> borrar
    medicos borraria en cascada TODO el historial clinico real que
    ya se construyo (dolencias, recetas). Ademas se perderian los
    vinculos de auth_medico_link (logins de medicos demo).

Que hace este script en cambio:
    1. Lee los medicos EXISTENTES (no crea ninguno nuevo).
    2. Para cada uno, genera horarios SOLO para los dias que faltan
       (desde el dia siguiente al ultimo horario existente, hasta
       completar `--dias` dias laborales hacia adelante).
    3. Inserta esos horarios nuevos. No borra, no actualiza, no toca
       ninguna fila existente de ninguna tabla.

Uso:
    python scripts/extender_horarios.py                # 30 dias mas
    python scripts/extender_horarios.py --dias 60       # 60 dias mas
    python scripts/extender_horarios.py --dry-run       # solo simula, no inserta

Requiere las mismas variables que seed_data.py:
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=ey...   # obligatorio, RLS de horarios exige autenticacion
"""

from __future__ import annotations

import argparse
import os
from datetime import date, datetime, time, timedelta
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "frontend" / ".env.local")
load_dotenv(ROOT / "scripts" / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n"
        "Este script necesita service_role para insertar horarios sin\n"
        "chocar con la politica RLS que exige usuario autenticado."
    )

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def slots_para_medico(medico_id: str, desde: date, hasta: date) -> list[dict]:
    """Genera slots de 20 min, 7am-4pm, solo dias laborales (lun-vie),
    en el rango [desde, hasta] inclusive. Mismo patron que seed_data.py
    para que se vea consistente con los horarios ya existentes."""
    slots = []
    fecha = desde
    while fecha <= hasta:
        if fecha.weekday() < 5:  # 0=lunes .. 4=viernes
            for hora in range(7, 16):
                for minuto in (0, 20, 40):
                    inicio = time(hora, minuto)
                    fin_total_min = hora * 60 + minuto + 20
                    fin = time(fin_total_min // 60, fin_total_min % 60)
                    slots.append(
                        {
                            "medico_id": medico_id,
                            "fecha": fecha.isoformat(),
                            "hora_inicio": inicio.isoformat(),
                            "hora_fin": fin.isoformat(),
                            "disponible": True,
                        }
                    )
        fecha += timedelta(days=1)
    return slots


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dias", type=int, default=30, help="Dias hacia adelante a cubrir (default 30)")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar que se haria, sin insertar")
    args = parser.parse_args()

    start = datetime.now()
    print(f"[extender_horarios] HELIOS — {start.isoformat()}")
    print(f"[extender_horarios] Target: {SUPABASE_URL}")
    print(f"[extender_horarios] Modo: {'DRY RUN (sin insertar)' if args.dry_run else 'REAL'}")
    print()

    # 1. Medicos existentes (NO se crea ninguno nuevo)
    medicos_res = client.table("medicos").select("id, nombre").eq("activo", True).execute()
    medicos = medicos_res.data or []
    print(f"[medicos] {len(medicos)} medicos activos encontrados (se preservan tal cual).")
    if not medicos:
        raise SystemExit("No hay medicos en la BD - revisa la conexion antes de continuar.")

    # 2. Para cada medico, encontrar su ULTIMO horario existente
    #    y generar solo lo que falta desde el dia siguiente.
    hoy = date.today()
    tope = hoy + timedelta(days=args.dias)

    total_nuevos: list[dict] = []
    for medico in medicos:
        ultimo_res = (
            client.table("horarios")
            .select("fecha")
            .eq("medico_id", medico["id"])
            .order("fecha", desc=True)
            .limit(1)
            .execute()
        )
        if ultimo_res.data:
            ultima_fecha = date.fromisoformat(ultimo_res.data[0]["fecha"])
            desde = max(ultima_fecha + timedelta(days=1), hoy)
        else:
            # Medico sin ningun horario previo (poco probable, pero por si acaso)
            desde = hoy

        if desde > tope:
            continue  # este medico ya esta cubierto hasta la fecha tope

        nuevos = slots_para_medico(medico["id"], desde, tope)
        total_nuevos.extend(nuevos)
        print(f"[medicos]   {medico['nombre'][:40]:40s} -> +{len(nuevos):4d} slots ({desde} a {tope})")

    print()
    print(f"[horarios] Total de slots nuevos a insertar: {len(total_nuevos)}")

    if args.dry_run:
        print("[dry-run] No se inserto nada. Corre sin --dry-run para aplicar de verdad.")
        return

    if not total_nuevos:
        print("[horarios] Nada que insertar - todos los medicos ya estan cubiertos hasta la fecha tope.")
        return

    insertados = 0
    for i in range(0, len(total_nuevos), 500):
        chunk = total_nuevos[i : i + 500]
        client.table("horarios").insert(chunk).execute()
        insertados += len(chunk)
        print(f"[horarios]   {insertados}/{len(total_nuevos)} insertados")

    print()
    print("[resumen]")
    print(f"  medicos preservados (sin tocar):  {len(medicos)}")
    print(f"  horarios nuevos insertados:       {insertados}")
    print(f"  rango cubierto ahora:             hasta {tope}")
    print(f"  duracion total:                  {datetime.now() - start}")


if __name__ == "__main__":
    main()
