-- ============================================================
-- SPRINT 5 — Límite de citas por médico por día (tope 15)
-- ============================================================
-- Tope de 15 basado en la recomendación de un médico real de salud pública
-- que probó HELIOS (su carga diaria típica gestionando consultas).
-- Un médico no puede tener más de 15 citas NO canceladas el mismo día
-- (confirmada + completada + no_asistio; algunas consultas duran más de
-- una hora → un tope realista de la agenda física del médico).
--
-- Ejecutar en: Supabase Dashboard > SQL Editor (proyecto HELIOS).
-- Es IDEMPOTENTE (CREATE OR REPLACE) y 100% ADITIVO: no crea ni borra
-- columnas, no toca datos, no cambia las firmas de crear/reprogramar.
--
-- ⚠️ Orden de ejecución: correr DESPUÉS de sprint2_cancelar_reprogramar.sql.
--    Si se re-corriera sprint2 después de este archivo, revertiría el tope en
--    reprogramar_cita_atomica → volver a correr este archivo.
--
-- Capas de defensa:
--   1. crear_cita_atomica       -> rechaza la cita #7 del día (con lock).
--   2. reprogramar_cita_atomica -> no deja mover una cita a un día lleno.
--   3. horarios_agendables      -> el frontend sabe qué días están completos.
--
-- Endurecimiento (review adversarial Sprint 5):
--   - El conteo usa `estado <> 'cancelada'` (no solo 'confirmada') para que las
--     citas que el médico marca 'completada'/'no_asistio' SIGAN contando: si no,
--     el día se "reabriría" y podría superar 6 visitas físicas.
--   - horarios_agendables se concede SOLO a authenticated (no a anon): es
--     SECURITY DEFINER y saltaría la RLS `autenticado_lee_horarios` de B-14.
--   - Las 3 funciones fijan `SET search_path = public, pg_temp` (advisor Supabase
--     function_search_path_mutable + evita hijacking de resolución de nombres).
--
-- Concurrencia: pg_advisory_xact_lock por (medico, fecha) serializa a dos
-- pacientes que agendan slots DISTINTOS del mismo día. Sin ese lock, ambos
-- podrían contar 5 y crear la #6 y #7 a la vez. Correcto bajo READ COMMITTED
-- (default de Supabase): el count() re-lee tras adquirir el advisory y ve el
-- commit del competidor.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. crear_cita_atomica: agregar el tope de 15 citas/día
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION crear_cita_atomica(
  p_paciente_id UUID,
  p_medico_id UUID,
  p_horario_id UUID,
  p_sede_id UUID,
  p_notas TEXT DEFAULT NULL
) RETURNS TABLE(cita_id UUID, codigo TEXT) AS $$
DECLARE
  c_max_citas_dia CONSTANT INT := 15;   -- tope fijo de citas por médico por día
  v_disponible BOOLEAN;
  v_fecha      DATE;
  v_citas_dia  INT;
  v_cita_id    UUID;
  v_codigo     TEXT;
BEGIN
  -- B-14: el caller debe ser dueño del paciente.
  IF NOT EXISTS (
    SELECT 1 FROM auth_paciente_link
    WHERE auth_uid = auth.uid() AND paciente_id = p_paciente_id
  ) THEN
    RAISE EXCEPTION 'No autorizado: el paciente no corresponde al usuario actual';
  END IF;

  -- Lockear el slot y traer su fecha.
  SELECT disponible, fecha INTO v_disponible, v_fecha
    FROM horarios WHERE id = p_horario_id FOR UPDATE;
  IF v_disponible IS NULL THEN
    RAISE EXCEPTION 'Horario no existe';
  END IF;
  IF v_disponible = false THEN
    RAISE EXCEPTION 'Horario ya reservado';
  END IF;

  -- Sprint 5: tope de citas por médico por día.
  -- Advisory lock por (medico, fecha): serializa los agendamientos del mismo
  -- día para que dos pacientes en slots distintos no excedan el tope.
  PERFORM pg_advisory_xact_lock(hashtext(p_medico_id::text), hashtext(v_fecha::text));

  SELECT count(*) INTO v_citas_dia
    FROM citas c
    JOIN horarios h ON h.id = c.horario_id
   WHERE c.medico_id = p_medico_id
     AND h.fecha = v_fecha
     AND c.estado <> 'cancelada';   -- cuenta confirmada + completada + no_asistio

  IF v_citas_dia >= c_max_citas_dia THEN
    RAISE EXCEPTION 'El medico ya alcanzo el maximo de % citas para ese dia. Elige otro dia.', c_max_citas_dia;
  END IF;

  -- Reservar el slot + crear la cita (el trigger registra e-notifica).
  UPDATE horarios SET disponible = false WHERE id = p_horario_id;

  INSERT INTO citas (paciente_id, medico_id, horario_id, sede_id, notas)
  VALUES (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, p_notas)
  RETURNING id, codigo_confirmacion INTO v_cita_id, v_codigo;

  RETURN QUERY SELECT v_cita_id, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION crear_cita_atomica(UUID, UUID, UUID, UUID, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION crear_cita_atomica(UUID, UUID, UUID, UUID, TEXT) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 2. reprogramar_cita_atomica: respetar el tope en el día DESTINO
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reprogramar_cita_atomica(p_cita_id UUID, p_nuevo_horario_id UUID)
RETURNS TABLE(cita_id UUID, nuevo_horario_id UUID) AS $$
DECLARE
  c_max_citas_dia CONSTANT INT := 15;
  v_paciente_id   UUID;
  v_medico_id     UUID;
  v_horario_viejo UUID;
  v_estado        TEXT;
  v_nuevo_medico  UUID;
  v_nuevo_disp    BOOLEAN;
  v_nueva_fecha   DATE;
  v_citas_dia     INT;
BEGIN
  SELECT paciente_id, medico_id, horario_id, estado
    INTO v_paciente_id, v_medico_id, v_horario_viejo, v_estado
    FROM citas WHERE id = p_cita_id FOR UPDATE;

  IF v_paciente_id IS NULL THEN
    RAISE EXCEPTION 'La cita no existe';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth_paciente_link
    WHERE auth_uid = auth.uid() AND paciente_id = v_paciente_id
  ) THEN
    RAISE EXCEPTION 'No autorizado: la cita no pertenece al usuario actual';
  END IF;
  IF v_estado <> 'confirmada' THEN
    RAISE EXCEPTION 'Solo se pueden reprogramar citas confirmadas (estado actual: %)', v_estado;
  END IF;
  IF p_nuevo_horario_id = v_horario_viejo THEN
    RAISE EXCEPTION 'El nuevo horario es el mismo que el actual';
  END IF;

  SELECT medico_id, disponible, fecha INTO v_nuevo_medico, v_nuevo_disp, v_nueva_fecha
    FROM horarios WHERE id = p_nuevo_horario_id FOR UPDATE;
  IF v_nuevo_disp IS NULL THEN
    RAISE EXCEPTION 'El nuevo horario no existe';
  END IF;
  IF v_nuevo_disp = false THEN
    RAISE EXCEPTION 'El nuevo horario ya esta reservado';
  END IF;
  IF v_nuevo_medico <> v_medico_id THEN
    RAISE EXCEPTION 'El nuevo horario debe ser del mismo medico';
  END IF;

  -- Sprint 5: no reprogramar hacia un día que ya llegó al tope.
  -- Excluimos la PROPIA cita del conteo: si se reprograma dentro del mismo día
  -- ya ocupa un cupo ahí y no debe contarse dos veces.
  PERFORM pg_advisory_xact_lock(hashtext(v_medico_id::text), hashtext(v_nueva_fecha::text));

  SELECT count(*) INTO v_citas_dia
    FROM citas c
    JOIN horarios h ON h.id = c.horario_id
   WHERE c.medico_id = v_medico_id
     AND h.fecha = v_nueva_fecha
     AND c.estado <> 'cancelada'
     AND c.id <> p_cita_id;

  IF v_citas_dia >= c_max_citas_dia THEN
    RAISE EXCEPTION 'El medico ya alcanzo el maximo de % citas para ese dia. Elige otro dia.', c_max_citas_dia;
  END IF;

  -- Swap atómico (el trigger registra la reprogramación).
  -- Nota (review A-1 sprint2 + Sprint 5): el advisory se sostiene mientras se
  -- lockea el horario viejo; hoy no hay deadlock por la invariante (un slot con
  -- cita no-cancelada tiene disponible=false, y crear/reprogramar-destino
  -- abortan en el chequeo de disponible ANTES del advisory). Si se rompiera esa
  -- invariante, lockear horarios en orden de UUID.
  IF v_horario_viejo IS NOT NULL THEN
    UPDATE horarios SET disponible = true WHERE id = v_horario_viejo;
  END IF;
  UPDATE horarios SET disponible = false WHERE id = p_nuevo_horario_id;
  UPDATE citas    SET horario_id = p_nuevo_horario_id WHERE id = p_cita_id;

  RETURN QUERY SELECT p_cita_id, p_nuevo_horario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION reprogramar_cita_atomica(UUID, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION reprogramar_cita_atomica(UUID, UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 3. horarios_agendables: slots libres + flag "día completo"
-- ─────────────────────────────────────────────────────────────
-- El paciente (por RLS de B-14) NO puede contar las citas de un médico, así
-- que no puede saber por sí mismo qué días están llenos. Esta RPC SECURITY
-- DEFINER lo resuelve: devuelve los slots disponibles del médico marcando con
-- `dia_completo` los días que ya llegaron al tope. NO expone ningún dato de
-- otros pacientes (solo columnas de `horarios` + un booleano agregado).
--
-- p_hoy: fecha local del cliente (timezone-safe); el filtro de horas ya pasadas
--        de hoy lo hace el frontend.
-- p_excluir_cita_id: al reprogramar, la cita que se está moviendo NO debe
--        contarse (si no, un día en el tope donde una de las citas es la propia
--        marcaría dia_completo=true y bloquearía en la UI un cambio del mismo
--        día que el backend SÍ permite). NULL al agendar una cita nueva.
CREATE OR REPLACE FUNCTION horarios_agendables(
  p_medico_id       UUID,
  p_hoy             DATE DEFAULT current_date,
  p_excluir_cita_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id           UUID,
  medico_id    UUID,
  fecha        DATE,
  hora_inicio  TIME,
  hora_fin     TIME,
  disponible   BOOLEAN,
  created_at   TIMESTAMPTZ,
  dia_completo BOOLEAN
) AS $$
DECLARE
  c_max_citas_dia CONSTANT INT := 15;
BEGIN
  RETURN QUERY
  WITH citas_por_dia AS (
    SELECT h.fecha AS f, count(*) AS n
      FROM citas c
      JOIN horarios h ON h.id = c.horario_id
     WHERE c.medico_id = p_medico_id
       AND c.estado <> 'cancelada'
       AND h.fecha >= p_hoy
       AND (p_excluir_cita_id IS NULL OR c.id <> p_excluir_cita_id)
     GROUP BY h.fecha
  )
  SELECT ho.id, ho.medico_id, ho.fecha, ho.hora_inicio, ho.hora_fin,
         ho.disponible, ho.created_at,
         (COALESCE(cpd.n, 0) >= c_max_citas_dia) AS dia_completo
    FROM horarios ho
    LEFT JOIN citas_por_dia cpd ON cpd.f = ho.fecha
   WHERE ho.medico_id = p_medico_id
     AND ho.disponible = true
     AND ho.fecha >= p_hoy
   ORDER BY ho.fecha, ho.hora_inicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Solo authenticated: es SECURITY DEFINER y saltaría la RLS de horarios (B-14).
REVOKE EXECUTE ON FUNCTION horarios_agendables(UUID, DATE, UUID) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION horarios_agendables(UUID, DATE, UUID) TO authenticated;


-- ============================================================
-- Verificación (opcional, correr después):
--   SELECT proname FROM pg_proc
--    WHERE proname IN ('crear_cita_atomica','reprogramar_cita_atomica','horarios_agendables');
--   -- Esperado: 3 filas.
-- ============================================================
