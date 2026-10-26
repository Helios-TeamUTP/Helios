-- Extensión del Módulo 05 — Perfil, ahora para médico (solo nombre).
--
-- Igual que pacientes antes de sprint6_modulo05_perfil.sql: 'medicos' solo
-- tiene "autenticado_lee_medicos" (SELECT). Cero UPDATE. Sin esta policy,
-- el médico no puede editar ni siquiera su propio nombre.
--
-- Alcance: el médico solo puede actualizar 'nombre' (el correo es su usuario
-- de inicio de sesión). El cambio de contraseña NO pasa por esta tabla: usa
-- supabase.auth.updateUser, igual que el paciente.
-- Igual que con pacientes, RLS no filtra por columna — ese límite se aplica a
-- nivel de columna en sprint6_perfil_blindar_columnas.sql (aplicar después).
--
-- Idempotente: esta policy ya fue aplicada a mano en producción el 2026-09-22,
-- así que el DROP evita el error "policy already exists" al re-ejecutarla.

DROP POLICY IF EXISTS "medico_actualiza_su_perfil" ON medicos;
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
