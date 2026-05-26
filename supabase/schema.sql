-- ============================================================
-- HELIOS Sprint 1 - Schema completo
-- Ejecutar en Supabase SQL Editor en orden
-- ============================================================

-- Limpieza si re-ejecutas (cuidado: borra datos)
-- DROP TABLE IF EXISTS auth_paciente_link CASCADE;
-- DROP TABLE IF EXISTS citas CASCADE;
-- DROP TABLE IF EXISTS horarios CASCADE;
-- DROP TABLE IF EXISTS medicos CASCADE;
-- DROP TABLE IF EXISTS pacientes CASCADE;
-- DROP TABLE IF EXISTS especialidades CASCADE;
-- DROP TABLE IF EXISTS sedes CASCADE;

-- ============================================================
-- 1. Sedes
-- ============================================================
CREATE TABLE IF NOT EXISTS sedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  direccion TEXT,
  capacidad_diaria INT DEFAULT 200,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Especialidades
-- ============================================================
CREATE TABLE IF NOT EXISTS especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Medicos
-- ============================================================
CREATE TABLE IF NOT EXISTS medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  especialidad_id UUID REFERENCES especialidades(id) ON DELETE SET NULL,
  sede_id UUID REFERENCES sedes(id) ON DELETE SET NULL,
  correo TEXT UNIQUE,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. Horarios
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID REFERENCES medicos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medico_id, fecha, hora_inicio)
);

-- ============================================================
-- 5. Pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  telefono TEXT,
  correo TEXT UNIQUE,
  fecha_nacimiento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Citas (tabla central)
-- ============================================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id UUID REFERENCES medicos(id) ON DELETE SET NULL,
  horario_id UUID REFERENCES horarios(id) UNIQUE,
  sede_id UUID REFERENCES sedes(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'completada', 'no_asistio')),
  notas TEXT,
  codigo_confirmacion TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. auth_paciente_link (puente Supabase Auth -> pacientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_paciente_link (
  auth_uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indices para rendimiento (criterio <2s del CLAUDE.md)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_horarios_medico_fecha ON horarios(medico_id, fecha);
CREATE INDEX IF NOT EXISTS idx_horarios_disponible ON horarios(disponible, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medicos_sede_especialidad ON medicos(sede_id, especialidad_id);
CREATE INDEX IF NOT EXISTS idx_auth_paciente_link_paciente ON auth_paciente_link(paciente_id);

-- ============================================================
-- Row Level Security - permisivo para Sprint 1
-- (Sprint 2 endurece políticas por rol)
-- ============================================================
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_paciente_link ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sedes' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON sedes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'especialidades' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON especialidades FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicos' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON medicos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'horarios' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON horarios FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON pacientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'citas' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON citas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_paciente_link' AND policyname = 'sprint1_all') THEN
    CREATE POLICY "sprint1_all" ON auth_paciente_link FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- RPC: crear cita atomica (US-04)
-- Marca horario como no disponible + crea cita en una transaccion
-- ============================================================
CREATE OR REPLACE FUNCTION crear_cita_atomica(
  p_paciente_id UUID,
  p_medico_id UUID,
  p_horario_id UUID,
  p_sede_id UUID,
  p_notas TEXT DEFAULT NULL
) RETURNS TABLE(cita_id UUID, codigo TEXT) AS $$
DECLARE
  v_disponible BOOLEAN;
  v_cita_id UUID;
  v_codigo TEXT;
BEGIN
  SELECT disponible INTO v_disponible FROM horarios WHERE id = p_horario_id FOR UPDATE;
  IF v_disponible IS NULL THEN
    RAISE EXCEPTION 'Horario no existe';
  END IF;
  IF v_disponible = false THEN
    RAISE EXCEPTION 'Horario ya reservado';
  END IF;

  UPDATE horarios SET disponible = false WHERE id = p_horario_id;

  INSERT INTO citas (paciente_id, medico_id, horario_id, sede_id, notas)
  VALUES (p_paciente_id, p_medico_id, p_horario_id, p_sede_id, p_notas)
  RETURNING id, codigo_confirmacion INTO v_cita_id, v_codigo;

  RETURN QUERY SELECT v_cita_id, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir ejecutar la RPC desde anon/authenticated
GRANT EXECUTE ON FUNCTION crear_cita_atomica TO anon, authenticated;
