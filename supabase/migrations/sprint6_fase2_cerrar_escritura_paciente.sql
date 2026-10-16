-- ============================================================================
-- Sprint 6 Fase 2 — cerrar la escritura directa de pacientes y de su vinculo
--
-- Desde sprint6_registro_paciente_automatico.sql el paciente y su link los crea
-- el trigger crear_paciente_desde_signup (SECURITY DEFINER). El cliente ya no
-- inserta ni actualiza estas filas, asi que se eliminan las policies que lo
-- permitian:
--   - pacientes.paciente_crea_su_perfil  (INSERT WITH CHECK true): cualquier
--     autenticado podia crear pacientes arbitrarios.
--   - auth_paciente_link.paciente_crea_su_link / paciente_actualiza_su_link:
--     solo validaban auth_uid = auth.uid(), NO el paciente_id, por lo que un
--     usuario podia vincular su cuenta al paciente de otra persona.
-- Quedan intactas las policies de SELECT y la de UPDATE del propio perfil.
-- Rollback: rollback_sprint6_fase2_cerrar_escritura_paciente.sql
-- ============================================================================
drop policy if exists paciente_crea_su_perfil on public.pacientes;
drop policy if exists paciente_crea_su_link on public.auth_paciente_link;
drop policy if exists paciente_actualiza_su_link on public.auth_paciente_link;
