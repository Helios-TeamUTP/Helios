-- ============================================================
-- ROLLBACK de B-14: restaura allow_all_dev en caso de emergencia
-- ============================================================
-- Uso: si tras aplicar B-14 algo rompe en produccion, pegar este
-- SQL en Supabase Dashboard > SQL Editor y ejecutar. ~30 segundos.
--
-- Restaura el estado anterior: policies permisivas en todas las tablas
-- y la version original (vulnerable) de crear_cita_atomica.
-- ============================================================

-- auth_medico_link: queda igual (la tabla puede quedar sin policies de
-- INSERT/UPDATE/DELETE; el seed con service_role sigue funcionando).
-- Si quieres reabrirla completamente:
-- CREATE POLICY "allow_all_dev" ON auth_medico_link FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────
-- Restaurar policies permisivas
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "paciente_ve_su_link" ON auth_paciente_link;
DROP POLICY IF EXISTS "paciente_crea_su_link" ON auth_paciente_link;
DROP POLICY IF EXISTS "paciente_actualiza_su_link" ON auth_paciente_link;
CREATE POLICY "allow_all_dev" ON auth_paciente_link FOR ALL USING (true);

DROP POLICY IF EXISTS "paciente_ve_su_perfil" ON pacientes;
DROP POLICY IF EXISTS "medico_ve_pacientes_de_sus_citas" ON pacientes;
DROP POLICY IF EXISTS "chequeo_cedula_en_registro" ON pacientes;
DROP POLICY IF EXISTS "paciente_crea_su_perfil" ON pacientes;
CREATE POLICY "allow_all_dev" ON pacientes FOR ALL USING (true);

DROP POLICY IF EXISTS "paciente_ve_sus_citas" ON citas;
DROP POLICY IF EXISTS "medico_ve_sus_citas" ON citas;
DROP POLICY IF EXISTS "medico_actualiza_sus_citas" ON citas;
CREATE POLICY "allow_all_dev" ON citas FOR ALL USING (true);

DROP POLICY IF EXISTS "autenticado_lee_horarios" ON horarios;
DROP POLICY IF EXISTS "autenticado_actualiza_disponibilidad" ON horarios;
CREATE POLICY "allow_all_dev" ON horarios FOR ALL USING (true);

DROP POLICY IF EXISTS "autenticado_lee_medicos" ON medicos;
CREATE POLICY "allow_all_dev" ON medicos FOR ALL USING (true);

DROP POLICY IF EXISTS "autenticado_lee_sedes" ON sedes;
CREATE POLICY "allow_all_dev" ON sedes FOR ALL USING (true);

DROP POLICY IF EXISTS "autenticado_lee_especialidades" ON especialidades;
CREATE POLICY "allow_all_dev" ON especialidades FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────
-- Restaurar crear_cita_atomica a la version original (sin validacion)
-- ─────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION crear_cita_atomica TO anon;

CREATE OR REPLACE FUNCTION crear_cita_atomica(
  p_paciente_id UUID,
  p_medico_id UUID,
  p_horario_id UUID,
  p_sede_id UUID,
  p_notas TEXT DEFAULT NULL
) RETURNS TABLE(cita_id UUID, codigo TEXT) AS $$
DECLARE
  v_disponible BOOLEAN;
  v_cita_id UUID;
  v_codigo TEXT;
BEGIN
  SELECT disponible INTO v_disponible FROM horarios WHERE id = p_horario_id FOR UPDATE;
  IF v_disponible IS NULL THEN
    RAISE EXCEPTION 'Horario no existe';
  END IF;
  IF v_disponible = false THEN
    RAISE EXCEPTION 'Horario ya reservado';
  END IF;

  UPDATE horarios SET disponible = false WHERE id = p_horario_id;

  INSERT INTO citas (paciente_id, medico_id, horario_id, sede_id, notas)
  VALUES (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, p_notas)
  RETURNING id, codigo_confirmacion INTO v_cita_id, v_codigo;

  RETURN QUERY SELECT v_cita_id, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
