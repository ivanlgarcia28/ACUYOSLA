-- Create appointment status flow system
-- This system tracks the complete lifecycle of appointments with historical tracking

-- Create status flow table to track appointment transitions
CREATE TABLE IF NOT EXISTS turnos_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  changed_by UUID REFERENCES usuarios_sistema(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for tenant isolation
ALTER TABLE turnos_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history for their tenant" ON turnos_status_history
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert status history for their tenant" ON turnos_status_history
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add status_flow column to turnos table to track current position in flow
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS status_flow JSONB DEFAULT '{"current": "reservado", "history": []}';

-- Create function to update appointment status with history tracking
CREATE OR REPLACE FUNCTION update_appointment_status(
  p_turno_id UUID,
  p_new_status VARCHAR(50),
  p_changed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_status VARCHAR(50);
  v_tenant_id UUID;
BEGIN
  -- Get current status and tenant_id
  SELECT estado, tenant_id INTO v_current_status, v_tenant_id
  FROM turnos WHERE id = p_turno_id;
  
  -- Insert into history
  INSERT INTO turnos_status_history (turno_id, tenant_id, status, previous_status, changed_by, notes)
  VALUES (p_turno_id, v_tenant_id, p_new_status, v_current_status, p_changed_by, p_notes);
  
  -- Update appointment status
  UPDATE turnos 
  SET estado = p_new_status,
      status_flow = jsonb_set(
        status_flow,
        '{current}',
        to_jsonb(p_new_status)
      )
  WHERE id = p_turno_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_turnos_status_history_turno_id ON turnos_status_history(turno_id);
CREATE INDEX IF NOT EXISTS idx_turnos_status_history_tenant_id ON turnos_status_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_turnos_status_flow ON turnos USING GIN(status_flow);

-- Update existing appointments to have initial status flow
UPDATE turnos 
SET status_flow = jsonb_build_object(
  'current', COALESCE(estado, 'reservado'),
  'history', '[]'::jsonb
)
WHERE status_flow IS NULL OR status_flow = '{}';

-- Insert initial history records for existing appointments
INSERT INTO turnos_status_history (turno_id, tenant_id, status, previous_status, notes)
SELECT 
  id,
  tenant_id,
  COALESCE(estado, 'reservado'),
  NULL,
  'Estado inicial del sistema'
FROM turnos
WHERE id NOT IN (SELECT DISTINCT turno_id FROM turnos_status_history);
