# Plan de Pruebas — HELIOS

Este es el **Plan de Pruebas formal** entregado como proyecto del curso de
Calidad de Software (UTP, I Semestre 2026), versión **1.2** (04/09/2026).

## Archivos

- `HELIOS_PlanDePruebas.pdf` — el documento oficial, firmado/aprobado, tal
  como se entregó a la universidad. Es el artefacto de referencia.
- `HELIOS_PlanDePruebas.md` — la misma fuente en Markdown (texto plano,
  diffable). Se generó antes de exportar el PDF final; se recupera aquí
  porque se había quedado solo en la Papelera del equipo, sin versionar.

## ⚠️ Este documento es una fotografía de un momento — no el estado actual

El plan describe el sistema **tal como estaba al cierre del Sprint 5
(julio–septiembre 2026)**: 138 pruebas automatizadas, 5 defectos auditados
(BUG-01 a BUG-05, ver tabla de Registro de Defectos dentro del documento).

Desde entonces el proyecto avanzó (pivote a SaaS, Módulo 05 — Perfil, etc.)
y esos números ya no son los actuales. Antes de citar una cifra de este
documento como si fuera el estado presente, verifica:

- **Conteo real de tests:** correr `pnpm vitest run` en `frontend/`
- **Registro de defectos vigente:** `CLAUDE.md` en la raíz del repo,
  sección "Defectos conocidos resueltos" (B-01 en adelante — numeración
  distinta a la de este documento; el propio plan v1.2 ya reconcilió
  BUG-01 con B-01, y deja BUG-02 a BUG-05 marcados como pendientes de esa
  misma reconciliación)

## ¿Por qué separado de `docs/Obsidian/Modulos/`?

Los módulos (`docs/Obsidian/Modulos/`) documentan **casos de uso e
implementación** por funcionalidad. Este plan documenta **la estrategia y
resultados de QA** del proyecto completo — son objetos distintos, por eso
viven en `qa/` y no mezclados con los módulos.
