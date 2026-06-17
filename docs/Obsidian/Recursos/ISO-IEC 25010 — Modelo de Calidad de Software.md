# ISO/IEC 25010 — Modelo de Calidad de Software

**Tipo:** #estandar
**Área:** [[MOC — Calidad]]
**Proyecto:** [[Proyecto - HELIOS]]
**Estado:** #activo
**Tags:** #helios #iso25010 #calidad #istqb

---

## De Qué Se Trata

ISO/IEC 25010:2011 define el modelo SQuaRE (System and Software Quality Requirements and Evaluation) — 8 características de calidad de un producto de software: adecuación funcional, eficiencia de desempeño, compatibilidad, usabilidad, confiabilidad, seguridad, mantenibilidad y portabilidad.

---

## Cómo se Aplica en HELIOS

El [[Proyecto - HELIOS]] usa este modelo como checklist de calidad transversal a los 4 módulos:

- **Adecuación funcional** — criterios de aceptación por módulo en Jira ([[Jira — Tablero HELL]])
- **Usabilidad** — medida directamente con [[SUS — System Usability Scale (Brooke, 1996)]], aplicada al módulo 01 con 5 médicos evaluadores
- **Confiabilidad** — relacionada con los bugs documentados en [[Reporte de Bugs — Sprint 1 y 2]] (ej. BUG-05, ausencia de Realtime)
- **Seguridad** — BUG-01 (validador de cédula) y BUG-03 (ProtectedRoute) son fallas de seguridad/integridad de datos
- **Mantenibilidad** — medida indirectamente vía [[SonarQube Community]] (deuda técnica, duplicación, code smells)
- **Eficiencia de desempeño** — pruebas de carga en Python (100 usuarios concurrentes, ver [[Daily — Semana 2 — Sprint 1]])

---

## Conexiones

- [[Proyecto - HELIOS]]
- [[ISTQB Foundation Level Syllabus 2018]]
- [[SUS — System Usability Scale (Brooke, 1996)]]
- [[Reporte de Bugs — Sprint 1 y 2]]
- Se relaciona con [[ISO 25010 — Calidad de Software]] → [[MOC — Calidad]]

---

*← [[­HOME]] | [[Proyecto - HELIOS]] | [[MOC — Calidad]]*
