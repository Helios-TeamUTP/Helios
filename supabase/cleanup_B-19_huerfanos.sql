-- ============================================================
-- B-19: Cleanup de cuentas huerfanas tras el bug del signUp
-- ============================================================
-- Causa: Register.tsx no chequeaba si signUp devolvia session=null.
-- Sin session, el upsert en auth_paciente_link fallaba silente por RLS
-- (auth.uid() es NULL para cliente anon). Resultado: rows en auth.users
-- y pacientes sin link entre ellos.
--
-- Este script:
-- 1. Borra el paciente especifico de gerencia@gmail.com (reportado por PO)
-- 2. Borra su auth.users (cascade borra cualquier auth_paciente_link
--    residual si por algun motivo existiera)
-- 3. (OPCIONAL) Detecta y reporta todos los pacientes huerfanos para que
--    el PO decida si limpiarlos
--
-- Ejecutar en: Supabase Dashboard > SQL Editor.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PASO 1: Cleanup especifico de gerencia@gmail.com
-- ─────────────────────────────────────────────────────────────

-- OBS-2 del code review: borrar primero el link (si existe residual de
-- algun intento previo) para que el DELETE de pacientes no falle por FK.
DELETE FROM auth_paciente_link
WHERE paciente_id IN (SELECT id FROM pacientes WHERE correo = 'gerencia@gmail.com');

DELETE FROM pacientes WHERE correo = 'gerencia@gmail.com';

DELETE FROM auth.users WHERE email = 'gerencia@gmail.com';

-- ─────────────────────────────────────────────────────────────
-- PASO 2: (Opcional, solo para auditar — NO borra nada)
-- Reporta cuantas cuentas huerfanas existen tras el bug.
-- ─────────────────────────────────────────────────────────────

-- Pacientes sin link (registrados antes del fix B-19)
SELECT 'pacientes_sin_link' AS tipo, COUNT(*) AS cantidad
FROM pacientes p
WHERE NOT EXISTS (
  SELECT 1 FROM auth_paciente_link apl WHERE apl.paciente_id = p.id
);

-- Auth.users sin link a paciente NI medico (limbo total)
SELECT 'auth_users_sin_perfil' AS tipo, COUNT(*) AS cantidad
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth_paciente_link apl WHERE apl.auth_uid = u.id
)
AND NOT EXISTS (
  SELECT 1 FROM auth_medico_link aml WHERE aml.auth_uid = u.id
);

-- ─────────────────────────────────────────────────────────────
-- PASO 3 (OPCIONAL - revisar PRIMERO con paso 2):
-- Borrar TODOS los huerfanos. SOLO ejecutar si el PO confirma.
-- ─────────────────────────────────────────────────────────────

-- DESCOMENTAR si quieres limpieza masiva:
-- DELETE FROM pacientes
-- WHERE NOT EXISTS (
--   SELECT 1 FROM auth_paciente_link apl WHERE apl.paciente_id = pacientes.id
-- );
--
-- DELETE FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM auth_paciente_link apl WHERE apl.auth_uid = auth.users.id
-- ) AND NOT EXISTS (
--   SELECT 1 FROM auth_medico_link aml WHERE aml.auth_uid = auth.users.id
-- );
