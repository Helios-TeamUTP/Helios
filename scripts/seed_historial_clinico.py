"""HELIOS Sprint 5 — Seed Historial Clínico

Script SEPARADO de seed_data.py — no lo toca, no lo reemplaza.

Hace dos cosas, en dos pasos claramente delimitados:

  PASO 1 — Transición de estado
    Citas con estado='confirmada' cuyo horario (fecha + hora_inicio)
    ya pasó respecto a la hora actual, se marcan como 'completada'.
    Simula lo que en producción haría un job automático: una cita
    pasada que nadie canceló se considera atendida.

  PASO 2 — Generación de historial clínico
    Para TODAS las citas con estado='completada' (las que ya estaban
    + las recién transicionadas en el Paso 1) que aún no tienen un
    registro en historial_clinico, genera una dolencia_principal y
    receta realistas, coherentes con la especialidad del médico.

Requiere las mismas variables de entorno que seed_data.py:
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=ey...   # obligatorio, no anon key

Uso:
    python scripts/seed_historial_clinico.py
    python scripts/seed_historial_clinico.py --solo-paso-1   # solo transición
    python scripts/seed_historial_clinico.py --solo-paso-2   # solo historial
"""

from __future__ import annotations

import argparse
import os
import random
from datetime import date, datetime
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
        "Este script SIEMPRE necesita service_role — modifica estado de citas\n"
        "reales e inserta historial clinico, RLS bloquearia con anon key."
    )

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
random.seed(7)

# ─── Motivos de consulta realistas por especialidad ─────────────────────────
# (dolencia_principal, receta_o_None)
MOTIVOS_POR_ESPECIALIDAD: dict[str, list[tuple[str, str | None]]] = {
    "Medicina General": [
        ("Cuadro gripal con congestion nasal y tos seca de 3 dias de evolucion",
         "Acetaminofen 500mg cada 8 horas por 5 dias + loratadina 10mg cada 24 horas"),
        ("Dolor abdominal difuso de 2 dias de evolucion, sin signos de alarma",
         "Butilhioscina 10mg cada 8 horas + dieta blanda por 3 dias"),
        ("Control de rutina, paciente asintomatico",
         None),
        ("Cefalea tensional recurrente asociada a estres laboral",
         "Ibuprofeno 400mg cada 8 horas segun dolor, maximo 3 dias"),
        ("Lumbalgia leve de origen postural",
         "Naproxeno 500mg cada 12 horas + reposo relativo por 2 dias"),
    ],
    "Pediatria": [
        ("Fiebre de 38.5 grados y tos productiva en menor de 5 anos",
         "Acetaminofen pediatrico segun peso cada 6 horas + control en 48h"),
        ("Control de crecimiento y desarrollo, sin hallazgos relevantes",
         None),
        ("Diarrea aguda sin signos de deshidratacion",
         "Suero de rehidratacion oral + dieta astringente por 3 dias"),
        ("Erupcion cutanea leve, probable dermatitis de contacto",
         "Hidrocortisona topica 1% cada 12 horas por 5 dias"),
        ("Dolor de garganta y decaimiento de 2 dias",
         "Amoxicilina suspension segun peso cada 8 horas por 7 dias"),
    ],
    "Cardiologia": [
        ("Dolor toracico atipico, sin datos de alarma en electrocardiograma",
         "Continuar tratamiento antihipertensivo habitual, control en 1 mes"),
        ("Control de hipertension arterial, cifras estables",
         "Losartan 50mg cada 24 horas, mantener dieta baja en sodio"),
        ("Palpitaciones ocasionales sin repercusion hemodinamica",
         "Holter de 24 horas ambulatorio, control con resultados"),
        ("Seguimiento post-infarto, evolucion favorable",
         "Continuar aspirina 100mg + atorvastatina 40mg, control en 3 meses"),
        ("Disnea leve al esfuerzo, en estudio",
         None),
    ],
    "Ginecologia": [
        ("Control ginecologico anual de rutina",
         None),
        ("Dolor pelvico leve asociado a ciclo menstrual",
         "Ibuprofeno 400mg cada 8 horas durante los primeros 3 dias del ciclo"),
        ("Control prenatal, embarazo de curso normal",
         "Acido folico 5mg + sulfato ferroso, continuar controles mensuales"),
        ("Flujo vaginal anormal, sospecha de infeccion leve",
         "Ovulos de clotrimazol por 7 noches, evitar relaciones durante tratamiento"),
        ("Irregularidad menstrual de 2 meses de evolucion",
         "Estudios hormonales solicitados, control con resultados"),
    ],
    "Traumatologia": [
        ("Dolor lumbar mecanico de 1 semana de evolucion",
         "Naproxeno 500mg cada 12 horas + reposo relativo por 3 dias"),
        ("Esguince de tobillo grado I",
         "Vendaje compresivo, hielo local, evitar carga de peso por 48 horas"),
        ("Control post-quirurgico de rodilla, buena evolucion",
         "Continuar fisioterapia 2 veces por semana"),
        ("Dolor en hombro al realizar movimientos de elevacion",
         "Diclofenaco topico cada 12 horas + ejercicios de rango de movimiento"),
        ("Contractura muscular cervical de origen postural",
         "Relajante muscular por 5 dias + calor local"),
    ],
}
MOTIVOS_GENERICOS = MOTIVOS_POR_ESPECIALIDAD["Medicina General"]


def paso1_transicionar_citas_vencidas() -> int:
    """Marca como 'completada' las citas 'confirmada' cuyo horario ya paso."""
    print("=" * 60)
    print("PASO 1 — Transicion de citas vencidas")
    print("=" * 60)

    res = (
        client.table("citas")
        .select("id, estado, horarios(fecha, hora_inicio)")
        .eq("estado", "confirmada")
        .execute()
    )
    citas = res.data or []
    print(f"[paso1] {len(citas)} citas en estado 'confirmada' encontradas.")

    ahora = datetime.now()
    ids_a_transicionar: list[str] = []

    for cita in citas:
        horario = cita.get("horarios")
        if not horario:
            continue  # sin horario asociado, no se puede evaluar fecha
        fecha_str = horario.get("fecha")
        hora_str = horario.get("hora_inicio")
        if not fecha_str or not hora_str:
            continue
        try:
            fecha_hora_cita = datetime.fromisoformat(f"{fecha_str}T{hora_str}")
        except ValueError:
            continue
        if fecha_hora_cita < ahora:
            ids_a_transicionar.append(cita["id"])

    print(f"[paso1] {len(ids_a_transicionar)} citas ya vencidas -> se marcan 'completada'.")

    if not ids_a_transicionar:
        print("[paso1] Nada que transicionar.")
        return 0

    for cita_id in ids_a_transicionar:
        client.table("citas").update({"estado": "completada"}).eq("id", cita_id).execute()

    print(f"[paso1]   {len(ids_a_transicionar)} citas actualizadas a 'completada'.")
    return len(ids_a_transicionar)


def paso2_generar_historial_clinico() -> int:
    """Genera dolencia_principal + receta para citas 'completada' sin historial."""
    print()
    print("=" * 60)
    print("PASO 2 — Generacion de historial clinico")
    print("=" * 60)

    citas_res = (
        client.table("citas")
        .select("id, paciente_id, medico_id")
        .eq("estado", "completada")
        .execute()
    )
    citas_completadas = citas_res.data or []
    print(f"[paso2] {len(citas_completadas)} citas 'completada' en total.")

    historial_res = client.table("historial_clinico").select("cita_id").execute()
    ids_con_historial = {h["cita_id"] for h in (historial_res.data or [])}
    print(f"[paso2] {len(ids_con_historial)} ya tienen historial clinico (se omiten).")

    medicos_res = client.table("medicos").select("id, especialidad_id").execute()
    medico_a_especialidad_id = {m["id"]: m["especialidad_id"] for m in (medicos_res.data or [])}

    esp_res = client.table("especialidades").select("id, nombre").execute()
    especialidad_id_a_nombre = {e["id"]: e["nombre"] for e in (esp_res.data or [])}

    pendientes = [c for c in citas_completadas if c["id"] not in ids_con_historial]
    print(f"[paso2] {len(pendientes)} citas requieren historial nuevo.")

    if not pendientes:
        print("[paso2] Nada que generar.")
        return 0

    creados = 0
    for cita in pendientes:
        especialidad_id = medico_a_especialidad_id.get(cita["medico_id"])
        especialidad_nombre = especialidad_id_a_nombre.get(especialidad_id, "")
        opciones = MOTIVOS_POR_ESPECIALIDAD.get(especialidad_nombre, MOTIVOS_GENERICOS)
        dolencia, receta = random.choice(opciones)

        client.table("historial_clinico").insert(
            {
                "cita_id": cita["id"],
                "paciente_id": cita["paciente_id"],
                "medico_id": cita["medico_id"],
                "dolencia_principal": dolencia,
                "receta": receta,
            }
        ).execute()
        creados += 1

    print(f"[paso2]   {creados} registros de historial_clinico creados.")
    return creados


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--solo-paso-1", action="store_true")
    parser.add_argument("--solo-paso-2", action="store_true")
    args = parser.parse_args()

    start = datetime.now()
    print(f"[seed_historial] HELIOS — {start.isoformat()}")
    print(f"[seed_historial] Target: {SUPABASE_URL}")
    print()

    transicionadas = 0
    creados = 0

    if not args.solo_paso_2:
        transicionadas = paso1_transicionar_citas_vencidas()
    if not args.solo_paso_1:
        creados = paso2_generar_historial_clinico()

    print()
    print("[resumen]")
    print(f"  citas transicionadas a completada: {transicionadas}")
    print(f"  registros historial_clinico creados: {creados}")
    print(f"  duracion total: {datetime.now() - start}")


if __name__ == "__main__":
    main()
