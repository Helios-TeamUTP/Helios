-- ═══════════════════════════════════════════════════════════════
-- Migración 001 — historial_clinico
-- Agrega dolencia principal y receta por cita, ligado al Sprint
-- del dashboard médico (sección "Gestión de Pacientes").
--
-- v2: corregido user_id → auth_uid (nombre real de columna en
-- auth_medico_link y auth_paciente_link, verificado contra la BD real)
-- ═══════════════════════════════════════════════════════════════

create table if not exists historial_clinico (
  id                uuid primary key default gen_random_uuid(),
  cita_id           uuid not null references citas(id) on delete cascade,
  paciente_id       uuid not null references pacientes(id) on delete cascade,
  medico_id         uuid not null references medicos(id) on delete cascade,
  dolencia_principal text not null,
  receta            text,               -- puede ser null: no toda cita termina en receta
  notas_clinicas    text,               -- observaciones adicionales del médico
  created_at        timestamptz not null default now()
);

-- Un paciente puede tener muchas citas, pero cada cita tiene
-- como máximo un registro de historial clínico.
create unique index if not exists idx_historial_una_por_cita
  on historial_clinico (cita_id);

-- Índice para la query del dashboard: "última cita de cada paciente"
create index if not exists idx_historial_paciente_fecha
  on historial_clinico (paciente_id, created_at desc);

-- ─── RLS ──────────────────────────────────────────────────────────
alter table historial_clinico enable row level security;

-- El médico dueño de la cita puede insertar y leer su propio registro
create policy "medico_gestiona_su_historial"
on historial_clinico for all
using (
  medico_id in (
    select medico_id from auth_medico_link where auth_uid = auth.uid()
  )
)
with check (
  medico_id in (
    select medico_id from auth_medico_link where auth_uid = auth.uid()
  )
);

-- El paciente puede leer (solo lectura) su propio historial
create policy "paciente_lee_su_historial"
on historial_clinico for select
using (
  paciente_id in (
    select paciente_id from auth_paciente_link where auth_uid = auth.uid()
  )
);
