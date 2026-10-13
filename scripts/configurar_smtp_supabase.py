"""HELIOS — Configurar Brevo como SMTP de Supabase Auth (correo de recuperar contraseña)

Problema que resuelve:
    Los correos de Supabase Auth (recuperar contraseña, etc.) salen por el
    SMTP integrado de Supabase: pocos correos por hora, remitente genérico y
    plantilla en inglés. El resto de notificaciones de HELIOS ya sale por
    Brevo (email-worker/), así que Auth debe usar el MISMO proveedor y el
    MISMO remitente verificado.

Por qué SMTP aquí y API HTTP en el worker:
    El worker corre en Railway, que bloquea el SMTP saliente. Los correos de
    Auth los envía Supabase desde su propia infraestructura (no Railway), por
    lo que SMTP de Brevo funciona sin problema.

Qué hace:
    1. Lee la configuración de Auth actual (valida el token).
    2. Aplica por la Management API de Supabase (PATCH config/auth):
       smtp_host/port/user/pass, remitente, y asunto + plantilla en español
       de "Reset Password" (supabase/email-templates/recuperar-password.html).
    No toca usuarios, tablas ni otras plantillas.

Variables (en scripts/.env, ignorado por git — NUNCA en el chat ni commiteadas):
    SUPABASE_URL              ya existe (de ahí se saca el project ref)
    SUPABASE_ACCESS_TOKEN     token personal: supabase.com/dashboard/account/tokens
    BREVO_SMTP_LOGIN          Brevo > SMTP & API > pestaña SMTP > "Login" (xxxx@smtp-brevo.com)
    BREVO_SMTP_KEY            Brevo > SMTP & API > pestaña SMTP > "Generate a new SMTP key"
                              (OJO: es distinta de la API key xkeysib-... del worker)
    SENDER_EMAIL              el MISMO remitente verificado en Brevo que usa el worker
    SENDER_NAME               opcional, default "HELIOS Citas"

Uso:
    python scripts/configurar_smtp_supabase.py --dry-run   # muestra qué cambiaría
    python scripts/configurar_smtp_supabase.py             # aplica
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "scripts" / ".env")

PLANTILLA = ROOT / "supabase" / "email-templates" / "recuperar-password.html"
ASUNTO_RECUPERAR = "Recupera tu contraseña de HELIOS"
API = "https://api.supabase.com/v1/projects/{ref}/config/auth"


def requerir(nombre: str) -> str:
    valor = os.environ.get(nombre)
    if not valor:
        sys.exit(f"Falta la variable {nombre} en scripts/.env (ver docstring del script).")
    return valor


def project_ref(supabase_url: str) -> str:
    # https://<ref>.supabase.co  ->  <ref>
    host = urlparse(supabase_url).hostname or ""
    ref = host.split(".")[0]
    if not ref:
        sys.exit(f"No pude sacar el project ref de SUPABASE_URL={supabase_url!r}")
    return ref


def llamar(metodo: str, url: str, token: str, cuerpo: dict | None = None) -> dict:
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(
        url,
        data=datos,
        method=metodo,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            # La API está detrás de Cloudflare: el User-Agent por defecto de
            # urllib suele rechazarse (403, error 1010).
            "User-Agent": "helios-devops-script/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        detalle = e.read().decode(errors="replace")[:300]
        sys.exit(f"Supabase Management API {metodo} -> HTTP {e.code}: {detalle}")


def enmascarar(payload: dict) -> dict:
    return {k: ("********" if k == "smtp_pass" else v) for k, v in payload.items()
            if k != "mailer_templates_recovery_content"} | {
        "mailer_templates_recovery_content": f"<{len(payload['mailer_templates_recovery_content'])} caracteres de HTML>"
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="solo muestra el cambio, no lo aplica")
    args = parser.parse_args()

    token = requerir("SUPABASE_ACCESS_TOKEN")
    ref = project_ref(requerir("SUPABASE_URL"))
    payload = {
        "smtp_host": "smtp-relay.brevo.com",
        "smtp_port": "587",
        "smtp_user": requerir("BREVO_SMTP_LOGIN"),
        "smtp_pass": requerir("BREVO_SMTP_KEY"),
        "smtp_admin_email": requerir("SENDER_EMAIL"),
        "smtp_sender_name": os.environ.get("SENDER_NAME", "HELIOS Citas"),
        "mailer_subjects_recovery": ASUNTO_RECUPERAR,
        "mailer_templates_recovery_content": PLANTILLA.read_text(encoding="utf-8"),
    }

    url = API.format(ref=ref)
    actual = llamar("GET", url, token)
    print(f"Proyecto: {ref}")
    print(f"SMTP actual : {actual.get('smtp_host') or '(integrado de Supabase)'}")
    print(f"SMTP nuevo  : {payload['smtp_host']}:{payload['smtp_port']} como {payload['smtp_admin_email']}")

    if args.dry_run:
        print("\n[dry-run] Cambios que se enviarían:")
        print(json.dumps(enmascarar(payload), indent=2, ensure_ascii=False))
        return

    llamar("PATCH", url, token, payload)
    print("\nListo. Prueba: pide un enlace en /recuperar-password con un correo real de la BD.")
    print("Si el correo no llega: Brevo > Transactional > Logs, y spam.")


if __name__ == "__main__":
    main()
