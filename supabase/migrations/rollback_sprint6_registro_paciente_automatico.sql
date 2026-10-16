-- Rollback de sprint6_registro_paciente_automatico.sql
drop trigger if exists on_auth_user_created_crear_paciente on auth.users;
drop function if exists public.crear_paciente_desde_signup();
