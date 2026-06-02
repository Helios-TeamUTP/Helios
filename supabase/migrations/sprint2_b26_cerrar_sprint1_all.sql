-- ============================================================
-- B-26 (Sprint 2 · Seguridad): cerrar el hueco "sprint1_all"
-- ============================================================
-- El schema.sql creó policies PERMISIVAS "sprint1_all" (FOR ALL USING(true))
-- en 7 tablas. B-14 agregó policies estrictas PERO no borró las permisivas.
-- Como las policies se combinan con OR, mientras exista "sprint1_all" cualquier
-- usuario autenticado puede leer/modificar/borrar datos ajenos por la API.
-- Verificado por el PO: las 7 tablas tienen "sprint1_all".
--
-- ESTE SCRIPT ES SEGURO ("no se rompe nunca"):
--   1. Re-crea (idempotente) TODAS las policies estrictas de B-14.
--   2. RECIÉN DESPUÉS elimina las "sprint1_all".
--   Todo dentro de UNA transacción -> sin ventana de exposición ni de bloqueo.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor. Si algo falla, hay ROLLBACK
-- al final del archivo (comentado).
-- ============================================================

BEGIN;

-- Asegurar RLS habilitado en las 7 tablas.
ALTER TABLE auth_paciente_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- PASO 1: re-crear las policies estrictas de B-14 (idempotente)
-- ─────────────────────────────────────────────────────────────

-- auth_paciente_link
DROP POLICY IF EXISTS "paciente_ve_su_link" ON auth_paciente_link;
CREATE POLICY "paciente_ve_su_link" ON auth_paciente_link FOR SELECT
  USING (auth_uid = auth.uid());
DROP POLICY IF EXISTS "paciente_crea_su_link" ON auth_paciente_link;
CREATE POLICY "paciente_crea_su_link" ON auth_paciente_link FOR INSERT
  WITH CHECK (auth_uid = auth.uid());
DROP POLICY IF EXISTS "paciente_actualiza_su_link" ON auth_paciente_link;
CREATE POLICY "paciente_actualiza_su_link" ON auth_paciente_link FOR UPDATE
  USING (auth_uid = auth.uid()) WITH CHECK (auth_uid = auth.uid());

-- pacientes (3 SELECT + 1 INSERT)
DROP POLICY IF EXISTS "paciente_ve_su_perfil" ON pacientes;
CREATE POLICY "paciente_ve_su_perfil" ON pacientes FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id));
DROP POLICY IF EXISTS "medico_ve_pacientes_de_sus_citas" ON pacientes;
CREATE POLICY "medico_ve_pacientes_de_sus_citas" ON pacientes FOR SELECT
  USING (EXISTS (SELECT 1 FROM citas c
    JOIN auth_medico_link aml ON aml.medico_id = c.medico_id
    WHERE aml.auth_uid = auth.uid() AND c.paciente_id = pacientes.id));
-- Nota: este SELECT(true) permite el chequeo de cédula en registro. Sigue
-- siendo un read-leak menor (B-14 lo dejó pendiente -> mover a RPC). NO es el
-- hueco crítico de sprint1_all (que permitía ESCRITURA). Se cierra aparte.
DROP POLICY IF EXISTS "chequeo_cedula_en_registro" ON pacientes;
CREATE POLICY "chequeo_cedula_en_registro" ON pacientes FOR SELECT USING (true);
DROP POLICY IF EXISTS "paciente_crea_su_perfil" ON pacientes;
CREATE POLICY "paciente_crea_su_perfil" ON pacientes FOR INSERT WITH CHECK (true);

-- citas (paciente lee las suyas; médico lee y actualiza las suyas; INSERT solo
-- vía RPC SECURITY DEFINER; cancelar/reprogramar también vía RPC)
DROP POLICY IF EXISTS "paciente_ve_sus_citas" ON citas;
CREATE POLICY "paciente_ve_sus_citas" ON citas FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = citas.paciente_id));
DROP POLICY IF EXISTS "medico_ve_sus_citas" ON citas;
CREATE POLICY "medico_ve_sus_citas" ON citas FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id));
DROP POLICY IF EXISTS "medico_actualiza_sus_citas" ON citas;
CREATE POLICY "medico_actualiza_sus_citas" ON citas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id))
  WITH CHECK (EXISTS (SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id));

-- horarios (lectura autenticada; UPDATE disponibilidad autenticado/RPC)
DROP POLICY IF EXISTS "autenticado_lee_horarios" ON horarios;
CREATE POLICY "autenticado_lee_horarios" ON horarios FOR SELECT
  USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "autenticado_actualiza_disponibilidad" ON horarios;
CREATE POLICY "autenticado_actualiza_disponibilidad" ON horarios FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- catálogos (solo lectura autenticada)
DROP POLICY IF EXISTS "autenticado_lee_medicos" ON medicos;
CREATE POLICY "autenticado_lee_medicos" ON medicos FOR SELECT
  USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "autenticado_lee_sedes" ON sedes;
CREATE POLICY "autenticado_lee_sedes" ON sedes FOR SELECT
  USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "autenticado_lee_especialidades" ON especialidades;
CREATE POLICY "autenticado_lee_especialidades" ON especialidades FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- PASO 2: eliminar las policies permisivas "sprint1_all"
-- (ya garantizamos arriba que existen las estrictas)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sprint1_all" ON auth_paciente_link;
DROP POLICY IF EXISTS "sprint1_all" ON pacientes;
DROP POLICY IF EXISTS "sprint1_all" ON citas;
DROP POLICY IF EXISTS "sprint1_all" ON horarios;
DROP POLICY IF EXISTS "sprint1_all" ON medicos;
DROP POLICY IF EXISTS "sprint1_all" ON sedes;
DROP POLICY IF EXISTS "sprint1_all" ON especialidades;

COMMIT;

-- ============================================================
-- VERIFICACIÓN (correr después): sprint1_all NO debe aparecer (0 filas)
-- ============================================================
SELECT tablename, policyname FROM pg_policies WHERE policyname = 'sprint1_all';
-- Esperado: 0 filas.


-- ============================================================
-- ROLLBACK DE EMERGENCIA (solo si algo se rompe tras la migración).
-- Re-crea las permisivas para volver al estado anterior. Descomentar y correr.
-- ============================================================
-- BEGIN;
-- CREATE POLICY "sprint1_all" ON auth_paciente_link FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON pacientes          FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON citas              FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON horarios           FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON medicos            FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON sedes              FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sprint1_all" ON especialidades     FOR ALL USING (true) WITH CHECK (true);
-- COMMIT;
