-- Create comprehensive notification and template system
-- Create notification templates table
CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- confirmacion, recordatorio, cancelacion, reprogramacion
    canal VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    asunto VARCHAR(200) NULL, -- For email templates
    contenido TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}', -- Available variables for template
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced turnos_confirmaciones table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS turnos_confirmaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id INTEGER NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES notification_templates(id),
    canal VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    destinatario VARCHAR(100) NOT NULL, -- phone, email, etc
    asunto VARCHAR(200) NULL,
    contenido TEXT NOT NULL,
    scheduled_send_time TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    response_status VARCHAR(20) DEFAULT 'no_response', -- no_response, confirmed, cancelled, rescheduled
    response_received_at TIMESTAMPTZ NULL,
    response_content TEXT NULL,
    external_message_id VARCHAR(100) NULL, -- WhatsApp/Email provider message ID
    metadata JSONB DEFAULT '{}', -- Additional data
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create notification logs table for audit trail
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmacion_id UUID REFERENCES turnos_confirmaciones(id) ON DELETE CASCADE,
    evento VARCHAR(50) NOT NULL, -- sent, delivered, read, responded, failed
    detalles JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_notification_templates_tipo ON notification_templates(tipo);
CREATE INDEX idx_notification_templates_canal ON notification_templates(canal);
CREATE INDEX idx_notification_templates_activo ON notification_templates(activo);

CREATE INDEX idx_turnos_confirmaciones_turno ON turnos_confirmaciones(turno_id);
CREATE INDEX idx_turnos_confirmaciones_scheduled ON turnos_confirmaciones(scheduled_send_time);
CREATE INDEX idx_turnos_confirmaciones_delivery_status ON turnos_confirmaciones(delivery_status);
CREATE INDEX idx_turnos_confirmaciones_response_status ON turnos_confirmaciones(response_status);
CREATE INDEX idx_turnos_confirmaciones_canal ON turnos_confirmaciones(canal);

CREATE INDEX idx_notification_logs_confirmacion ON notification_logs(confirmacion_id);
CREATE INDEX idx_notification_logs_evento ON notification_logs(evento);
CREATE INDEX idx_notification_logs_timestamp ON notification_logs(timestamp);

-- Insert default notification templates
INSERT INTO notification_templates (nombre, tipo, canal, contenido, variables) VALUES
('Confirmación WhatsApp 24h', 'confirmacion', 'whatsapp', 
 'Hola {nombre_paciente}! 👋 Te recordamos que tienes una cita programada para mañana {fecha_cita} a las {hora_cita} para {tratamiento}. ¿Podrás asistir? Responde: ✅ SÍ para confirmar, ❌ NO para cancelar, o 📅 REPROGRAMAR para cambiar la fecha.',
 ARRAY['nombre_paciente', 'fecha_cita', 'hora_cita', 'tratamiento']),

('Recordatorio WhatsApp 2h', 'recordatorio', 'whatsapp',
 'Hola {nombre_paciente}! 🕐 Te recordamos que tu cita es en 2 horas ({hora_cita}) para {tratamiento}. Te esperamos en la clínica. ¡Gracias!',
 ARRAY['nombre_paciente', 'hora_cita', 'tratamiento']),

('Confirmación Email', 'confirmacion', 'email',
 'Estimado/a {nombre_paciente}, le recordamos que tiene una cita programada para el {fecha_cita} a las {hora_cita} para {tratamiento}. Por favor confirme su asistencia.',
 ARRAY['nombre_paciente', 'fecha_cita', 'hora_cita', 'tratamiento']),

('Cancelación WhatsApp', 'cancelacion', 'whatsapp',
 'Hola {nombre_paciente}, lamentamos informarte que tu cita del {fecha_cita} a las {hora_cita} ha sido cancelada. Te contactaremos pronto para reprogramar.',
 ARRAY['nombre_paciente', 'fecha_cita', 'hora_cita']);

-- Function to create confirmation from template
CREATE OR REPLACE FUNCTION create_confirmation_from_template(
    p_turno_id INTEGER,
    p_template_id INTEGER,
    p_destinatario VARCHAR(100),
    p_scheduled_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_confirmation_id UUID;
    v_template RECORD;
    v_turno RECORD;
    v_paciente RECORD;
    v_contenido TEXT;
    v_asunto TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM notification_templates WHERE id = p_template_id AND activo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive';
    END IF;
    
    -- Get appointment and patient details
    SELECT t.*, tr.nombre as tratamiento_nombre 
    INTO v_turno 
    FROM turnos t
    LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
    WHERE t.id = p_turno_id;
    
    SELECT * INTO v_paciente FROM pacientes WHERE dni = v_turno.paciente_dni;
    
    -- Replace variables in content
    v_contenido := v_template.contenido;
    v_contenido := REPLACE(v_contenido, '{nombre_paciente}', v_paciente.nombre_apellido);
    v_contenido := REPLACE(v_contenido, '{fecha_cita}', to_char(v_turno.fecha_horario_inicio, 'DD/MM/YYYY'));
    v_contenido := REPLACE(v_contenido, '{hora_cita}', to_char(v_turno.fecha_horario_inicio, 'HH24:MI'));
    v_contenido := REPLACE(v_contenido, '{tratamiento}', COALESCE(v_turno.tratamiento_nombre, 'consulta'));
    
    -- Replace variables in subject if exists
    IF v_template.asunto IS NOT NULL THEN
        v_asunto := v_template.asunto;
        v_asunto := REPLACE(v_asunto, '{nombre_paciente}', v_paciente.nombre_apellido);
        v_asunto := REPLACE(v_asunto, '{fecha_cita}', to_char(v_turno.fecha_horario_inicio, 'DD/MM/YYYY'));
        v_asunto := REPLACE(v_asunto, '{hora_cita}', to_char(v_turno.fecha_horario_inicio, 'HH24:MI'));
        v_asunto := REPLACE(v_asunto, '{tratamiento}', COALESCE(v_turno.tratamiento_nombre, 'consulta'));
    END IF;
    
    -- Set default scheduled time if not provided
    IF p_scheduled_time IS NULL THEN
        p_scheduled_time := v_turno.fecha_horario_inicio - INTERVAL '24 hours';
    END IF;
    
    -- Insert confirmation
    INSERT INTO turnos_confirmaciones (
        turno_id,
        template_id,
        canal,
        destinatario,
        asunto,
        contenido,
        scheduled_send_time
    ) VALUES (
        p_turno_id,
        p_template_id,
        v_template.canal,
        p_destinatario,
        v_asunto,
        v_contenido,
        p_scheduled_time
    ) RETURNING id INTO v_confirmation_id;
    
    RETURN v_confirmation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending confirmations for sending
CREATE OR REPLACE FUNCTION get_pending_confirmations(p_canal VARCHAR(20) DEFAULT NULL)
RETURNS TABLE (
    confirmation_id UUID,
    turno_id INTEGER,
    canal VARCHAR(20),
    destinatario VARCHAR(100),
    asunto VARCHAR(200),
    contenido TEXT,
    patient_name VARCHAR(100),
    appointment_datetime TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.turno_id,
        tc.canal,
        tc.destinatario,
        tc.asunto,
        tc.contenido,
        p.nombre_apellido,
        t.fecha_horario_inicio
    FROM turnos_confirmaciones tc
    JOIN turnos t ON tc.turno_id = t.id
    JOIN pacientes p ON t.paciente_dni = p.dni
    WHERE tc.delivery_status = 'pending'
        AND tc.scheduled_send_time <= NOW()
        AND t.estado IN ('reservado', 'confirmado_paciente')
        AND (p_canal IS NULL OR tc.canal = p_canal);
END;
$$ LANGUAGE plpgsql;

-- Function to update confirmation status and log event
CREATE OR REPLACE FUNCTION update_confirmation_status(
    p_confirmation_id UUID,
    p_delivery_status VARCHAR(20) DEFAULT NULL,
    p_response_status VARCHAR(20) DEFAULT NULL,
    p_response_content TEXT DEFAULT NULL,
    p_external_message_id VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_delivery_status VARCHAR(20);
    v_old_response_status VARCHAR(20);
BEGIN
    -- Get current status for logging
    SELECT delivery_status, response_status 
    INTO v_old_delivery_status, v_old_response_status
    FROM turnos_confirmaciones 
    WHERE id = p_confirmation_id;
    
    -- Update confirmation
    UPDATE turnos_confirmaciones 
    SET 
        delivery_status = COALESCE(p_delivery_status, delivery_status),
        response_status = COALESCE(p_response_status, response_status),
        response_content = COALESCE(p_response_content, response_content),
        external_message_id = COALESCE(p_external_message_id, external_message_id),
        metadata = COALESCE(p_metadata, metadata),
        sent_at = CASE WHEN p_delivery_status = 'sent' THEN NOW() ELSE sent_at END,
        response_received_at = CASE WHEN p_response_status IS NOT NULL AND p_response_status != 'no_response' THEN NOW() ELSE response_received_at END,
        updated_at = NOW()
    WHERE id = p_confirmation_id;
    
    -- Log status changes
    IF p_delivery_status IS NOT NULL AND p_delivery_status != v_old_delivery_status THEN
        INSERT INTO notification_logs (confirmacion_id, evento, detalles)
        VALUES (p_confirmation_id, 'delivery_status_changed', 
                jsonb_build_object('from', v_old_delivery_status, 'to', p_delivery_status));
    END IF;
    
    IF p_response_status IS NOT NULL AND p_response_status != v_old_response_status THEN
        INSERT INTO notification_logs (confirmacion_id, evento, detalles)
        VALUES (p_confirmation_id, 'response_received', 
                jsonb_build_object('status', p_response_status, 'content', p_response_content));
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create confirmations when appointments are created
CREATE OR REPLACE FUNCTION trigger_auto_create_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_default_template_id INTEGER;
    v_patient_phone VARCHAR(20);
BEGIN
    -- Only create for appointments more than 24 hours away
    IF NEW.fecha_horario_inicio > NOW() + INTERVAL '24 hours' AND NEW.estado = 'reservado' THEN
        -- Get default WhatsApp confirmation template
        SELECT id INTO v_default_template_id 
        FROM notification_templates 
        WHERE tipo = 'confirmacion' AND canal = 'whatsapp' AND activo = true 
        LIMIT 1;
        
        -- Get patient phone
        SELECT telefono INTO v_patient_phone 
        FROM pacientes 
        WHERE dni = NEW.paciente_dni;
        
        IF v_default_template_id IS NOT NULL AND v_patient_phone IS NOT NULL THEN
            PERFORM create_confirmation_from_template(
                NEW.id,
                v_default_template_id,
                v_patient_phone
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use new function
DROP TRIGGER IF EXISTS trigger_auto_schedule_whatsapp ON turnos;
CREATE TRIGGER trigger_auto_create_confirmation
    AFTER INSERT ON turnos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_create_confirmation();
