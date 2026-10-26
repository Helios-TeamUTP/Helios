-- ============================================================================
-- Módulo 05 — Perfil · Seguridad: "solo nombre" a nivel de COLUMNA
--
-- PROBLEMA: las policies paciente_actualiza_su_perfil y medico_actualiza_su_perfil
-- (sprint6_modulo05_perfil.sql, sprint6_perfil_medico_nombre.sql) permiten
-- UPDATE de la fila propia, pero RLS no filtra por columna. Sin este blindaje,
-- llamando a la API REST directamente (sin pasar por la app):
--   - un paciente puede cambiar su propia cedula, correo o telefono;
--   - un medico puede cambiar su propia especialidad, sede o disponibilidad.
-- La restriccion "solo nombre" existia unicamente en el frontend.
-- Estas policies ya estan aplicadas en produccion desde el 2026-09-22.
--
-- SOLUCION: quitar el UPDATE a nivel de tabla y conceder SOLO la columna nombre.
-- La app solo envia { nombre } (useActualizarNombreEntidad), asi que no cambia
-- nada para el usuario. Verificado en main: ningun otro codigo actualiza
-- pacientes ni medicos con el rol authenticated (las funciones SECURITY DEFINER,
-- como el trigger crear_paciente_desde_signup, corren como su dueno y no se ven
-- afectadas). service_role tampoco.
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Es idempotente y transaccional.
-- Rollback: rollback_sprint6_perfil_blindar_columnas.sql
--
-- VERIFICACION despues de aplicar (ver bloque al final del archivo).
-- ============================================================================

BEGIN;

-- pacientes: solo 'nombre' es editable por el propio paciente.
REVOKE UPDATE ON public.pacientes FROM anon, authenticated;
GRANT  UPDATE (nombre) ON public.pacientes TO authenticated;

-- medicos: solo 'nombre' es editable por el propio medico.
REVOKE UPDATE ON public.medicos FROM anon, authenticated;
GRANT  UPDATE (nombre) ON public.medicos TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACION (ejecutar aparte, solo lectura)
-- ============================================================================
-- 1) Debe devolver EXACTAMENTE 2 filas: (pacientes, nombre) y (medicos, nombre).
--    Si aparece otra columna o un privilegio a nivel de tabla, algo quedo abierto.
--
--   SELECT table_name, column_name, privilege_type
--   FROM information_schema.column_privileges
--   WHERE table_schema = 'public'
--     AND table_name IN ('pacientes', 'medicos')
--     AND grantee = 'authenticated'
--     AND privilege_type = 'UPDATE'
--   ORDER BY table_name, column_name;
--
-- 2) No debe devolver filas: ya no hay UPDATE a nivel de tabla.
--
--   SELECT table_name, grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN ('pacientes', 'medicos')
--     AND privilege_type = 'UPDATE'
--     AND grantee IN ('anon', 'authenticated');
--
-- 3) Prueba funcional (con la app): editar el nombre del perfil debe seguir
--    funcionando. Un PATCH directo a /rest/v1/pacientes con { "cedula": "..." }
--    debe responder 403 "permission denied for table pacientes".
-- ============================================================================
