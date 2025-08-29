-- Create new turnos_historial table for complete audit trail
CREATE TABLE turnos_historial (
    id SERIAL PRIMARY KEY,
    turno_id INTEGER NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    fecha_cambio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuario_id UUID,
    motivo TEXT,
    datos_adicionales JSONB,
    
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_turnos_historial_turno_fecha ON turnos_historial(turno_id, fecha_cambio);
CREATE INDEX idx_turnos_historial_fecha ON turnos_historial(fecha_cambio);
CREATE INDEX idx_turnos_historial_usuario ON turnos_historial(usuario_id);
