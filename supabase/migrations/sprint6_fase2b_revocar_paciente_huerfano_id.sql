-- ============================================================================
-- Sprint 6 Fase 2b — revocar paciente_huerfano_id(text) a anon y authenticated
--
-- La funcion ya no la usa nadie: desde sprint6_registro_paciente_automatico.sql
-- el trigger crear_paciente_desde_signup reutiliza pacientes huerfanos por
-- dentro, y el frontend solo llama a cedula_ya_registrada / correo_ya_registrado.
-- Seguia ejecutable por anon via /rest/v1/rpc/paciente_huerfano_id, lo que
-- permitia a cualquiera sin sesion averiguar si una cedula pertenece a un
-- paciente sin cuenta. Se deja solo service_role (mismo patron que B-36).
-- Rollback: rollback_sprint6_fase2b_revocar_paciente_huerfano_id.sql
-- ============================================================================
revoke execute on function public.paciente_huerfano_id(text) from public, anon, authenticated;
grant execute on function public.paciente_huerfano_id(text) to service_role;
