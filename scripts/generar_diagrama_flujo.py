"""Genera el diagrama de flujo del usuario (paciente y medico) como PNG.

Usa kroki.io (servicio publico) para renderizar Mermaid a PNG sin
necesidad de instalar mermaid-cli ni Chrome headless.

Output:
    dailys/Entrega_Viernes/diagrama_flujo_usuario.png
    dailys/Entrega_Viernes/diagrama_arquitectura.png

Uso:
    python scripts/generar_diagrama_flujo.py
"""

from __future__ import annotations

import base64
import urllib.request
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "dailys" / "Entrega_Viernes"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def kroki_url(diagram_type: str, output_format: str, source: str) -> str:
    """Genera URL de kroki.io para renderizar un diagrama."""
    compressed = zlib.compress(source.encode("utf-8"), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii")
    return f"https://kroki.io/{diagram_type}/{output_format}/{encoded}"


def download(url: str, output: Path) -> None:
    """Descarga el PNG y lo guarda en disco."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 HELIOS-doc-generator"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        output.write_bytes(response.read())
    print(f"[ok] Generado: {output} ({output.stat().st_size / 1024:.1f} KB)")


# ============================================================================
# DIAGRAMA 1: Flujo del usuario (paciente y medico)
# ============================================================================
FLUJO_USUARIO = """
flowchart TD
    Start([Usuario abre HELIOS]) --> Decide{Tipo de usuario}

    Decide -->|Nuevo paciente| Registro[Pagina Registro]
    Decide -->|Paciente existente| Login1[Pagina Login]
    Decide -->|Medico| Login2[Pagina Login]

    Registro --> SignUp[signUp con correo y password]
    SignUp --> Pendiente[Guardar datos en sessionStorage]
    Pendiente --> RedirectLogin[Redirect a /login con banner verde]
    RedirectLogin --> Login1

    Login1 --> SignIn[signInWithPassword]
    Login2 --> SignIn
    SignIn --> AuthListener{useAuth onAuthStateChange}

    AuthListener -->|Tiene sessionStorage pendiente| Completar[INSERT paciente + UPSERT link]
    Completar --> LoadPerfil[loadPerfil - carga rol]
    AuthListener -->|Sin pendiente| LoadPerfil

    LoadPerfil --> Rol{Que rol tiene?}

    Rol -->|paciente| Agendar[Pagina /agendar]
    Rol -->|medico| Dashboard[Dashboard medico]

    Agendar --> Wizard1[Paso 1: Especialidad + Sede]
    Wizard1 --> Wizard2[Paso 2: Elegir medico]
    Wizard2 --> Wizard3[Paso 3: Elegir horario en calendario]
    Wizard3 --> Wizard4[Paso 4: Confirmar datos]
    Wizard4 --> CrearCita[crear_cita_atomica RPC]
    CrearCita --> Exito([Codigo de confirmacion])

    Dashboard --> AgendaHoy[Ver agenda del dia]
    AgendaHoy --> Accion{Accion en cita}
    Accion -->|Marcar completada| UpdateCita1[UPDATE estado=completada]
    Accion -->|Marcar no asistio| UpdateCita2[UPDATE estado=no_asistio]
    Accion -->|Ver ficha paciente| Ficha[Mostrar datos paciente]

    classDef pacienteNode fill:#0A8478,stroke:#066F66,color:#fff
    classDef medicoNode fill:#3DDC97,stroke:#066F66,color:#0F2A36
    classDef rpcNode fill:#0A4F6B,stroke:#0A4F6B,color:#fff
    classDef exitoNode fill:#0A8478,stroke:#066F66,color:#fff,font-weight:bold

    class Registro,Login1,Agendar,Wizard1,Wizard2,Wizard3,Wizard4,Exito pacienteNode
    class Login2,Dashboard,AgendaHoy,Ficha,UpdateCita1,UpdateCita2 medicoNode
    class Completar,LoadPerfil,CrearCita,SignUp,SignIn rpcNode
"""

# ============================================================================
# DIAGRAMA 2: Arquitectura del sistema (3 capas)
# ============================================================================
ARQUITECTURA = """
flowchart TB
    subgraph Frontend["FRONTEND (React + TypeScript + Vite)"]
        UI[Componentes UI]
        Hooks[Custom Hooks]
        Auth[useAuth Context]
        UI --> Hooks
        Hooks --> Auth
    end

    subgraph Supabase["SUPABASE (Cloud BaaS)"]
        SBAuth[Auth Service]
        API[REST API auto]
        BD[(PostgreSQL)]
        RPC[Funciones RPC atomicas]
        RLS[Row Level Security]
        SBAuth --> BD
        API --> BD
        BD --> RLS
        BD --> RPC
    end

    subgraph Railway["RAILWAY (Hosting)"]
        Deploy[Deploy CI Automatico]
        Public[helios-web-production.up.railway.app]
        Deploy --> Public
    end

    Frontend -->|HTTPS + JWT| Supabase
    GitHub[GitHub Repo] -->|Push| Deploy
    Public -->|Sirve| Frontend

    classDef frontendNode fill:#0A8478,stroke:#066F66,color:#fff
    classDef supabaseNode fill:#3DDC97,stroke:#066F66,color:#0F2A36
    classDef railwayNode fill:#0A4F6B,stroke:#0A4F6B,color:#fff
    classDef githubNode fill:#1F2937,stroke:#000,color:#fff

    class UI,Hooks,Auth frontendNode
    class SBAuth,API,BD,RPC,RLS supabaseNode
    class Deploy,Public railwayNode
    class GitHub githubNode
"""


def main() -> None:
    print("[info] Generando diagrama de flujo del usuario...")
    url1 = kroki_url("mermaid", "png", FLUJO_USUARIO)
    download(url1, OUTPUT_DIR / "diagrama_flujo_usuario.png")

    print("[info] Generando diagrama de arquitectura...")
    url2 = kroki_url("mermaid", "png", ARQUITECTURA)
    download(url2, OUTPUT_DIR / "diagrama_arquitectura.png")

    print("\n[exito] Diagramas listos en dailys/Entrega_Viernes/")


if __name__ == "__main__":
    main()
