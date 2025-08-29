-- Create useful views and functions for the new system
-- View for turnos with payment status
CREATE OR REPLACE VIEW vista_turnos_completa AS
SELECT 
    t.*,
    p.nombre_apellido as paciente_nombre,
    tr.nombre as tratamiento_nombre,
    tr.duracion_minutos,
    tp.monto_total,
    tp.monto_pagado,
    tp.estado_pago,
    CASE 
        WHEN t.fecha_horario_inicio < NOW() THEN 'vencido'
        WHEN t.confirmacion_solicitada_at IS NOT NULL AND t.confirmado_at IS NULL THEN 'pendiente_confirmacion'
        ELSE t.estado
    END as estado_calculado
FROM turnos t
LEFT JOIN pacientes p ON t.paciente_dni = p.dni
LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
LEFT JOIN turnos_pagos tp ON t.id = tp.turno_id;

-- Function to change turno status with history tracking
CREATE OR REPLACE FUNCTION cambiar_estado_turno(
    p_turno_id INTEGER,
    p_estado_nuevo VARCHAR(30),
    p_usuario_id UUID DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_estado_anterior VARCHAR(30);
BEGIN
    -- Get current status
    SELECT estado INTO v_estado_anterior FROM turnos WHERE id = p_turno_id;
    
    -- Update turno status
    UPDATE turnos SET 
        estado = p_estado_nuevo,
        modified_at = CURRENT_TIMESTAMP,
        confirmado_at = CASE WHEN p_estado_nuevo = 'confirmado' THEN CURRENT_TIMESTAMP ELSE confirmado_at END,
        asistencia_registrada_at = CASE WHEN p_estado_nuevo IN ('completado', 'ausente_justificado', 'ausente_injustificado') THEN CURRENT_TIMESTAMP ELSE asistencia_registrada_at END
    WHERE id = p_turno_id;
    
    -- Insert history record
    INSERT INTO turnos_historial (turno_id, estado_anterior, estado_nuevo, usuario_id, motivo)
    VALUES (p_turno_id, v_estado_anterior, p_estado_nuevo, p_usuario_id, p_motivo);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
