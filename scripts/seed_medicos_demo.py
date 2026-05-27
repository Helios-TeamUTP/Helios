"""HELIOS Sprint 1 - Seed Medicos Demo (B-13)

Crea cuentas de auth para todos los medicos del catalogo (Patron 1 de
seguridad: solo el admin con service_role key crea medicos; NO hay auto
registro publico).

Para los primeros 3 medicos seleccionados ademas crea 4-6 citas para HOY
con pacientes existentes, de modo que al hacer login el medico vea data
en el dashboard.

Output: imprime tabla de credenciales y la guarda en
    docs/CREDENCIALES_DEMO_MEDICOS.md  (NO commitear, en .gitignore)

Uso:
    python scripts/seed_medicos_demo.py

Requiere variables de entorno (en .env en raiz o ya exportadas):
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=ey...   # OBLIGATORIO service_role
                                       # (anon key NO puede crear users)

Idempotente: si un medico ya tiene cuenta (de un run anterior), se salta.
Si una cita ya existe para ese horario, se salta y prueba otro.
"""

from __future__ import annotations

import os
import random
import re
import unicodedata
from datetime import date, datetime, time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "scripts" / ".env")  # ubicacion estandar del proyecto
load_dotenv(ROOT / "frontend" / ".env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        "ERROR: necesitas SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en env.\n"
        "El anon key NO sirve aqui porque necesitamos crear users en auth.users."
    )

print("[ok] Conectado con service_role key (Patron 1: solo admin crea medicos).")

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password fijo para todos los medicos demo. Sprint 2: password reset propio.
PASSWORD_DEMO = "helios2026"
DOMINIO_DEMO = "helios.demo"
# Cantidad de medicos que tendran citas creadas para HOY (los primeros N)
N_MEDICOS_CON_CITAS = 3
CITAS_POR_MEDICO_HOY = 5


def slugify(texto: str) -> str:
    """Convierte 'Dr. Maria Gonzalez' -> 'maria.gonzalez' (sin titulos ni acentos)."""
    # Quitar acentos
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    # Quitar titulos comunes
    sin_titulos = re.sub(r"^\s*(dr|dra|sr|sra|lic|ing)\.?\s+", "", sin_acentos, flags=re.I)
    # Convertir a slug con puntos
    slug = re.sub(r"[^a-zA-Z0-9]+", ".", sin_titulos).strip(".").lower()
    return slug


def email_para_medico(nombre: str) -> str:
    return f"{slugify(nombre)}@{DOMINIO_DEMO}"


def crear_auth_user(email: str, password: str) -> Optional[str]:
    """Crea un usuario en auth.users via admin API. Retorna auth_uid.
    Si el email ya existe, busca el user existente y retorna su id.
    """
    try:
        # Crear nuevo
        result = client.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,  # No requerir verificacion (demo)
            }
        )
        if result.user:
            return result.user.id
        return None
    except Exception as e:
        # Email ya existe: buscar el user
        if "already" in str(e).lower() or "exist" in str(e).lower() or "duplicate" in str(e).lower():
            # Listar todos los users y filtrar (la API admin no tiene get_by_email directo)
            try:
                users_resp = client.auth.admin.list_users()
                # users_resp es una lista en supabase-py 2.x
                users_list = users_resp if isinstance(users_resp, list) else users_resp.users
                for u in users_list:
                    if u.email == email:
                        return u.id
            except Exception as e2:
                print(f"  [warn] no se pudo buscar user existente {email}: {e2}")
        print(f"  [error] al crear auth user {email}: {e}")
        return None


def link_medico_si_no_existe(auth_uid: str, medico_id: str) -> bool:
    """Crea el registro en auth_medico_link si no existe ya. Retorna True si quedo vinculado."""
    try:
        # Verificar si ya existe
        existing = (
            client.table("auth_medico_link")
            .select("auth_uid")
            .eq("auth_uid", auth_uid)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            return True  # ya estaba vinculado
    except Exception:
        pass

    try:
        client.table("auth_medico_link").upsert(
            {"auth_uid": auth_uid, "medico_id": medico_id},
            on_conflict="auth_uid",
        ).execute()
        return True
    except Exception as e:
        print(f"  [error] al crear auth_medico_link: {e}")
        return False


def crear_cita_demo(medico_id: str, paciente_id: str, horario_id: str, sede_id: str) -> bool:
    """Crea una cita directamente (bypaseando el RPC, que requiere auth.uid del paciente)."""
    try:
        # Marcar horario como ocupado
        client.table("horarios").update({"disponible": False}).eq("id", horario_id).execute()
        # Insertar cita
        client.table("citas").insert(
            {
                "paciente_id": paciente_id,
                "medico_id": medico_id,
                "horario_id": horario_id,
                "sede_id": sede_id,
                "estado": "confirmada",
                "notas": "Cita demo seed_medicos",
            }
        ).execute()
        return True
    except Exception as e:
        # Si el horario ya tiene cita asignada (UNIQUE constraint), reintentar otro
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return False
        print(f"  [error] al crear cita demo: {e}")
        return False


def main() -> None:
    print("\n=== B-13: SEED MEDICOS DEMO ===\n")

    # 1) Cargar todos los medicos activos
    medicos_resp = (
        client.table("medicos")
        .select("id, nombre, sede_id, especialidad_id, especialidad:especialidades(nombre), sede:sedes(nombre)")
        .eq("activo", True)
        .order("nombre")
        .execute()
    )
    medicos = medicos_resp.data or []
    if not medicos:
        raise SystemExit(
            "No hay medicos activos en la tabla. Corre primero `python scripts/seed_data.py`."
        )
    print(f"[info] {len(medicos)} medicos activos encontrados.")

    # 2) Crear auth user + link para cada uno
    credenciales: list[tuple[str, str, str, str]] = []  # (nombre, email, especialidad, sede)
    for med in medicos:
        nombre = med["nombre"]
        email = email_para_medico(nombre)
        auth_uid = crear_auth_user(email, PASSWORD_DEMO)
        if not auth_uid:
            print(f"  [skip] {nombre}")
            continue
        if link_medico_si_no_existe(auth_uid, med["id"]):
            print(f"  [ok] {nombre} -> {email}")
            esp = (med.get("especialidad") or {}).get("nombre", "")
            sede = (med.get("sede") or {}).get("nombre", "")
            credenciales.append((nombre, email, esp, sede))

    # 3) Crear citas HOY para los primeros N medicos
    hoy = date.today().isoformat()
    print(f"\n[info] Creando citas demo para HOY ({hoy})...")

    # Pacientes activos para asignar
    pacientes_resp = client.table("pacientes").select("id, nombre").limit(50).execute()
    pacientes = pacientes_resp.data or []
    if not pacientes:
        print("[warn] No hay pacientes en BD; salto creacion de citas demo.")
    else:
        random.seed(datetime.now().toordinal())
        for med in medicos[:N_MEDICOS_CON_CITAS]:
            # Horarios disponibles del medico para hoy
            horarios_resp = (
                client.table("horarios")
                .select("id, hora_inicio")
                .eq("medico_id", med["id"])
                .eq("fecha", hoy)
                .eq("disponible", True)
                .order("hora_inicio")
                .limit(CITAS_POR_MEDICO_HOY * 2)  # margen por si algunos fallan
                .execute()
            )
            horarios = horarios_resp.data or []
            if not horarios:
                # Crear un par de horarios si no hay para hoy
                print(f"  [info] {med['nombre']}: sin horarios libres hoy, creando 5...")
                for i, hora_h in enumerate(range(8, 13)):
                    try:
                        client.table("horarios").insert(
                            {
                                "medico_id": med["id"],
                                "fecha": hoy,
                                "hora_inicio": time(hora_h, 0).isoformat(),
                                "hora_fin": time(hora_h, 30).isoformat(),
                                "disponible": True,
                            }
                        ).execute()
                    except Exception:
                        pass
                horarios_resp = (
                    client.table("horarios")
                    .select("id, hora_inicio")
                    .eq("medico_id", med["id"])
                    .eq("fecha", hoy)
                    .eq("disponible", True)
                    .order("hora_inicio")
                    .limit(CITAS_POR_MEDICO_HOY)
                    .execute()
                )
                horarios = horarios_resp.data or []

            creadas = 0
            for h in horarios[:CITAS_POR_MEDICO_HOY]:
                paciente = random.choice(pacientes)
                if crear_cita_demo(med["id"], paciente["id"], h["id"], med["sede_id"]):
                    creadas += 1
            print(f"  [ok] {med['nombre']}: {creadas} citas para hoy")

    # 4) Imprimir y guardar credenciales
    print("\n========================================================")
    print(" CREDENCIALES MEDICOS DEMO HELIOS")
    print(f" Password (todos): {PASSWORD_DEMO}")
    print("========================================================")
    for nombre, email, esp, sede in credenciales:
        print(f"  {nombre:35} {email:40} {esp} - {sede}")
    print("========================================================\n")

    # Guardar archivo markdown
    doc_path = ROOT / "docs" / "CREDENCIALES_DEMO_MEDICOS.md"
    lines = [
        "# Credenciales DEMO - Medicos HELIOS",
        "",
        f"> Generadas el {datetime.now().isoformat()} por scripts/seed_medicos_demo.py",
        "> **NO commitear este archivo** (ya esta en .gitignore).",
        "",
        f"**Password (todos):** `{PASSWORD_DEMO}`",
        "",
        "| Médico | Email (usuario) | Especialidad | Sede |",
        "|---|---|---|---|",
    ]
    for nombre, email, esp, sede in credenciales:
        lines.append(f"| {nombre} | `{email}` | {esp} | {sede} |")
    lines.append("")
    lines.append(
        "Para presentar: usar el primer medico con citas asignadas hoy "
        "(suele ser el primero de la lista)."
    )
    doc_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[ok] Credenciales guardadas en: {doc_path}")


if __name__ == "__main__":
    main()
