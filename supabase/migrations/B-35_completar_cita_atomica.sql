-- ═══════════════════════════════════════════════════════════════════════
-- B-35 · Fase 1/2 (EXPAND) — Completar cita atómico + nota privada del médico
--
-- Problemas (auditoría de CU-05 contra la BD real):
--  1. "Completar" eran 2 llamadas separadas (insert historial + update cita).
--     Si fallaba la 2ª, quedaba historial huérfano y el reintento chocaba con
--     idx_historial_una_por_cita → el médico quedaba atascado.
--  2. La nota clínica del médico (`notas_clinicas`) llegaba por API al
--     navegador del paciente (select('*') + RLS por fila) → rompe la regla
--     "cada nota solo la ve quien la escribió" (CA-04-03 / CA-05-08).
--  3. La BD no impedía una dolencia vacía (solo la UI).
--
-- Esta fase es ADITIVA y compatible con el frontend viejo (que sigue
-- insertando directo con la política actual). NO toca políticas existentes.
--   · tabla historial_nota_medico (RLS solo-SELECT del médico autor) + backfill
--   · CHECK: dolencia_principal no vacía (0 filas violan hoy)
--   · RPC completar_cita_con_historial (historial + nota + estado, atómico)
--   · RPC marcar_cita_no_asistio
--   · la RPC escribe también notas_clinicas (legacy) para permitir revertir
--     el frontend sin perder notas; se elimina en B-35b.
-- La fase 2 (B-35b) cierra la escritura directa (policy FOR ALL → SELECT),
-- limita UPDATE de citas y elimina la columna legacy, tras verificar el deploy.
--
-- No depende de objetos de multi-tenancy (solo auth_medico_link).
-- Rollback: rollback_B-35_completar_cita_atomica.sql
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- 1) Nota privada del médico ------------------------------------------------
create table if not exists public.historial_nota_medico (
  historial_id uuid primary key references public.historial_clinico(id) on delete cascade,
  medico_id    uuid not null references public.medicos(id) on delete cascade,
  nota         text not null check (length(btrim(nota)) > 0),
  created_at   timestamptz not null default now()
);

comment on table public.historial_nota_medico is
  'Nota PRIVADA del medico al completar la cita. Solo la lee el medico autor; el paciente no tiene acceso. Escritura solo via completar_cita_con_historial.';

alter table public.historial_nota_medico enable row level security;

drop policy if exists medico_lee_sus_notas on public.historial_nota_medico;
create policy medico_lee_sus_notas
  on public.historial_nota_medico
  for select
  to authenticated
  using (
    medico_id in (
      select aml.medico_id from public.auth_medico_link aml
      where aml.auth_uid = auth.uid()
    )
  );

revoke all on public.historial_nota_medico from anon, authenticated;
grant select on public.historial_nota_medico to authenticated;

insert into public.historial_nota_medico (historial_id, medico_id, nota)
select h.id, h.medico_id, btrim(h.notas_clinicas)
from public.historial_clinico h
where nullif(btrim(h.notas_clinicas), '') is not null
on conflict (historial_id) do nothing;

-- 2) La dolencia principal no puede ser vacía (regla confirmada) -------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.historial_clinico'::regclass
      and conname = 'historial_dolencia_no_vacia'
  ) then
    alter table public.historial_clinico
      add constraint historial_dolencia_no_vacia
      check (length(btrim(dolencia_principal)) > 0);
  end if;
end $$;

-- 3) RPC: completar cita + registro clínico en UNA transacción ---------------
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
    (cita_id, paciente_id, medico_id, dolencia_principal, receta, notas_clinicas)
  values
    (p_cita_id, v_paciente_id, v_medico_id, v_dolencia, v_receta, v_notas)  -- notas_clinicas = legacy (B-35b la elimina)
  returning id into v_historial_id;

  if v_notas is not null then
    insert into historial_nota_medico (historial_id, medico_id, nota)
    values (v_historial_id, v_medico_id, v_notas);
  end if;

  update citas set estado = 'completada' where id = p_cita_id;

  return v_historial_id;
end;
$function$;

revoke all on function public.completar_cita_con_historial(uuid, text, text, text) from public, anon;
grant execute on function public.completar_cita_con_historial(uuid, text, text, text) to authenticated;

-- 4) RPC: marcar "no asistió" (no requiere información clínica) --------------
create or replace function public.marcar_cita_no_asistio(p_cita_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_medico_id uuid;
  v_estado    text;
begin
  if auth.uid() is null then
    raise exception 'No autorizado: se requiere sesion iniciada';
  end if;

  select c.medico_id, c.estado into v_medico_id, v_estado
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
    raise exception 'Solo se pueden marcar como no asistio las citas confirmadas (estado actual: %)', v_estado;
  end if;

  update citas set estado = 'no_asistio' where id = p_cita_id;
  return p_cita_id;
end;
$function$;

revoke all on function public.marcar_cita_no_asistio(uuid) from public, anon;
grant execute on function public.marcar_cita_no_asistio(uuid) to authenticated;

commit;
