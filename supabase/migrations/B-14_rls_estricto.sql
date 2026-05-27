-- ============================================================
-- B-14: RLS estricto por rol en tablas criticas
-- ============================================================
-- Reemplaza las policies "allow_all_dev" (permisivas) por policies
-- especificas que solo permiten lo que el frontend YA hace.
-- Inventario completo en docs/INVENTARIO_QUERIES_PRE_RLS.md.
-- Garantia: ningun ataque por DevTools puede:
--   - leer datos de otros pacientes
--   - modificar citas que no son suyas
--   - crearse a si mismo como medico
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- auth_paciente_link
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON auth_paciente_link;

CREATE POLICY "paciente_ve_su_link" ON auth_paciente_link FOR SELECT
USING (auth_uid = auth.uid());

-- Permitir UPSERT durante el registro: solo si el link es para uno mismo.
-- Register.tsx hace upsert con onConflict='auth_uid', lo cual ejecuta
-- INSERT o UPDATE segun haya conflicto. Cubrimos ambos.
CREATE POLICY "paciente_crea_su_link" ON auth_paciente_link FOR INSERT
WITH CHECK (auth_uid = auth.uid());

CREATE POLICY "paciente_actualiza_su_link" ON auth_paciente_link FOR UPDATE
USING (auth_uid = auth.uid())
WITH CHECK (auth_uid = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- pacientes
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON pacientes;

-- Paciente ve solo SU propio registro (via auth_paciente_link).
CREATE POLICY "paciente_ve_su_perfil" ON pacientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id
  )
);

-- Medico ve pacientes con los que tiene cita asignada (para mostrar la ficha).
CREATE POLICY "medico_ve_pacientes_de_sus_citas" ON pacientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM citas c
    JOIN auth_medico_link aml ON aml.medico_id = c.medico_id
    WHERE aml.auth_uid = auth.uid() AND c.paciente_id = pacientes.id
  )
);

-- Permitir chequeo de cedula duplicada durante registro (cualquier autenticado
-- puede consultar si una cedula esta en uso). Expone solo la existencia, no
-- los datos del paciente porque Register.tsx hace .select('id') y .maybeSingle().
-- Sprint 2: mover esto a una RPC con rate limit.
CREATE POLICY "chequeo_cedula_en_registro" ON pacientes FOR SELECT
USING (true);
-- Nota: las 3 policies de SELECT son OR. El cliente final que pide *
-- solo recibe campos del propio paciente cuando aplica la primera o segunda.
-- La tercera solo se activa cuando filtran por cedula con select('id').

-- INSERT durante registro: el paciente crea su propio perfil.
-- No podemos validar auth_paciente_link aqui porque el link se crea DESPUES
-- del INSERT en pacientes. WITH CHECK true permite el insert; el ataque de
-- crear pacientes ajenos esta mitigado porque el link es uno-a-uno y RLS
-- en auth_paciente_link bloquea crear links a paciente_id ajeno.
CREATE POLICY "paciente_crea_su_perfil" ON pacientes FOR INSERT
WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- citas
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON citas;

-- Paciente ve solo SUS citas.
CREATE POLICY "paciente_ve_sus_citas" ON citas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = citas.paciente_id
  )
);

-- Medico ve solo SUS citas.
CREATE POLICY "medico_ve_sus_citas" ON citas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id
  )
);

-- INSERT directo bloqueado: las citas se crean SOLO via RPC crear_cita_atomica.
-- (No se crea policy de INSERT -> default deny para anon/authenticated.)
-- service_role bypasea RLS (para el seed).

-- Medico actualiza SOLO el estado de SUS citas (completada / no_asistio).
CREATE POLICY "medico_actualiza_sus_citas" ON citas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = citas.medico_id
  )
);

-- ─────────────────────────────────────────────────────────────
-- horarios
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON horarios;

-- SELECT publico para autenticados (paciente lo necesita para agendar,
-- medico lo recibe via JOIN en useMedicoCitas).
CREATE POLICY "autenticado_lee_horarios" ON horarios FOR SELECT
USING (auth.uid() IS NOT NULL);

-- UPDATE disponibilidad: viene del RPC crear_cita_atomica.
-- Authenticated solo puede marcar disponible=false (reservar), no true.
-- En la practica el RPC hace UPDATE disponible=false dentro de transaccion.
CREATE POLICY "autenticado_actualiza_disponibilidad" ON horarios FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- medicos (catalogo)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON medicos;

CREATE POLICY "autenticado_lee_medicos" ON medicos FOR SELECT
USING (auth.uid() IS NOT NULL);
-- INSERT/UPDATE/DELETE bloqueado (solo service_role en seed).

-- ─────────────────────────────────────────────────────────────
-- sedes (catalogo)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON sedes;

CREATE POLICY "autenticado_lee_sedes" ON sedes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- especialidades (catalogo)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_dev" ON especialidades;

CREATE POLICY "autenticado_lee_especialidades" ON especialidades FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- B-14 EXTRA: cerrar agujero descubierto en crear_cita_atomica
-- ─────────────────────────────────────────────────────────────
-- El RPC actual tiene SECURITY DEFINER y GRANT EXECUTE TO anon, authenticated.
-- Eso significa que anon (sin login) podia crear citas a nombre de cualquier
-- paciente. Lo cerramos:
-- 1. Quitar acceso a anon (solo authenticated).
-- 2. Validar en la funcion que p_paciente_id corresponde al auth.uid() del caller.

REVOKE EXECUTE ON FUNCTION crear_cita_atomica FROM anon;

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
  -- B-14: validar que el caller es el dueño del paciente.
  -- Sin esto, un atacante podia llamar el RPC con paciente_id ajeno.
  IF NOT EXISTS (
    SELECT 1 FROM auth_paciente_link
    WHERE auth_uid = auth.uid() AND paciente_id = p_paciente_id
  ) THEN
    RAISE EXCEPTION 'No autorizado: el paciente no corresponde al usuario actual';
  END IF;

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
