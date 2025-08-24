-- Implementing status-based availability logic for appointment scheduling
-- This ensures cancelled/no-show appointments don't block new bookings

-- Update the availability check function to consider appointment statuses
CREATE OR REPLACE FUNCTION check_appointment_availability(
  p_fecha_inicio TIMESTAMP WITH TIME ZONE,
  p_fecha_fin TIMESTAMP WITH TIME ZONE,
  p_exclude_turno_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflicting_count INTEGER;
BEGIN
  -- Check for conflicting appointments that are NOT in cancelled/no-show states
  SELECT COUNT(*)
  INTO conflicting_count
  FROM turnos
  WHERE 
    -- Time overlap check
    (
      (fecha_horario_inicio <= p_fecha_inicio AND fecha_horario_fin > p_fecha_inicio) OR
      (fecha_horario_inicio < p_fecha_fin AND fecha_horario_fin >= p_fecha_fin) OR
      (fecha_horario_inicio >= p_fecha_inicio AND fecha_horario_fin <= p_fecha_fin)
    )
    -- Exclude appointments that don't block availability
    AND estado NOT IN ('cancelado', 'cancelado_por_paciente', 'no_asistio', 'no_asistio_sin_justificacion')
    -- Exclude the appointment being updated (for rescheduling)
    AND (p_exclude_turno_id IS NULL OR id != p_exclude_turno_id)
    -- Only consider active appointments
    AND deleted_at IS NULL;
  
  -- Return TRUE if no conflicts, FALSE if conflicts exist
  RETURN conflicting_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Add deleted_at column for soft deletes (keeping history)
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on availability checks
CREATE INDEX IF NOT EXISTS idx_turnos_availability 
ON turnos (fecha_horario_inicio, fecha_horario_fin, estado, deleted_at);

-- Add audit trigger to automatically log all changes to turnos
CREATE OR REPLACE FUNCTION audit_turnos_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO turnos_audit (
      turno_id, usuario_id, usuario_email, usuario_nombre,
      accion, campo_modificado, valor_anterior, valor_nuevo,
      descripcion
    ) VALUES (
      NEW.id, NEW.created_by, 
      (SELECT email FROM usuarios_sistema WHERE id = NEW.created_by),
      (SELECT nombre_completo FROM usuarios_sistema WHERE id = NEW.created_by),
      'CREATE', 'turno_completo', NULL, 
      json_build_object(
        'fecha_horario_inicio', NEW.fecha_horario_inicio,
        'estado', NEW.estado,
        'paciente_dni', NEW.paciente_dni,
        'tratamiento_id', NEW.tratamiento_id
      )::text,
      'Turno creado'
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Log each changed field separately
    IF OLD.fecha_horario_inicio != NEW.fecha_horario_inicio THEN
      INSERT INTO turnos_audit (
        turno_id, usuario_id, usuario_email, usuario_nombre,
        accion, campo_modificado, valor_anterior, valor_nuevo,
        descripcion
      ) VALUES (
        NEW.id, NEW.updated_by,
        (SELECT email FROM usuarios_sistema WHERE id = NEW.updated_by),
        (SELECT nombre_completo FROM usuarios_sistema WHERE id = NEW.updated_by),
        'UPDATE', 'fecha_horario_inicio', 
        OLD.fecha_horario_inicio::text, NEW.fecha_horario_inicio::text,
        'Fecha/hora de inicio modificada'
      );
    END IF;

    IF OLD.estado != NEW.estado THEN
      INSERT INTO turnos_audit (
        turno_id, usuario_id, usuario_email, usuario_nombre,
        accion, campo_modificado, valor_anterior, valor_nuevo,
        descripcion
      ) VALUES (
        NEW.id, NEW.updated_by,
        (SELECT email FROM usuarios_sistema WHERE id = NEW.updated_by),
        (SELECT nombre_completo FROM usuarios_sistema WHERE id = NEW.updated_by),
        'UPDATE', 'estado', OLD.estado, NEW.estado,
        'Estado del turno modificado'
      );
    END IF;

    -- Add more field checks as needed
    RETURN NEW;
  END IF;

  -- Handle DELETE (soft delete)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO turnos_audit (
      turno_id, usuario_id, usuario_email, usuario_nombre,
      accion, campo_modificado, valor_anterior, valor_nuevo,
      descripcion
    ) VALUES (
      OLD.id, OLD.updated_by,
      (SELECT email FROM usuarios_sistema WHERE id = OLD.updated_by),
      (SELECT nombre_completo FROM usuarios_sistema WHERE id = OLD.updated_by),
      'DELETE', 'turno_completo', 
      json_build_object('estado', OLD.estado)::text, NULL,
      'Turno eliminado'
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_turnos_trigger ON turnos;
CREATE TRIGGER audit_turnos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON turnos
  FOR EACH ROW EXECUTE FUNCTION audit_turnos_changes();

-- Add created_by and updated_by columns to track who makes changes
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES usuarios_sistema(id);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES usuarios_sistema(id);
