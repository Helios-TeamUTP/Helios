-- ============================================================
-- SPRINT 4 — Notificaciones (HELL-5) · DISEÑO FUSIONADO
-- Campanita in-app en tiempo real + campos listos para correo (Fase C).
-- ============================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor (proyecto HELIOS).
--
-- CONTEXTO: existia una tabla `notificaciones` BORRADOR (vacia, 0 filas) con un
-- diseño orientado a correo (canal/estado/enviado_at). El equipo decidio
-- FUSIONAR: una sola tabla que sirve para la campanita in-app Y para el correo.
-- Como el borrador esta vacio, se reemplaza sin perder datos.
--
-- SEGURIDAD / "no danar nada":
--   - Solo reemplaza la tabla `notificaciones` SI esta vacia (guard que aborta
--     si tuviera datos). NO toca citas, horarios, pacientes, etc.
--   - NO toca las RPC de crear/cancelar/reprogramar ni el trigger del Sprint 2.
--   - El trigger de notificaciones esta envuelto en EXCEPTION: si algo fallara,
--     la operacion de la cita NO se revierte (una notificacion jamas rompe una cita).
--   - RLS estricto: cada quien ve SOLO lo suyo. Nadie inserta directo.
--
-- Rollback: supabase/migrations/rollback_sprint4_notificaciones.sql
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Reemplazo SEGURO del borrador vacio
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notificaciones'
  ) THEN
    IF (SELECT count(*) FROM notificaciones) > 0 THEN
      RAISE EXCEPTION
        'ABORTADO: notificaciones tiene datos; no la reemplazo para no perderlos. Revisar manualmente.';
    END IF;
    -- Borrador vacio: lo quitamos (CASCADE limpia sus policies/indices viejos).
    DROP TABLE notificaciones CASCADE;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 1. Tabla fusionada
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notificaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Destinatario: paciente XOR medico
  paciente_id   UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id     UUID REFERENCES medicos(id)   ON DELETE CASCADE,
  cita_id       UUID REFERENCES citas(id)     ON DELETE SET NULL,
  destinatario  TEXT NOT NULL CHECK (destinatario IN ('paciente', 'medico')),
  tipo          TEXT NOT NULL CHECK (tipo IN (
                  'creada', 'reprogramada', 'cancelada',
                  'recordatorio', 'bienvenida')),
  -- Contenido (campanita in-app)
  titulo        TEXT NOT NULL,
  mensaje       TEXT NOT NULL,
  leida         BOOLEAN NOT NULL DEFAULT false,
  -- Envio (correo) — del diseño previo, listo para la Fase C
  canal         TEXT NOT NULL DEFAULT 'in_app'
                  CHECK (canal IN ('in_app', 'email')),
  estado        TEXT NOT NULL DEFAULT 'no_aplica'
                  CHECK (estado IN ('pendiente', 'enviado', 'fallido', 'no_aplica')),
  enviado_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notif_destinatario_coherente CHECK (
    (destinatario = 'paciente' AND paciente_id IS NOT NULL) OR
    (destinatario = 'medico'   AND medico_id   IS NOT NULL)
  )
);

CREATE INDEX idx_notif_paciente   ON notificaciones(paciente_id, leida);
CREATE INDEX idx_notif_medico     ON notificaciones(medico_id, leida);
-- Cola de correo para la Fase C (worker buscara canal='email' y estado='pendiente').
CREATE INDEX idx_notif_email_cola ON notificaciones(canal, estado)
  WHERE canal = 'email' AND estado = 'pendiente';


-- ─────────────────────────────────────────────────────────────
-- 2. RLS — cada quien ve SOLO lo suyo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_paciente_select" ON notificaciones;
CREATE POLICY "notif_paciente_select" ON notificaciones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth_paciente_link apl
    WHERE apl.paciente_id = notificaciones.paciente_id
      AND apl.auth_uid = auth.uid()
  )
);

DROP POLICY IF EXISTS "notif_medico_select" ON notificaciones;
CREATE POLICY "notif_medico_select" ON notificaciones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.medico_id = notificaciones.medico_id
      AND aml.auth_uid = auth.uid()
  )
);

-- Sin policy de INSERT/UPDATE/DELETE para authenticated/anon: default DENY.
-- El trigger (SECURITY DEFINER) inserta; marcar-leida va por RPC validada.


-- ─────────────────────────────────────────────────────────────
-- 3. Realtime — publicar la tabla (a prueba de errores)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Si la publicacion es FOR ALL TABLES o ya incluye la tabla, no pasa nada:
  -- Realtime igual funcionara. No abortamos la migracion por esto.
  RAISE NOTICE 'No se agrego a supabase_realtime (probablemente ya incluida): %', SQLERRM;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 4. Trigger: cada evento de cita -> notificaciones in-app (paciente + medico)
-- ─────────────────────────────────────────────────────────────
-- Se dispara cuando citas_historial registra 'creada'/'reprogramada'/'cancelada'.
-- BLINDAJE: todo el cuerpo va en EXCEPTION. Si algo fallara, la operacion de la
-- cita NO se revierte — una notificacion jamas debe romper una cita.
CREATE OR REPLACE FUNCTION crear_notificacion_desde_historial()
RETURNS TRIGGER AS $$
DECLARE
  v_pac      UUID;
  v_med      UUID;
  v_fecha    DATE;
  v_hora     TIME;
  v_med_nom  TEXT;
  v_pac_nom  TEXT;
  v_sede_nom TEXT;
  v_cuando   TEXT;
  v_tit_p    TEXT;
  v_msg_p    TEXT;
  v_tit_m    TEXT;
  v_msg_m    TEXT;
BEGIN
  IF NEW.accion NOT IN ('creada', 'reprogramada', 'cancelada') THEN
    RETURN NEW;
  END IF;

  SELECT c.paciente_id, c.medico_id, h.fecha, h.hora_inicio,
         m.nombre, p.nombre, s.nombre
    INTO v_pac, v_med, v_fecha, v_hora, v_med_nom, v_pac_nom, v_sede_nom
    FROM citas c
    LEFT JOIN horarios  h ON h.id = c.horario_id
    LEFT JOIN medicos   m ON m.id = c.medico_id
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    LEFT JOIN sedes     s ON s.id = c.sede_id
   WHERE c.id = NEW.cita_id;

  v_cuando := COALESCE(to_char(v_fecha, 'DD/MM/YYYY'), 'fecha por confirmar')
              || COALESCE(' a las ' || to_char(v_hora, 'HH24:MI'), '');

  IF NEW.accion = 'creada' THEN
    v_tit_p := 'Cita confirmada';
    v_msg_p := 'Tu cita con ' || COALESCE(v_med_nom, 'tu médico') ||
               ' quedó agendada para el ' || v_cuando ||
               COALESCE(' en ' || v_sede_nom, '') || '.';
    v_tit_m := 'Nueva cita agendada';
    v_msg_m := COALESCE(v_pac_nom, 'Un paciente') ||
               ' agendó una cita contigo para el ' || v_cuando || '.';
  ELSIF NEW.accion = 'reprogramada' THEN
    v_tit_p := 'Cita reprogramada';
    v_msg_p := 'Tu cita con ' || COALESCE(v_med_nom, 'tu médico') ||
               ' cambió al ' || v_cuando || '.';
    v_tit_m := 'Cita reprogramada';
    v_msg_m := COALESCE(v_pac_nom, 'Un paciente') ||
               ' reprogramó su cita al ' || v_cuando || '.';
  ELSE  -- cancelada
    v_tit_p := 'Cita cancelada';
    v_msg_p := 'Tu cita del ' || v_cuando || ' fue cancelada.';
    v_tit_m := 'Cita cancelada';
    v_msg_m := COALESCE(v_pac_nom, 'Un paciente') ||
               ' canceló su cita del ' || v_cuando || '.';
  END IF;

  -- M1: cada insert en su propio bloque, para que un fallo en la del medico
  -- no descarte la del paciente (y viceversa). Best-effort por destinatario.
  IF v_pac IS NOT NULL THEN
    BEGIN
      INSERT INTO notificaciones (paciente_id, cita_id, destinatario, tipo,
                                  titulo, mensaje, canal, estado)
      VALUES (v_pac, NEW.cita_id, 'paciente', NEW.accion,
              v_tit_p, v_msg_p, 'in_app', 'no_aplica');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notif paciente no generada (cita %): %', NEW.cita_id, SQLERRM;
    END;
  END IF;
  IF v_med IS NOT NULL THEN
    BEGIN
      INSERT INTO notificaciones (medico_id, cita_id, destinatario, tipo,
                                  titulo, mensaje, canal, estado)
      VALUES (v_med, NEW.cita_id, 'medico', NEW.accion,
              v_tit_m, v_msg_m, 'in_app', 'no_aplica');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notif medico no generada (cita %): %', NEW.cita_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- BLINDAJE: la notificacion fallo, pero la cita NO se revierte.
  RAISE NOTICE 'Notificacion no generada para cita %: %', NEW.cita_id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_notificacion_desde_historial ON citas_historial;
CREATE TRIGGER trg_notificacion_desde_historial
  AFTER INSERT ON citas_historial
  FOR EACH ROW EXECUTE FUNCTION crear_notificacion_desde_historial();


-- ─────────────────────────────────────────────────────────────
-- 5. RPC: marcar como leida (solo el dueño)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notificaciones n
     SET leida = true
   WHERE n.id = p_id
     AND (
       EXISTS (SELECT 1 FROM auth_paciente_link apl
               WHERE apl.paciente_id = n.paciente_id AND apl.auth_uid = auth.uid())
       OR
       EXISTS (SELECT 1 FROM auth_medico_link aml
               WHERE aml.medico_id = n.medico_id AND aml.auth_uid = auth.uid())
     );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION marcar_todas_notificaciones_leidas()
RETURNS VOID AS $$
BEGIN
  UPDATE notificaciones n
     SET leida = true
   WHERE n.leida = false
     AND (
       EXISTS (SELECT 1 FROM auth_paciente_link apl
               WHERE apl.paciente_id = n.paciente_id AND apl.auth_uid = auth.uid())
       OR
       EXISTS (SELECT 1 FROM auth_medico_link aml
               WHERE aml.medico_id = n.medico_id AND aml.auth_uid = auth.uid())
     );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION marcar_notificacion_leida(UUID)        FROM anon;
GRANT  EXECUTE ON FUNCTION marcar_notificacion_leida(UUID)        TO authenticated;
REVOKE EXECUTE ON FUNCTION marcar_todas_notificaciones_leidas()   FROM anon;
GRANT  EXECUTE ON FUNCTION marcar_todas_notificaciones_leidas()   TO authenticated;


-- ============================================================
-- Verificacion rapida (opcional):
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='notificaciones' ORDER BY ordinal_position;
--   -- Esperado: id, paciente_id, medico_id, cita_id, destinatario, tipo,
--   --           titulo, mensaje, leida, canal, estado, enviado_at, created_at
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('crear_notificacion_desde_historial',
--      'marcar_notificacion_leida','marcar_todas_notificaciones_leidas');
--   -- Esperado: 3 filas.
-- ============================================================
