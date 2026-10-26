-- Rollback de sprint6_perfil_medico_nombre.sql
DROP POLICY IF EXISTS "medico_actualiza_su_perfil" ON medicos;
