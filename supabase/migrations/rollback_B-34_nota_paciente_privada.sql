-- Rollback de B-34 fase 1: restaura crear_cita_atomica (definición viva previa)
-- y elimina la tabla nueva. Seguro mientras `citas.notas` siga existiendo
-- (fase 2 / B-34b NO aplicada), porque la doble escritura mantuvo el legacy al día.
-- Si B-34b ya se aplicó, restaurar primero la columna con rollback_B-34b.

begin;

create or replace function public.crear_cita_atomica(
  p_paciente_id uuid, p_medico_id uuid, p_horario_id uuid, p_sede_id uuid,
  p_notas text default null
)
returns table(cita_id uuid, codigo text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  c_max_citas_dia constant int := 15;
  v_disponible boolean; v_fecha date; v_citas_dia int;
  v_cita_id uuid; v_codigo text;
  v_clinica_paciente uuid; v_clinica_medico uuid; v_clinica_horario uuid;
begin
  if not exists (select 1 from auth_paciente_link where auth_uid = auth.uid() and paciente_id = p_paciente_id) then
    raise exception 'No autorizado: el paciente no corresponde al usuario actual';
  end if;

  select clinica_id into v_clinica_paciente from pacientes where id = p_paciente_id;
  select clinica_id into v_clinica_medico from medicos where id = p_medico_id;
  select clinica_id, disponible, fecha into v_clinica_horario, v_disponible, v_fecha from horarios where id = p_horario_id for update;

  if v_disponible is null then
    raise exception 'Horario no existe';
  end if;
  if v_clinica_medico is distinct from v_clinica_paciente or v_clinica_horario is distinct from v_clinica_paciente then
    raise exception 'El medico y el horario deben pertenecer a la misma clinica que el paciente';
  end if;
  if v_disponible = false then
    raise exception 'Horario ya reservado';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_medico_id::text), hashtext(v_fecha::text));
  select count(*) into v_citas_dia from citas c join horarios h on h.id = c.horario_id
   where c.medico_id = p_medico_id and h.fecha = v_fecha and c.estado <> 'cancelada';
  if v_citas_dia >= c_max_citas_dia then
    raise exception 'El medico ya alcanzo el maximo de % citas para ese dia. Elige otro dia.', c_max_citas_dia;
  end if;

  update horarios set disponible = false where id = p_horario_id;
  insert into citas (paciente_id, medico_id, horario_id, sede_id, notas, clinica_id)
  values (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, p_notas, v_clinica_paciente)
  returning id, codigo_confirmacion into v_cita_id, v_codigo;

  return query select v_cita_id, v_codigo;
end;
$function$;

drop table if exists public.cita_nota_paciente;

commit;
