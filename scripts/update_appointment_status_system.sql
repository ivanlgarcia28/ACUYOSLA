-- Adding new appointment status system with confirmation workflow
-- Update turnos table to support new status system
ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS confirmado_clinica BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipo_turno VARCHAR(50) DEFAULT 'consulta',
ADD COLUMN IF NOT EXISTS requiere_confirmacion BOOLEAN DEFAULT TRUE;

-- Update existing appointments to use new status system
UPDATE turnos 
SET confirmado_clinica = CASE 
  WHEN estado = 'confirmado' THEN TRUE 
  ELSE FALSE 
END;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_turnos_confirmado_clinica ON turnos(confirmado_clinica);
CREATE INDEX IF NOT EXISTS idx_turnos_tipo ON turnos(tipo_turno);

-- Update status values to be more clear
UPDATE turnos SET estado = 'confirmado_paciente' WHERE estado = 'confirmado';
UPDATE turnos SET estado = 'cancelado_paciente' WHERE estado = 'cancelado';

-- Add comments for clarity
COMMENT ON COLUMN turnos.confirmado_clinica IS 'Indicates if clinic staff has confirmed the appointment';
COMMENT ON COLUMN turnos.tipo_turno IS 'Type of appointment: consulta, control, urgencia, etc.';
COMMENT ON COLUMN turnos.requiere_confirmacion IS 'Whether this appointment requires clinic confirmation';
