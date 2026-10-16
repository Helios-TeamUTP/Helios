-- Rollback de sprint6_fase2_cerrar_escritura_paciente.sql (restaura el estado previo)
create policy paciente_crea_su_perfil on public.pacientes
  for insert with check (true);
create policy paciente_crea_su_link on public.auth_paciente_link
  for insert with check (auth_uid = auth.uid());
create policy paciente_actualiza_su_link on public.auth_paciente_link
  for update using (auth_uid = auth.uid()) with check (auth_uid = auth.uid());
