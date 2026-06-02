-- ============================================================
-- SPRINT 2 — Cancelar / Reprogramar citas (HELL-3)
-- Subtareas: ST-39 (historial) · ST-37 (cancelar) · ST-38 (reprogramar)
-- ============================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor (proyecto HELIOS).
-- Es IDEMPOTENTE: se puede correr varias veces sin romper nada.
--
-- Patrón seguido (igual que crear_cita_atomica de B-14):
--   - Funciones SECURITY DEFINER (controlan la lógica; el paciente NO puede
--     hacer UPDATE directo a citas, solo vía estas RPC validadas).
--   - Validan que el caller sea dueño del paciente vía auth_paciente_link.
--   - FOR UPDATE para lockear filas y evitar carreras (dos pacientes, mismo slot).
--   - REVOKE a anon + GRANT a authenticated.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- ARREGLO CRÍTICO (code review C-1/C-2): UNIQUE(horario_id) → PARCIAL
-- ─────────────────────────────────────────────────────────────
-- citas.horario_id tenía un UNIQUE TOTAL. Al cancelar dejamos estado=
-- 'cancelada' pero horario_id sigue apuntando al slot (para trazabilidad).
-- Sin este cambio, re-reservar ese slot (crear_cita_atomica = INSERT) o
-- reprogramar otra cita hacia él (UPDATE citas.horario_id) violaría el
-- UNIQUE(horario_id) y el slot quedaría imposible de reusar PARA SIEMPRE.
--
-- Solución: unicidad PARCIAL — solo aplica a citas NO canceladas. Así un slot
-- liberado se puede volver a usar y se conserva el horario_id en la cancelada.
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  -- Buscar (por nombre real, sea cual sea) el UNIQUE de una sola columna
  -- sobre citas.horario_id y eliminarlo.
  SELECT con.conname INTO v_constraint
  FROM pg_constraint con
  WHERE con.conrelid = 'citas'::regclass
    AND con.contype = 'u'
    AND con.conkey = ARRAY[
      (SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = 'citas'::regclass AND a.attname = 'horario_id')
    ];
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE citas DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

-- Índice único parcial: dos citas NO canceladas no pueden compartir horario.
CREATE UNIQUE INDEX IF NOT EXISTS citas_horario_activo_uk
  ON citas(horario_id)
  WHERE estado <> 'cancelada';


-- ─────────────────────────────────────────────────────────────
-- ST-39: Tabla de historial de cambios (auditoría)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas_historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id     UUID REFERENCES citas(id) ON DELETE CASCADE,
  accion      TEXT NOT NULL CHECK (accion IN (
                'creada', 'reprogramada', 'confirmada',
                'cancelada', 'completada', 'no_asistio')),
  actor_uid   UUID,
  actor_rol   TEXT CHECK (actor_rol IN ('paciente', 'medico') OR actor_rol IS NULL),
  detalle     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citas_historial_cita ON citas_historial(cita_id);

ALTER TABLE citas_historial ENABLE ROW LEVEL SECURITY;

-- SELECT: el paciente dueño ve el historial de SUS citas.
DROP POLICY IF EXISTS "paciente_ve_historial_de_sus_citas" ON citas_historial;
CREATE POLICY "paciente_ve_historial_de_sus_citas" ON citas_historial FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM citas c
    JOIN auth_paciente_link apl ON apl.paciente_id = c.paciente_id
    WHERE c.id = citas_historial.cita_id AND apl.auth_uid = auth.uid()
  )
);

-- SELECT: el médico asignado ve el historial de SUS citas.
DROP POLICY IF EXISTS "medico_ve_historial_de_sus_citas" ON citas_historial;
CREATE POLICY "medico_ve_historial_de_sus_citas" ON citas_historial FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM citas c
    JOIN auth_medico_link aml ON aml.medico_id = c.medico_id
    WHERE c.id = citas_historial.cita_id AND aml.auth_uid = auth.uid()
  )
);
-- Sin policy de INSERT: nadie inserta directo. Solo el trigger (SECURITY
-- DEFINER) registra. Default deny para authenticated/anon.


-- ─────────────────────────────────────────────────────────────
-- ST-39: Trigger que registra TODO cambio de estado/horario de una cita
-- ─────────────────────────────────────────────────────────────
-- Captura: creada (INSERT), cancelada/completada/no_asistio (cambio estado),
-- reprogramada (cambio horario_id). Funciona sin importar el origen del
-- cambio (RPC del paciente o UPDATE directo del médico).
CREATE OR REPLACE FUNCTION log_cita_historial() RETURNS TRIGGER AS $$
DECLARE
  v_accion TEXT;
  v_rol    TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_accion := 'creada';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
      v_accion := NEW.estado;                 -- cancelada / completada / no_asistio
    ELSIF NEW.horario_id IS DISTINCT FROM OLD.horario_id THEN
      v_accion := 'reprogramada';
    ELSE
      RETURN NEW;                             -- cambio irrelevante: no registrar
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Rol del actor (quién hizo el cambio).
  IF EXISTS (SELECT 1 FROM auth_medico_link WHERE auth_uid = auth.uid()) THEN
    v_rol := 'medico';
  ELSIF EXISTS (SELECT 1 FROM auth_paciente_link WHERE auth_uid = auth.uid()) THEN
    v_rol := 'paciente';
  ELSE
    v_rol := NULL;                            -- seed / service_role
  END IF;

  INSERT INTO citas_historial (cita_id, accion, actor_uid, actor_rol, detalle)
  VALUES (
    NEW.id, v_accion, auth.uid(), v_rol,
    jsonb_build_object(
      'estado_anterior',  CASE WHEN TG_OP = 'UPDATE' THEN OLD.estado     ELSE NULL END,
      'estado_nuevo',     NEW.estado,
      'horario_anterior', CASE WHEN TG_OP = 'UPDATE' THEN OLD.horario_id ELSE NULL END,
      'horario_nuevo',    NEW.horario_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cita_historial_insert ON citas;
CREATE TRIGGER trg_cita_historial_insert
  AFTER INSERT ON citas
  FOR EACH ROW EXECUTE FUNCTION log_cita_historial();

DROP TRIGGER IF EXISTS trg_cita_historial_update ON citas;
CREATE TRIGGER trg_cita_historial_update
  AFTER UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION log_cita_historial();


-- ─────────────────────────────────────────────────────────────
-- ST-37: cancelar_cita_atomica(p_cita_id)
-- ─────────────────────────────────────────────────────────────
-- Cancela una cita confirmada del paciente y libera su horario. Atómico.
CREATE OR REPLACE FUNCTION cancelar_cita_atomica(p_cita_id UUID)
RETURNS TABLE(cita_id UUID, nuevo_estado TEXT) AS $$
DECLARE
  v_paciente_id UUID;
  v_horario_id  UUID;
  v_estado      TEXT;
BEGIN
  -- Lockear la cita.
  SELECT paciente_id, horario_id, estado
    INTO v_paciente_id, v_horario_id, v_estado
    FROM citas WHERE id = p_cita_id FOR UPDATE;

  IF v_paciente_id IS NULL THEN
    RAISE EXCEPTION 'La cita no existe';
  END IF;

  -- Solo el dueño del paciente puede cancelar.
  IF NOT EXISTS (
    SELECT 1 FROM auth_paciente_link
    WHERE auth_uid = auth.uid() AND paciente_id = v_paciente_id
  ) THEN
    RAISE EXCEPTION 'No autorizado: la cita no pertenece al usuario actual';
  END IF;

  IF v_estado <> 'confirmada' THEN
    RAISE EXCEPTION 'Solo se pueden cancelar citas confirmadas (estado actual: %)', v_estado;
  END IF;

  -- Cancelar + liberar el horario (el trigger registra el cambio).
  UPDATE citas SET estado = 'cancelada' WHERE id = p_cita_id;
  IF v_horario_id IS NOT NULL THEN
    UPDATE horarios SET disponible = true WHERE id = v_horario_id;
  END IF;

  RETURN QUERY SELECT p_cita_id, 'cancelada'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION cancelar_cita_atomica(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION cancelar_cita_atomica(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- ST-38: reprogramar_cita_atomica(p_cita_id, p_nuevo_horario_id)
-- ─────────────────────────────────────────────────────────────
-- Cambia la cita a otro horario disponible del MISMO médico. Libera el viejo,
-- reserva el nuevo y actualiza la cita. Todo atómico, con locks.
CREATE OR REPLACE FUNCTION reprogramar_cita_atomica(p_cita_id UUID, p_nuevo_horario_id UUID)
RETURNS TABLE(cita_id UUID, nuevo_horario_id UUID) AS $$
DECLARE
  v_paciente_id   UUID;
  v_medico_id     UUID;
  v_horario_viejo UUID;
  v_estado        TEXT;
  v_nuevo_medico  UUID;
  v_nuevo_disp    BOOLEAN;
BEGIN
  -- Lockear la cita.
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

  -- Lockear y validar el nuevo horario.
  -- Nota (code review A-1): orden de locks = cita -> horario nuevo. El FOR
  -- UPDATE sobre el horario serializa a dos pacientes que compiten por el
  -- mismo slot (no pueden tomarlo ambos). Riesgo de deadlock es teórico y
  -- bajísimo al volumen del proyecto; si escalara, lockear horarios por
  -- orden de UUID.
  SELECT medico_id, disponible INTO v_nuevo_medico, v_nuevo_disp
    FROM horarios WHERE id = p_nuevo_horario_id FOR UPDATE;

  IF v_nuevo_disp IS NULL THEN
    RAISE EXCEPTION 'El nuevo horario no existe';
  END IF;
  IF v_nuevo_disp = false THEN
    RAISE EXCEPTION 'El nuevo horario ya está reservado';
  END IF;
  IF v_nuevo_medico <> v_medico_id THEN
    RAISE EXCEPTION 'El nuevo horario debe ser del mismo médico';
  END IF;

  -- Swap atómico: liberar viejo, reservar nuevo, actualizar cita.
  -- (El trigger registra la reprogramación.)
  IF v_horario_viejo IS NOT NULL THEN
    UPDATE horarios SET disponible = true WHERE id = v_horario_viejo;
  END IF;
  UPDATE horarios SET disponible = false WHERE id = p_nuevo_horario_id;
  UPDATE citas    SET horario_id = p_nuevo_horario_id WHERE id = p_cita_id;

  RETURN QUERY SELECT p_cita_id, p_nuevo_horario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION reprogramar_cita_atomica(UUID, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION reprogramar_cita_atomica(UUID, UUID) TO authenticated;


-- ============================================================
-- Verificación rápida (opcional): que las 2 funciones existen
-- ============================================================
-- SELECT proname FROM pg_proc WHERE proname IN
--   ('cancelar_cita_atomica','reprogramar_cita_atomica','log_cita_historial');
-- Esperado: 3 filas.
