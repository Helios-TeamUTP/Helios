"""HELIOS Sprint 1 — Seed Data

Inserta datos de prueba en Supabase para que el wizard de agendamiento
tenga contenido visible: 3 sedes, 5 especialidades, 10 medicos,
30 slots/medico x 14 dias laborales, 20 pacientes con citas.

Uso:
    python scripts/seed_data.py

Requiere variables de entorno (en .env en raiz del repo o exportadas):
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=ey...        # NO el anon key; necesitamos service_role para bypass RLS
"""

from __future__ import annotations

import os
import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "frontend" / ".env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "VITE_SUPABASE_ANON_KEY"
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (o VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."
    )

if "service_role" not in SUPABASE_KEY and "SUPABASE_SERVICE_ROLE_KEY" not in os.environ:
    print(
        "[advertencia] Usando anon key. Si RLS bloquea inserts, exporta SUPABASE_SERVICE_ROLE_KEY."
    )

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
faker = Faker("es_PA")
random.seed(42)
Faker.seed(42)

SEDES = [
    {"nombre": "Policlinica Central", "ciudad": "Panama", "direccion": "Av. Justo Arosemena, Calidonia", "capacidad_diaria": 300},
    {"nombre": "Policlinica San Miguelito", "ciudad": "San Miguelito", "direccion": "Via Transistmica, San Isidro", "capacidad_diaria": 250},
    {"nombre": "Policlinica Colon", "ciudad": "Colon", "direccion": "Calle 9, Cristobal", "capacidad_diaria": 200},
]

ESPECIALIDADES = [
    {"nombre": "Medicina General", "descripcion": "Consulta de primer nivel"},
    {"nombre": "Pediatria", "descripcion": "Atencion infantil de 0 a 14 anos"},
    {"nombre": "Cardiologia", "descripcion": "Evaluacion y tratamiento cardiovascular"},
    {"nombre": "Ginecologia", "descripcion": "Salud femenina integral"},
    {"nombre": "Traumatologia", "descripcion": "Lesiones musculoesqueleticas"},
]


def reset_tables() -> None:
    print("[reset] Limpiando datos existentes...")
    # El orden importa por FKs
    for table in ["citas", "horarios", "auth_paciente_link", "pacientes", "medicos", "especialidades", "sedes"]:
        try:
            client.table(table).delete().neq("id" if table != "auth_paciente_link" else "auth_uid", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as exc:  # noqa: BLE001 - log y continua
            print(f"[reset]   {table}: {exc}")


def insert_sedes() -> list[dict]:
    print("[sedes] Insertando 3 sedes...")
    res = client.table("sedes").insert(SEDES).execute()
    return res.data


def insert_especialidades() -> list[dict]:
    print("[especialidades] Insertando 5 especialidades...")
    res = client.table("especialidades").insert(ESPECIALIDADES).execute()
    return res.data


def insert_medicos(sedes: list[dict], especialidades: list[dict]) -> list[dict]:
    print("[medicos] Insertando 10 medicos distribuidos entre sedes y especialidades...")
    medicos = []
    for _ in range(10):
        sede = random.choice(sedes)
        esp = random.choice(especialidades)
        medicos.append(
            {
                "nombre": faker.name(),
                "especialidad_id": esp["id"],
                "sede_id": sede["id"],
                "correo": faker.unique.email(),
                "telefono": faker.phone_number(),
                "activo": True,
            }
        )
    res = client.table("medicos").insert(medicos).execute()
    return res.data


def slots_para_medico(medico_id: str, dias: int = 14) -> list[dict]:
    slots = []
    hoy = date.today()
    for delta in range(dias):
        fecha = hoy + timedelta(days=delta)
        if fecha.weekday() >= 5:  # solo lunes-viernes
            continue
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
    return slots


def insert_horarios(medicos: list[dict]) -> list[dict]:
    print(f"[horarios] Generando slots para {len(medicos)} medicos...")
    total: list[dict] = []
    for medico in medicos:
        slots = slots_para_medico(medico["id"])
        total.extend(slots)
    # insertar en lotes de 500 para no exceder limites
    inserted: list[dict] = []
    for i in range(0, len(total), 500):
        chunk = total[i : i + 500]
        res = client.table("horarios").insert(chunk).execute()
        inserted.extend(res.data)
        print(f"[horarios]   {len(inserted)}/{len(total)} insertados")
    return inserted


def insert_pacientes() -> list[dict]:
    print("[pacientes] Insertando 20 pacientes de prueba...")
    pacientes = []
    for _ in range(20):
        nombre = faker.name()
        ced_segmento1 = random.randint(1, 9)
        ced_segmento2 = random.randint(100, 1999)
        ced_segmento3 = random.randint(100, 9999)
        cedula = f"{ced_segmento1}-{ced_segmento2}-{ced_segmento3}"
        pacientes.append(
            {
                "nombre": nombre,
                "cedula": cedula,
                "telefono": faker.phone_number(),
                "correo": faker.unique.email(),
                "fecha_nacimiento": faker.date_of_birth(minimum_age=18, maximum_age=80).isoformat(),
            }
        )
    res = client.table("pacientes").insert(pacientes).execute()
    return res.data


def insert_citas_iniciales(pacientes: list[dict], medicos: list[dict], horarios: list[dict]) -> None:
    print("[citas] Creando 15 citas de prueba ya agendadas...")
    medicos_idx = {m["id"]: m for m in medicos}
    horarios_por_medico: dict[str, list[dict]] = {}
    for h in horarios:
        horarios_por_medico.setdefault(h["medico_id"], []).append(h)

    creadas = 0
    for paciente in pacientes[:15]:
        medico = random.choice(medicos)
        slots = horarios_por_medico.get(medico["id"], [])
        slots_libres = [s for s in slots if s["disponible"]]
        if not slots_libres:
            continue
        slot = random.choice(slots_libres)
        slot["disponible"] = False  # marcar local para no reusar

        client.table("horarios").update({"disponible": False}).eq("id", slot["id"]).execute()
        client.table("citas").insert(
            {
                "paciente_id": paciente["id"],
                "medico_id": medico["id"],
                "horario_id": slot["id"],
                "sede_id": medico["sede_id"],
                "estado": "confirmada",
                "notas": "Cita de prueba creada por seed_data.py",
            }
        ).execute()
        creadas += 1
    print(f"[citas]   {creadas} citas insertadas.")


def main() -> None:
    start = datetime.now()
    print(f"[seed] HELIOS seed_data — {start.isoformat()}")
    print(f"[seed] Target: {SUPABASE_URL}")

    reset_tables()
    sedes = insert_sedes()
    especialidades = insert_especialidades()
    medicos = insert_medicos(sedes, especialidades)
    horarios = insert_horarios(medicos)
    pacientes = insert_pacientes()
    insert_citas_iniciales(pacientes, medicos, horarios)

    print("\n[resumen]")
    print(f"  sedes:           {len(sedes)}")
    print(f"  especialidades:  {len(especialidades)}")
    print(f"  medicos:         {len(medicos)}")
    print(f"  horarios:        {len(horarios)}")
    print(f"  pacientes:       {len(pacientes)}")
    print(f"  duracion total:  {datetime.now() - start}")


if __name__ == "__main__":
    main()
