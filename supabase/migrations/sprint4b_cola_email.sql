-- ============================================================
-- SPRINT 4b — Encolar correos (HELL-5 · Fase C)
-- ============================================================
-- El trigger de notificaciones ahora crea, ademas de la fila in-app (campanita),
-- una fila canal='email' estado='pendiente'. El worker de Railho la procesa,
-- envia por Gmail y la marca 'enviado'.
--
-- 100% ADITIVO y seguro: solo reemplaza la funcion del trigger (CREATE OR
-- REPLACE). No toca tablas ni datos. Sigue blindado (EXCEPTION) para que una
-- notificacion jamas rompa una cita. Idempotente.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor.
-- ============================================================

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

  -- PACIENTE: campanita (in_app) + correo (email, pendiente para el worker)
  IF v_pac IS NOT NULL THEN
    BEGIN
      INSERT INTO notificaciones (paciente_id, cita_id, destinatario, tipo, titulo, mensaje, canal, estado)
      VALUES (v_pac, NEW.cita_id, 'paciente', NEW.accion, v_tit_p, v_msg_p, 'in_app', 'no_aplica');
      INSERT INTO notificaciones (paciente_id, cita_id, destinatario, tipo, titulo, mensaje, canal, estado)
      VALUES (v_pac, NEW.cita_id, 'paciente', NEW.accion, v_tit_p, v_msg_p, 'email', 'pendiente');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notif paciente (cita %): %', NEW.cita_id, SQLERRM;
    END;
  END IF;

  -- MEDICO: campanita (in_app) + correo (email, pendiente para el worker)
  IF v_med IS NOT NULL THEN
    BEGIN
      INSERT INTO notificaciones (medico_id, cita_id, destinatario, tipo, titulo, mensaje, canal, estado)
      VALUES (v_med, NEW.cita_id, 'medico', NEW.accion, v_tit_m, v_msg_m, 'in_app', 'no_aplica');
      INSERT INTO notificaciones (medico_id, cita_id, destinatario, tipo, titulo, mensaje, canal, estado)
      VALUES (v_med, NEW.cita_id, 'medico', NEW.accion, v_tit_m, v_msg_m, 'email', 'pendiente');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notif medico (cita %): %', NEW.cita_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Notificacion no generada (cita %): %', NEW.cita_id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- El trigger ya existe (de sprint4_notificaciones.sql); esta migracion solo
-- actualiza la funcion. No hace falta recrear el trigger.
