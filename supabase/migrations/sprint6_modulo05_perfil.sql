-- Módulo 05 — Perfil (solo paciente)
--
-- Agrega la policy de UPDATE que faltaba en `pacientes`. Sin esto, el
-- paciente no puede editar ni siquiera su propio nombre (B-14/B-26 solo
-- dejaron SELECT e INSERT — ver docs/Obsidian/Modulos/Módulo 05 — Perfil.md).
--
-- Nota de seguridad: RLS no filtra por columna. Esta policy permite
-- técnicamente actualizar cualquier campo de la fila (incluida cedula o
-- correo), no solo nombre. La restricción real de "solo nombre editable"
-- vive en el frontend (perfil.service.ts nunca envía otros campos en el
-- payload del .update()). Ver nota en el módulo para la alternativa de
-- GRANT UPDATE (nombre) si se quiere blindar también a nivel de BD.
--
-- ACTUALIZACIÓN (oct-2026): ese blindaje a nivel de columna YA está resuelto en
-- sprint6_perfil_blindar_columnas.sql (aplicar después de este archivo).
--
-- Idempotente: esta policy ya fue aplicada a mano en producción el 2026-09-22,
-- así que el DROP evita el error "policy already exists" al re-ejecutarla.

DROP POLICY IF EXISTS "paciente_actualiza_su_perfil" ON pacientes;
CREATE POLICY "paciente_actualiza_su_perfil" ON pacientes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth_paciente_link apl
    WHERE apl.auth_uid = auth.uid() AND apl.paciente_id = pacientes.id
  )
);
