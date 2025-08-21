-- Crear tabla de obras sociales
CREATE TABLE IF NOT EXISTS obras_sociales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las obras sociales que acepta la doctora
INSERT INTO obras_sociales (nombre) VALUES 
  ('OSDE'),
  ('Swiss Medical'),
  ('Galeno'),
  ('Medicus'),
  ('PAMI'),
  ('IPS'),
  ('Particular')
ON CONFLICT (nombre) DO NOTHING;
