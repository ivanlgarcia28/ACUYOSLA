-- Create new turnos_confirmaciones table for confirmation system
CREATE TABLE turnos_confirmaciones (
    id SERIAL PRIMARY KEY,
    turno_id INTEGER NOT NULL,
    fecha_solicitud TIMESTAMPTZ NOT NULL,
    fecha_respuesta TIMESTAMPTZ NULL,
    metodo_contacto VARCHAR(20),
    respuesta VARCHAR(20),
    token_confirmacion VARCHAR(100) UNIQUE,
    expires_at TIMESTAMPTZ,
    
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_turnos_confirmaciones_token ON turnos_confirmaciones(token_confirmacion);
CREATE INDEX idx_turnos_confirmaciones_turno_solicitud ON turnos_confirmaciones(turno_id, fecha_solicitud);
CREATE INDEX idx_turnos_confirmaciones_expires ON turnos_confirmaciones(expires_at);

-- Add constraint for valid responses
ALTER TABLE turnos_confirmaciones ADD CONSTRAINT chk_respuesta 
    CHECK (respuesta IN ('confirmado', 'cancelado', 'reprogramado', NULL));

-- Add constraint for valid contact methods
ALTER TABLE turnos_confirmaciones ADD CONSTRAINT chk_metodo_contacto 
    CHECK (metodo_contacto IN ('whatsapp', 'email', 'sms', 'telefono'));
