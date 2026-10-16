-- Rollback de sprint6_fase2b_revocar_paciente_huerfano_id.sql (restaura el estado previo:
-- ejecutable por anon, authenticated y service_role)
grant execute on function public.paciente_huerfano_id(text) to anon, authenticated, service_role;
