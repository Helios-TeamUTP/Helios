# GitHub — Helios

**Tipo:** #herramienta #repositorio
**Área:** [[MOC — Proyectos]]
**Proyecto:** [[Proyecto - HELIOS]]
**Estado:** #activo
**Tags:** #helios #git #github #cicd

---

## De Qué Se Trata

Repositorio central del proyecto HELIOS: https://github.com/MarianC-programing/Helios

Contiene el código fuente del frontend (React + TypeScript), el SQL completo de la base de datos, la documentación técnica (`docs/`) y la configuración de CI/CD vía GitHub Actions.

---

## Estructura Relevante

- `docs/arquitectura-helios.html` — diagrama de arquitectura general
- `docs/modulo-01-agendamiento.md` — especificación módulo 1
- `docs/modulo-02-cancelacion.md`, `modulo-03-sincronizacion.md`, `modulo-04-notificaciones.md` — pendientes de subir
- Ramas de trabajo por sprint, ej. `origin/sprint1/bootstrap` (rama auditada para el reporte de bugs)
- GitHub Actions configurado como pipeline de CI/CD

---

## Por Qué lo Uso en HELIOS

Es el punto de verdad del código y donde corre la integración continua. Las auditorías de bugs (ver [[Reporte de Bugs — Sprint 1 y 2]]) se hacen sobre ramas específicas de este repo, y Railway despliega directo desde aquí.

---

## Conexiones

- [[Proyecto - HELIOS]]
- [[Reporte de Bugs — Sprint 1 y 2]]
- [[Casos de Prueba — Regresión Bugs]]
- Se relaciona con [[Integración Continua]] → [[MOC — DevOps]]
- Se relaciona con [[Git y GitHub]] → [[MOC — Programación]]

---

*← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Proyectos]]*
