-- ============================================================================
-- Sprint 6 — Registro automatico de paciente (corrige "no se puede registrar")
--
-- PROBLEMA: desde la multi-tenancy (27-sep) nadie podia registrarse:
--   1. pacientes.clinica_id (DEFAULT clinica_demo_id()) quedaba NULL porque un
--      usuario nuevo no ve ninguna clinica por RLS.
--   2. INSERT ... RETURNING exigia SELECT policy que depende del link, que se
--      crea despues.
--
-- SOLUCION: al crearse la cuenta en auth.users, un trigger SECURITY DEFINER
-- crea el paciente y su link en la MISMA transaccion, a partir de los datos
-- que el formulario envia en raw_user_meta_data (nombre, cedula, telefono).
-- Todo cuenta nueva con esos datos es paciente; no hay paso "completar perfil".
--
-- - Cuentas sin nombre+cedula en metadata (medicos del seed/admin) NO son
--   tocadas.
-- - Reusa un paciente huerfano con esa cedula SOLO si no tiene citas (no se
--   puede heredar el historial de otra persona).
-- - Cedula/correo ya en uso => 23505 y signUp falla (el frontend ya pre-chequea
--   con cedula_ya_registrada / correo_ya_registrado).
-- Rollback: rollback_sprint6_registro_paciente_automatico.sql
-- ============================================================================

create or replace function public.crear_paciente_desde_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nombre   text := nullif(btrim(new.raw_user_meta_data ->> 'nombre'), '');
  v_cedula   text := nullif(btrim(new.raw_user_meta_data ->> 'cedula'), '');
  v_telefono text := nullif(btrim(new.raw_user_meta_data ->> 'telefono'), '');
  v_correo   text := lower(btrim(new.email));
  v_paciente uuid;
begin
  -- Cuentas creadas sin datos de paciente (medicos del seed/admin): no aplica.
  if v_nombre is null or v_cedula is null then
    return new;
  end if;

  if char_length(v_nombre) not between 2 and 80
     or char_length(v_cedula) not between 3 and 20 then
    raise exception 'datos_paciente_invalidos' using errcode = '22023';
  end if;

  -- Paciente huerfano (sin cuenta) con esa cedula y SIN citas: se reutiliza.
  select p.id into v_paciente
    from pacientes p
   where p.cedula = v_cedula
     and not exists (select 1 from auth_paciente_link l where l.paciente_id = p.id)
     and not exists (select 1 from citas c where c.paciente_id = p.id)
   limit 1;

  if v_paciente is null then
    insert into pacientes (nombre, cedula, telefono, correo)
    values (v_nombre, v_cedula, v_telefono, v_correo)
    returning id into v_paciente;
  end if;

  insert into auth_paciente_link (auth_uid, paciente_id)
  values (new.id, v_paciente);

  return new;
exception
  when unique_violation then
    raise exception 'cedula_o_correo_ya_registrado' using errcode = '23505';
end;
$$;

-- Es una funcion de trigger: nadie debe poder invocarla por la API.
revoke all on function public.crear_paciente_desde_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_crear_paciente on auth.users;
create trigger on_auth_user_created_crear_paciente
  after insert on auth.users
  for each row execute function public.crear_paciente_desde_signup();
