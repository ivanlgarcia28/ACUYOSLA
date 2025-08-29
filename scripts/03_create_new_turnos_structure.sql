-- Create new turnos table structure according to specifications
DROP TABLE IF EXISTS turnos CASCADE;

CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    paciente_dni VARCHAR(20) NOT NULL,
    tratamiento_id INTEGER,
    calendar_id VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'reservado',
    fecha_horario_inicio TIMESTAMPTZ NOT NULL,
    fecha_horario_fin TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    tenant_id UUID,
    
    -- Campos para confirmación
    confirmacion_solicitada_at TIMESTAMPTZ NULL,
    confirmado_at TIMESTAMPTZ NULL,
    
    -- Campos para asistencia
    asistencia_registrada_at TIMESTAMPTZ NULL,
    motivo_ausencia TEXT NULL,
    
    -- Referencia al turno original (para reprogramaciones)
    turno_original_id INTEGER NULL,
    
    FOREIGN KEY (turno_original_id) REFERENCES turnos(id),
    FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id),
    FOREIGN KEY (paciente_dni) REFERENCES pacientes(dni)
);

-- Create indexes for performance
CREATE INDEX idx_turnos_fecha_inicio ON turnos(fecha_horario_inicio);
CREATE INDEX idx_turnos_estado ON turnos(estado);
CREATE INDEX idx_turnos_paciente ON turnos(paciente_dni);
CREATE INDEX idx_turnos_tenant ON turnos(tenant_id);

-- Create trigger for modified_at
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_turnos_modified_at BEFORE UPDATE ON turnos
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();
