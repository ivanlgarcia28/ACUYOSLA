-- Create table for turno todos/checklist
CREATE TABLE IF NOT EXISTS turno_todos (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER REFERENCES turnos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  completado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_turno_todos_turno_id ON turno_todos(turno_id);

-- Enable RLS
ALTER TABLE turno_todos ENABLE ROW LEVEL SECURITY;

-- Create policy for turno_todos
CREATE POLICY "Allow all operations for turno_todos" ON turno_todos
FOR ALL USING (true);

-- Add some default todos for common treatments
INSERT INTO turno_todos (turno_id, descripcion, completado) 
SELECT t.id, 'Preparar instrumental básico', false
FROM turnos t 
WHERE NOT EXISTS (SELECT 1 FROM turno_todos tt WHERE tt.turno_id = t.id)
LIMIT 5;

INSERT INTO turno_todos (turno_id, descripcion, completado) 
SELECT t.id, 'Verificar historial médico', false
FROM turnos t 
WHERE NOT EXISTS (SELECT 1 FROM turno_todos tt WHERE tt.turno_id = t.id)
LIMIT 5;
