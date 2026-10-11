-- ═══════════════════════════════════════════════════════════════════════
-- B-34 · Fase 1/2 (EXPAND) — Nota privada del paciente en tabla propia
--
-- Problema: `citas.notas` (nota del paciente al agendar) viajaba al médico
-- por API (select('*') en useMedicoCitas/FichaPaciente y evento Realtime de
-- `citas`), porque la RLS es por FILA y no oculta columnas. La UI no la
-- mostraba, pero el dato llegaba al navegador del médico (CA-03-05).
--
-- Solución (Opción A): tabla propia con RLS exclusiva del paciente dueño.
-- El médico NO tiene ninguna política sobre ella.
--
-- Esta fase es ADITIVA y compatible con el frontend viejo:
--   · crea la tabla + RLS + grants mínimos
--   · copia las notas existentes
--   · crear_cita_atomica escribe en AMBOS lados (doble escritura temporal)
--     para que el frontend actualmente desplegado siga mostrando la nota.
-- La fase 2 (B-34b) elimina `citas.notas` y la doble escritura, y se aplica
-- SOLO tras verificar esta fase en producción.
--
-- Base: definición VIVA de crear_cita_atomica en producción (incluye las
-- validaciones de clínica de multi-tenancy, que NO están en la rama main).
-- Signatura, owner y grants no cambian (CREATE OR REPLACE los preserva).
-- Rollback: rollback_B-34_nota_paciente_privada.sql
-- ═══════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.cita_nota_paciente (
  cita_id     uuid primary key references public.citas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  nota        text not null check (length(btrim(nota)) > 0),
  created_at  timestamptz not null default now()
);

comment on table public.cita_nota_paciente is
  'Nota PRIVADA del paciente al agendar. Solo la lee el paciente dueño; el médico no tiene acceso. Escritura solo vía crear_cita_atomica.';

alter table public.cita_nota_paciente enable row level security;

-- Solo SELECT para el paciente dueño. Sin políticas de INSERT/UPDATE/DELETE:
-- la nota es inmutable y se escribe únicamente desde la RPC (SECURITY DEFINER).
drop policy if exists paciente_lee_su_nota on public.cita_nota_paciente;
create policy paciente_lee_su_nota
  on public.cita_nota_paciente
  for select
  to authenticated
  using (
    paciente_id in (
      select apl.paciente_id from public.auth_paciente_link apl
      where apl.auth_uid = auth.uid()
    )
  );

-- Defensa en profundidad: además de la RLS, sin privilegios de escritura ni anon.
revoke all on public.cita_nota_paciente from anon, authenticated;
grant select on public.cita_nota_paciente to authenticated;

-- Backfill de las notas existentes (idempotente).
insert into public.cita_nota_paciente (cita_id, paciente_id, nota)
select c.id, c.paciente_id, btrim(c.notas)
from public.citas c
where c.paciente_id is not null
  and nullif(btrim(c.notas), '') is not null
on conflict (cita_id) do nothing;

-- crear_cita_atomica: igual a la definición viva + escritura en la tabla nueva.
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
  -- B-34 fase 1: doble escritura. `notas` (legacy) se elimina en B-34b.
  insert into citas (paciente_id, medico_id, horario_id, sede_id, notas, clinica_id)
  values (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, p_notas, v_clinica_paciente)
  returning id, codigo_confirmacion into v_cita_id, v_codigo;

  if nullif(btrim(p_notas), '') is not null then
    insert into cita_nota_paciente (cita_id, paciente_id, nota)
    values (v_cita_id, p_paciente_id, btrim(p_notas));
  end if;

  return query select v_cita_id, v_codigo;
end;
$function$;

commit;
