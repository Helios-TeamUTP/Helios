-- Rollback de sprint6_perfil_blindar_columnas.sql
--
-- Devuelve el UPDATE a nivel de tabla a anon y authenticated, que es el estado
-- por defecto de Supabase. OJO: eso REABRE la brecha (un paciente o medico
-- podria cambiar cualquier columna de su propia fila por la API). Usar solo si
-- el blindaje rompe algo que no se pueda arreglar de otra forma.
-- RLS sigue siendo la guarda a nivel de fila: sin policy de UPDATE, anon no
-- puede modificar nada.

BEGIN;

GRANT UPDATE ON public.pacientes TO anon, authenticated;
GRANT UPDATE ON public.medicos   TO anon, authenticated;

COMMIT;
