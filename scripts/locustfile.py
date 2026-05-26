"""HELIOS Sprint 1 - Prueba de Carga

Simula tres flujos sobre la REST API auto-generada de Supabase:
  - 60% consultar horarios disponibles
  - 30% flujo de agendamiento completo (lista de medicos -> slots)
  - 10% consultar mis citas por paciente

Meta del Sprint 1: P95 < 2 segundos con 500 usuarios concurrentes.

Uso:
    locust -f scripts/locustfile.py \\
        --host=https://TU_PROYECTO.supabase.co \\
        --users 500 --spawn-rate 25 --run-time 2m \\
        --headless --html scripts/locust_report.html

Requiere SUPABASE_ANON_KEY en .env (mismo del frontend).
"""

import os
import random
from pathlib import Path

from dotenv import load_dotenv
from locust import HttpUser, between, task

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "frontend" / ".env.local")

ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
if not ANON_KEY:
    raise SystemExit(
        "Falta VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY en el entorno (revisa frontend/.env.local)."
    )


class PacienteVirtual(HttpUser):
    wait_time = between(1, 3)

    def on_start(self) -> None:
        self.client.headers.update(
            {
                "apikey": ANON_KEY,
                "Authorization": f"Bearer {ANON_KEY}",
            }
        )
        # cache de sedes/especialidades para flujos
        self.sedes = self._json("/rest/v1/sedes?select=id,nombre&activo=eq.true") or []
        self.especialidades = self._json("/rest/v1/especialidades?select=id,nombre") or []

    def _json(self, path: str):
        with self.client.get(path, name=path.split("?")[0], catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"status {resp.status_code}")
                return None
            return resp.json()

    @task(6)
    def consultar_horarios(self) -> None:
        self.client.get(
            "/rest/v1/horarios?select=id,fecha,hora_inicio&disponible=eq.true&limit=50",
            name="GET /horarios disponibles",
        )

    @task(3)
    def flujo_agendamiento(self) -> None:
        # 1) listar medicos por sede + especialidad
        if not self.sedes or not self.especialidades:
            return
        sede = random.choice(self.sedes)
        esp = random.choice(self.especialidades)
        medicos = self._json(
            f"/rest/v1/medicos?select=id&sede_id=eq.{sede['id']}&especialidad_id=eq.{esp['id']}&activo=eq.true"
        )
        if not medicos:
            return
        medico = random.choice(medicos)
        # 2) listar horarios del medico
        self.client.get(
            f"/rest/v1/horarios?select=id,fecha,hora_inicio&medico_id=eq.{medico['id']}&disponible=eq.true&limit=20",
            name="GET /horarios por medico",
        )

    @task(1)
    def consultar_mis_citas(self) -> None:
        # consulta generica (mis citas requiere paciente_id real; este es proxy de carga)
        self.client.get(
            "/rest/v1/citas?select=id,codigo_confirmacion,estado&limit=20",
            name="GET /mis-citas",
        )
