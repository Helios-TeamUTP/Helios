# HELIOS — Sistema Unificado de Citas Médicas

Proyecto desarrollado para la asignatura de Calidad de Software de la Universidad Tecnológica de Panamá. HELIOS es una plataforma web orientada a la gestión integral de citas médicas para una red de policlínicas, con enfoque en usabilidad, calidad de software y despliegue real.

## Visión general

HELIOS permite a los pacientes agendar, cancelar y reprogramar citas, y a los médicos gestionar su agenda desde una interfaz moderna y responsive. El sistema ha sido construido con una arquitectura basada en React, TypeScript y Supabase, y está preparado para operar en entorno de producción.

## Estado del proyecto

- Estado: terminado y desplegado
- Entorno productivo: Railway
- Base de datos: Supabase
- Enfoque: calidad, seguridad y experiencia de usuario

## Funcionalidades principales

- Registro e inicio de sesión para pacientes y médicos
- Agendamiento de citas con selección de sede, médico y horario
- Cancelación y reprogramación de citas
- Dashboard médico con agenda del día, ficha del paciente e historial
- Validaciones de datos como cédula, teléfono, nombre y correo
- Gestión segura de acceso mediante roles y políticas de base de datos
- Diseño adaptable para escritorio y dispositivos móviles
- Pruebas automatizadas y métricas de calidad integradas al proceso

## Stack tecnológico

- Frontend: React 19 + TypeScript + Vite
- Estilos: Tailwind CSS
- Routing: React Router
- Backend y base de datos: Supabase (PostgreSQL, Auth y RLS)
- Testing: Vitest + React Testing Library
- Calidad: ESLint, SonarQube y scripts de QA en Python
- Despliegue: Railway + Docker


## Estructura del repositorio

El proyecto está organizado de forma simple y clara en módulos funcionales:

- frontend/: aplicación principal en React y TypeScript
- backend/: servicios y lógica complementaria
- database/ y supabase/: esquemas, migraciones y definiciones de datos
- docs/: documentación técnica, arquitectura y planeación
- scripts/: herramientas de prueba, seed y automatización

## Equipo

| Nombre | Rol |
|--------|-----|
| Jose Brown | Product Owner |
| Ethan Gonzalez | Dev Frontend |
| Alejandro Saenz | Tech Lead / Dev Backend |
| Ashley Martinez | QA Engineer |
| Marian Barba | Scrum Master / DevOps |

**Profesora:** María Mosquera

## Enlaces del proyecto

- [Tablero Jira](https://helios-group.atlassian.net/)
- [Sitio desplegado](https://helios-web-production.up.railway.app/)
- [Repositorio GitHub](https://github.com/Helios-TeamUTP/Helios)

## Nota final

HELIOS representa una implementación completa de un sistema de citas médicas con enfoque académico y profesional, integrando desarrollo, pruebas, seguridad y despliegue en un mismo flujo de trabajo.
