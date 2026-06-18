-- ============================================================
-- BUG-05 — Publicar la tabla `citas` en Realtime
-- ============================================================
-- Hace que la vista "Mis Citas" se actualice SOLA cuando una cita cambia
-- (cancelada, reprogramada, nueva), sin que el paciente recargue la página.
--
-- 100% ADITIVO, IDEMPOTENTE y SEGURO:
--   - Solo agrega `citas` a la publicación de Realtime que ya existe.
--   - NO crea/borra/modifica tablas ni datos. Cero pérdida de datos.
--   - Si `citas` ya estaba publicada, no hace nada.
--   - La seguridad RLS (B-14) sigue aplicando: cada paciente solo recibe en
--     vivo los cambios de SUS propias citas.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor (proyecto HELIOS).
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'citas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE citas;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Si la publicación es FOR ALL TABLES o ya incluye `citas`, no pasa nada.
  RAISE NOTICE 'citas en Realtime (probablemente ya incluida): %', SQLERRM;
END $$;

-- Verificación (opcional):
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname='supabase_realtime' AND tablename IN ('citas','notificaciones');
--   -- Esperado: ambas filas.
