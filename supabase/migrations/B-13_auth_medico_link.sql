-- ============================================================
-- B-13: tabla auth_medico_link + Patron 1 (verificacion identidad)
-- ============================================================
-- Espejo de auth_paciente_link, vincula auth.users con medicos.
-- Patron 1 de seguridad: NO hay auto-registro publico de medicos.
-- Solo service_role (usado por el seed) puede INSERT/UPDATE/DELETE.
-- Anon y authenticated solo pueden SELECT su propio link.
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_medico_link (
  auth_uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  medico_id UUID UNIQUE NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_medico_link_medico ON auth_medico_link(medico_id);

ALTER TABLE auth_medico_link ENABLE ROW LEVEL SECURITY;

-- Cleanup defensivo: si existe una policy permisiva vieja, removerla.
DROP POLICY IF EXISTS "allow_all_dev" ON auth_medico_link;

-- Solo el dueño del link puede leerlo (para que useAuth lo encuentre).
CREATE POLICY "medico_ve_su_link" ON auth_medico_link FOR SELECT
USING (auth_uid = auth.uid());

-- NO se crea policy de INSERT/UPDATE/DELETE para anon/authenticated.
-- Postgres por default rechaza esas operaciones si no hay policy.
-- service_role bypasea RLS automaticamente -> el seed funciona.
