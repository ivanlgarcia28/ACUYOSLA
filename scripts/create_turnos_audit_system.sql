-- Create comprehensive audit table for turnos
CREATE TABLE IF NOT EXISTS turnos_audit (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios_sistema(id),
  usuario_email VARCHAR(255),
  usuario_nombre VARCHAR(255),
  accion VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  campo_modificado VARCHAR(100), -- 'fecha_horario_inicio', 'estado', 'paciente_dni', etc.
  valor_anterior TEXT,
  valor_nuevo TEXT,
  descripcion TEXT,
  fecha_modificacion TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  tenant_id UUID
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_turnos_audit_turno_id ON turnos_audit(turno_id);
CREATE INDEX IF NOT EXISTS idx_turnos_audit_fecha ON turnos_audit(fecha_modificacion);
CREATE INDEX IF NOT EXISTS idx_turnos_audit_usuario ON turnos_audit(usuario_id);

-- Function to get current user info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_email TEXT, user_name TEXT) AS $$
BEGIN
  -- This will be called from the application with proper user context
  RETURN QUERY SELECT 
    NULL::UUID as user_id,
    NULL::TEXT as user_email, 
    NULL::TEXT as user_name;
END;
$$ LANGUAGE plpgsql;

-- Function to log turno changes
CREATE OR REPLACE FUNCTION log_turno_change(
  p_turno_id INTEGER,
  p_usuario_id UUID,
  p_usuario_email VARCHAR(255),
  p_usuario_nombre VARCHAR(255),
  p_accion VARCHAR(50),
  p_campo_modificado VARCHAR(100),
  p_valor_anterior TEXT,
  p_valor_nuevo TEXT,
  p_descripcion TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO turnos_audit (
    turno_id,
    usuario_id,
    usuario_email,
    usuario_nombre,
    accion,
    campo_modificado,
    valor_anterior,
    valor_nuevo,
    descripcion
  ) VALUES (
    p_turno_id,
    p_usuario_id,
    p_usuario_email,
    p_usuario_nombre,
    p_accion,
    p_campo_modificado,
    p_valor_anterior,
    p_valor_nuevo,
    p_descripcion
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT ON turnos_audit TO authenticated;
GRANT USAGE ON SEQUENCE turnos_audit_id_seq TO authenticated;
