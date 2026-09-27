-- Extensión del Módulo 05 — Perfil, ahora para médico (solo nombre).
--
-- Igual que pacientes antes de sprint6_modulo05_perfil.sql: 'medicos' solo
-- tiene "autenticado_lee_medicos" (SELECT). Cero UPDATE. Sin esta policy,
-- el médico no puede editar ni siquiera su propio nombre.
--
-- Alcance INTENCIONALMENTE más restringido que el de paciente: el médico
-- únicamente puede tocar 'nombre'. No hay correo/password en este módulo
-- para médico (a diferencia de paciente, que sí tiene cambio de password).
-- Igual que con pacientes, RLS no filtra por columna — la restricción real
-- de "solo nombre" vive en el frontend (useActualizarNombreMedico nunca
-- manda otros campos en el payload).

CREATE POLICY "medico_actualiza_su_perfil" ON medicos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = medicos.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth_medico_link aml
    WHERE aml.auth_uid = auth.uid() AND aml.medico_id = medicos.id
  )
);
