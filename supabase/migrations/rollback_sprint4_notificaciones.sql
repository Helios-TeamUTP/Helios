-- ============================================================
-- ROLLBACK — Sprint 4 Notificaciones
-- Deshace por completo sprint4_notificaciones.sql.
-- Seguro: solo toca objetos creados por esa migracion. NO afecta citas,
-- citas_historial ni ninguna tabla del Sprint 1/2.
-- ============================================================

-- 1. Trigger y funcion generadora
DROP TRIGGER IF EXISTS trg_notificacion_desde_historial ON citas_historial;
DROP FUNCTION IF EXISTS crear_notificacion_desde_historial();

-- 2. RPCs de marcar leida
DROP FUNCTION IF EXISTS marcar_notificacion_leida(UUID);
DROP FUNCTION IF EXISTS marcar_todas_notificaciones_leidas();

-- 3. Sacar de la publicacion Realtime (si esta)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE notificaciones;
  END IF;
END $$;

-- 4. Policies + tabla (CASCADE quita las policies con la tabla)
DROP TABLE IF EXISTS notificaciones CASCADE;
