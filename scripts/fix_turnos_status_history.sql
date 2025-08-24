-- Add status history table for tracking appointment status changes
CREATE TABLE IF NOT EXISTS turnos_status_history (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES usuarios_sistema(id),
  notes TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_turnos_status_history_turno_id ON turnos_status_history(turno_id);
CREATE INDEX IF NOT EXISTS idx_turnos_status_history_changed_at ON turnos_status_history(changed_at);

-- Function to add status history entry
CREATE OR REPLACE FUNCTION add_status_history(
  p_turno_id INTEGER,
  p_status VARCHAR(50),
  p_changed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO turnos_status_history (turno_id, status, changed_by, notes)
  VALUES (p_turno_id, p_status, p_changed_by, p_notes);
END;
$$ LANGUAGE plpgsql;

-- Add initial status history for existing appointments
INSERT INTO turnos_status_history (turno_id, status, changed_at, notes)
SELECT id, estado, created_at, 'Estado inicial'
FROM turnos
WHERE id NOT IN (SELECT DISTINCT turno_id FROM turnos_status_history);
