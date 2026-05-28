-- ============================================================
-- B-20: Cleanup de cuenta huerfana maria@gmail.com
-- ============================================================
-- Misma causa que B-19 (signUp con session=null → upsert link falla
-- silente por RLS auth.uid()=NULL → paciente huerfano).
--
-- Con B-20 ya NO ocurre porque el insert paciente + link se hace en
-- Login.tsx tras signInWithPassword (cuando JWT está garantizado).
-- Pero hay que limpiar el rastro de pruebas previas.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor.
-- ============================================================

-- Borrar link residual (si existe)
DELETE FROM auth_paciente_link
WHERE paciente_id IN (SELECT id FROM pacientes WHERE correo = 'maria@gmail.com');

-- Borrar paciente
DELETE FROM pacientes WHERE correo = 'maria@gmail.com';

-- Borrar auth.users (cascade limpia cualquier residuo)
DELETE FROM auth.users WHERE email = 'maria@gmail.com';

-- Verificacion: que no haya quedado nada
SELECT 'pacientes' AS tabla, COUNT(*) FROM pacientes WHERE correo = 'maria@gmail.com'
UNION ALL
SELECT 'auth.users' AS tabla, COUNT(*) FROM auth.users WHERE email = 'maria@gmail.com';
-- Esperado: 0 y 0
