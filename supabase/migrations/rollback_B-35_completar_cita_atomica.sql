-- Rollback de B-35 fase 1. Seguro mientras la columna legacy
-- historial_clinico.notas_clinicas exista (B-35b NO aplicada): la RPC la
-- mantuvo al día, así que no se pierden notas al eliminar la tabla nueva.
begin;
drop function if exists public.completar_cita_con_historial(uuid, text, text, text);
drop function if exists public.marcar_cita_no_asistio(uuid);
alter table public.historial_clinico drop constraint if exists historial_dolencia_no_vacia;
drop table if exists public.historial_nota_medico;
commit;
