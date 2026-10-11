-- ═══════════════════════════════════════════════════════════════════════
-- B-34b + B-35b · Fase 2/2 (CONTRACT) — Cerrar la fuga de notas privadas en la BD
--
-- Fase 1 (B-34/B-35, ya en producción): las notas viven en tablas propias con
-- RLS del autor (cita_nota_paciente, historial_nota_medico) y el cliente dejó
-- de pedir las columnas viejas. PERO las columnas viejas seguían existiendo y
-- seguían siendo legibles por API (la RLS filtra FILAS, no columnas), el
-- Realtime de `citas` seguía enviando `notas`, el médico podía hacer
-- UPDATE/DELETE del historial y UPDATE libre de `citas`, y `anon` y
-- `authenticated` tenían TODOS los privilegios (incl. TRUNCATE) sobre ambas
-- tablas (default de Supabase).
--
-- Esta migración cierra todo eso:
--  0. COMPUERTA: backfill final + verificación; si queda UNA sola nota sin
--     copiar, ABORTA y no elimina nada.
--  1. crear_cita_atomica y completar_cita_con_historial dejan de escribir las
--     columnas legacy.
--  2. DROP citas.notas y historial_clinico.notas_clinicas.
--  3. Políticas: el médico solo LEE su historial (la escritura va por RPC) y
--     se elimina su UPDATE directo sobre `citas` (los cambios de estado van por
--     RPC: completar_cita_con_historial, marcar_cita_no_asistio, cancelar_ y
--     reprogramar_cita_atomica).
--  4. Privilegios: los clientes solo tienen SELECT sobre citas/historial_clinico.
--
-- REQUISITO PREVIO: ningún código desplegado (Railway/main ni demo Cloudflare)
-- puede leer/escribir las columnas legacy ni escribir directo en estas tablas.
-- Rollback: rollback_B-34b_B-35b_contract_privacidad.sql
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- 0) COMPUERTA --------------------------------------------------------------
insert into public.cita_nota_paciente (cita_id, paciente_id, nota)
select c.id, c.paciente_id, btrim(c.notas)
from public.citas c
where c.paciente_id is not null and nullif(btrim(c.notas), '') is not null
on conflict (cita_id) do nothing;

insert into public.historial_nota_medico (historial_id, medico_id, nota)
select h.id, h.medico_id, btrim(h.notas_clinicas)
from public.historial_clinico h
where nullif(btrim(h.notas_clinicas), '') is not null
on conflict (historial_id) do nothing;

do $$
declare
  v_pac int;
  v_med int;
begin
  select count(*) into v_pac from public.citas c
   where nullif(btrim(c.notas), '') is not null
     and not exists (select 1 from public.cita_nota_paciente n where n.cita_id = c.id);
  select count(*) into v_med from public.historial_clinico h
   where nullif(btrim(h.notas_clinicas), '') is not null
     and not exists (select 1 from public.historial_nota_medico n where n.historial_id = h.id);
  if v_pac > 0 or v_med > 0 then
    raise exception 'B-34b/B-35b ABORTADA: % nota(s) de paciente y % de medico sin copiar. No se elimina ninguna columna.', v_pac, v_med;
  end if;
end $$;

-- 1) Funciones sin columnas legacy ---------------------------------------------
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
  insert into citas (paciente_id, medico_id, horario_id, sede_id, clinica_id)
  values (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, v_clinica_paciente)
  returning id, codigo_confirmacion into v_cita_id, v_codigo;

  if nullif(btrim(p_notas), '') is not null then
    insert into cita_nota_paciente (cita_id, paciente_id, nota)
    values (v_cita_id, p_paciente_id, btrim(p_notas));
  end if;

  return query select v_cita_id, v_codigo;
end;
$function$;

create or replace function public.completar_cita_con_historial(
  p_cita_id  uuid,
  p_dolencia text,
  p_receta   text default null,
  p_notas    text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_paciente_id uuid;
  v_medico_id   uuid;
  v_estado      text;
  v_dolencia    text := btrim(coalesce(p_dolencia, ''));
  v_receta      text := nullif(btrim(coalesce(p_receta, '')), '');
  v_notas       text := nullif(btrim(coalesce(p_notas, '')), '');
  v_historial_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autorizado: se requiere sesion iniciada';
  end if;

  -- Bloquea la fila: serializa doble clic / dos pestañas del mismo médico.
  select c.paciente_id, c.medico_id, c.estado
    into v_paciente_id, v_medico_id, v_estado
    from citas c where c.id = p_cita_id for update;

  if not found then
    raise exception 'La cita no existe';
  end if;

  if not exists (
    select 1 from auth_medico_link aml
    where aml.auth_uid = auth.uid() and aml.medico_id = v_medico_id
  ) then
    raise exception 'No autorizado: la cita no pertenece al medico actual';
  end if;

  if v_estado <> 'confirmada' then
    raise exception 'Solo se pueden completar citas confirmadas (estado actual: %)', v_estado;
  end if;

  if v_dolencia = '' then
    raise exception 'La dolencia principal es obligatoria para completar la cita';
  end if;

  if v_paciente_id is null then
    raise exception 'La cita no tiene paciente asociado';
  end if;

  insert into historial_clinico
    (cita_id, paciente_id, medico_id, dolencia_principal, receta)
  values
    (p_cita_id, v_paciente_id, v_medico_id, v_dolencia, v_receta)
  returning id into v_historial_id;

  if v_notas is not null then
    insert into historial_nota_medico (historial_id, medico_id, nota)
    values (v_historial_id, v_medico_id, v_notas);
  end if;

  update citas set estado = 'completada' where id = p_cita_id;

  return v_historial_id;
end;
$function$;

-- 2) Eliminar columnas legacy ----------------------------------------------------
alter table public.citas              drop column notas;
alter table public.historial_clinico  drop column notas_clinicas;

-- 3) Políticas: el médico solo LEE su historial; sin UPDATE directo de citas ------
drop policy if exists medico_gestiona_su_historial on public.historial_clinico;
drop policy if exists medico_lee_su_historial      on public.historial_clinico;
create policy medico_lee_su_historial
  on public.historial_clinico
  for select
  to authenticated
  using (
    medico_id in (
      select aml.medico_id from public.auth_medico_link aml
      where aml.auth_uid = auth.uid()
    )
  );

drop policy if exists medico_actualiza_sus_citas on public.citas;

-- 4) Privilegios: los clientes solo leen (toda escritura pasa por RPC) -------------
revoke all on table public.citas, public.historial_clinico from anon, authenticated;
grant select on table public.citas, public.historial_clinico to authenticated;

commit;
