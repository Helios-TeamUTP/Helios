-- ============================================================
-- B-15: Indice critico para acelerar RLS de medicos
-- ============================================================
-- Las policies medico_ve_sus_citas y medico_ve_pacientes_de_sus_citas
-- (creadas en B-14) filtran por citas.medico_id dentro de EXISTS
-- subqueries. Sin este indice, Postgres hace full table scan de citas
-- (5-10 segundos visibles por usuario). Con el indice: <100ms.
--
-- Detectado por PO probando produccion: spinner "Verificando sesion..."
-- tardaba >10s en /medico. Tras aplicar este indice, debe bajar a <2s.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_citas_medico ON citas(medico_id);
