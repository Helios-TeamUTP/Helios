# HELIOS — Sistema Unificado de Citas Médicas

Proyecto desarrollado para la asignatura de Calidad de Software — Universidad Tecnológica de Panamá.

## Descripción

HELIOS es una plataforma web de gestión de citas médicas diseñada para una red de policlínicas a nivel nacional. Permite a los pacientes agendar, cancelar y reprogramar citas médicas desde cualquier sede, y a los médicos gestionar su agenda en tiempo real.

## Equipo

| Nombre | Rol |
|--------|-----|
| Jose Brown | Product Owner |
| Ethan Gonzalez | Dev Frontend |
| Alejandro Saenz | Tech Lead / Dev Backend |
| Ashley Martinez | QA Engineer |
| Marian Barba | Scrum Master / DevOps |

**Profesora:** María Mosquera

## Procesos del sistema

1. Agendamiento de citas
2. Cancelación y reprogramación
3. Sincronización entre sedes
4. Notificaciones y recordatorios al paciente

## Stack tecnológico

- **Frontend:** React + TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Tiempo real:** Supabase Realtime
- **Despliegue:** Railway
- **Scripts/QA:** Python
- **Herramienta QA código:** SonarQube (Community)
- **Testing frontend:** Vitest + React Testing Library
- **Backlog:** Jira

## Enlaces del proyecto

- [Tablero Jira](https://helios-group.atlassian.net/?continue=https%3A%2F%2Fhelios-group.atlassian.net%2Fwelcome%2Fsoftware%3FprojectId%3D10000&atlOrigin=eyJpIjoiMTg4MGNkYjY4ZTk0NDJjMDgyNzgwY2E2NTA1NGJmNDEiLCJwIjoiamlyYS1zb2Z0d2FyZSJ9)
- [Notion Workspace](https://www.notion.so/HELIOS-Workspace-2a2d9b5c1dbf4eab831310977e440c89)

## Estructura del repositorio

helios/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/
├── backend/
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       └── services/
├── docs/
│   ├── dailys/
│   ├── arquitectura.md
│   └── backlog.md
└── .github/
    └── workflows/
        └── ci.yml

## Metodología

Trabajamos con **Scrum + DevOps**:
- Sprints semanales con dailys de seguimiento
- CI/CD automático con GitHub Actions + Vercel
- Entregas incrementales cada sprint

## Sprints

| Sprint | Módulo | Fecha límite |
|--------|--------|-------------|
| Sprint 0 | Setup y configuración | Mayo 2026 |
| Sprint 1 | Agendamiento de citas | 11 junio 2026 |
| Sprint 2 | Cancelación y reprogramación | Por definir |
| Sprint 3 | Sincronización entre sedes | Por definir |
| Sprint 4 | Notificaciones | Por definir |
| Sprint 5 | Pruebas y cierre | Por definir |