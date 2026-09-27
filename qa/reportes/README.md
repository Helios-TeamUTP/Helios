# Reportes — HELIOS QA

Esta carpeta es para **reportes de ejecución de pruebas por sprint/release**
(distinto del Plan de Pruebas en sí, que vive en `../planes_prueba/`).

## Estado actual: vacía a propósito, todavía

El reporte de cierre del Sprint 5 (resultados, evidencias, métricas,
conclusiones) ya existe, pero está **dentro** del documento del plan
(`../planes_prueba/HELIOS_PlanDePruebas.md`, secciones "Casos de Prueba",
"Registro de Defectos", "Evidencias del Software" y "Conclusiones") — no
se duplicó aquí para no tener dos copias de la misma información
desincronizándose.

## Qué va aquí de ahora en adelante

Un reporte corto por sprint/release nuevo (ej. `2026-09-sprint6.md`) con:
resultado de `pnpm vitest run` (tests pasados/fallidos), defectos nuevos
encontrados, y estado de RLS/migraciones aplicadas — siguiendo el mismo
criterio ISTQB del plan original, pero sin necesidad de reescribir todo el
documento formal cada vez.
