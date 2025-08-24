-- WhatsApp Confirmation Tracking System
-- This system tracks WhatsApp messages sent to patients for appointment confirmations

-- Table to track WhatsApp confirmation messages
CREATE TABLE whatsapp_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  patient_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_send_time TIMESTAMP NOT NULL,
  sent_at TIMESTAMP NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  response_status VARCHAR(20) DEFAULT 'no_response', -- no_response, confirmed, cancelled, rescheduled
  response_received_at TIMESTAMP NULL,
  response_content TEXT NULL,
  whatsapp_message_id VARCHAR(100) NULL, -- WhatsApp API message ID
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_whatsapp_confirmations_turno_id ON whatsapp_confirmations(turno_id);
CREATE INDEX idx_whatsapp_confirmations_scheduled_send ON whatsapp_confirmations(scheduled_send_time);
CREATE INDEX idx_whatsapp_confirmations_delivery_status ON whatsapp_confirmations(delivery_status);
CREATE INDEX idx_whatsapp_confirmations_tenant ON whatsapp_confirmations(tenant_id);

-- Function to schedule WhatsApp confirmations for appointments
CREATE OR REPLACE FUNCTION schedule_whatsapp_confirmation(p_turno_id UUID)
RETURNS UUID AS $$
DECLARE
  v_confirmation_id UUID;
  v_turno RECORD;
  v_patient RECORD;
  v_scheduled_time TIMESTAMP;
  v_message_content TEXT;
BEGIN
  -- Get appointment details
  SELECT t.*, tr.nombre as tratamiento_nombre 
  INTO v_turno 
  FROM turnos t
  LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
  WHERE t.id = p_turno_id;
  
  -- Get patient details
  SELECT * INTO v_patient FROM pacientes WHERE id = v_turno.paciente_id;
  
  -- Calculate scheduled send time (24 hours before appointment)
  v_scheduled_time := v_turno.fecha_hora - INTERVAL '24 hours';
  
  -- Create message content
  v_message_content := format(
    'Hola %s! 👋 Te recordamos que tienes una cita programada para mañana %s a las %s para %s. ¿Podrás asistir? Responde: ✅ SÍ para confirmar, ❌ NO para cancelar, o 📅 REPROGRAMAR para cambiar la fecha.',
    v_patient.nombre_completo,
    to_char(v_turno.fecha_hora, 'DD/MM/YYYY'),
    to_char(v_turno.fecha_hora, 'HH24:MI'),
    COALESCE(v_tratamiento_nombre, 'tu consulta')
  );
  
  -- Insert confirmation record
  INSERT INTO whatsapp_confirmations (
    turno_id,
    patient_phone,
    message_content,
    scheduled_send_time,
    tenant_id
  ) VALUES (
    p_turno_id,
    v_patient.telefono,
    v_message_content,
    v_scheduled_time,
    v_turno.tenant_id
  ) RETURNING id INTO v_confirmation_id;
  
  RETURN v_confirmation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending confirmations to send
CREATE OR REPLACE FUNCTION get_pending_whatsapp_confirmations()
RETURNS TABLE (
  confirmation_id UUID,
  turno_id UUID,
  patient_name VARCHAR(100),
  patient_phone VARCHAR(20),
  message_content TEXT,
  appointment_datetime TIMESTAMP,
  tratamiento_nombre VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.turno_id,
    p.nombre_completo,
    wc.patient_phone,
    wc.message_content,
    t.fecha_hora,
    tr.nombre
  FROM whatsapp_confirmations wc
  JOIN turnos t ON wc.turno_id = t.id
  JOIN pacientes p ON t.paciente_id = p.id
  LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
  WHERE wc.delivery_status = 'pending'
    AND wc.scheduled_send_time <= NOW()
    AND t.estado = 'reservado'; -- Only send for reserved appointments
END;
$$ LANGUAGE plpgsql;

-- Function to update confirmation status
CREATE OR REPLACE FUNCTION update_whatsapp_confirmation_status(
  p_confirmation_id UUID,
  p_delivery_status VARCHAR(20) DEFAULT NULL,
  p_response_status VARCHAR(20) DEFAULT NULL,
  p_response_content TEXT DEFAULT NULL,
  p_whatsapp_message_id VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE whatsapp_confirmations 
  SET 
    delivery_status = COALESCE(p_delivery_status, delivery_status),
    response_status = COALESCE(p_response_status, response_status),
    response_content = COALESCE(p_response_content, response_content),
    whatsapp_message_id = COALESCE(p_whatsapp_message_id, whatsapp_message_id),
    sent_at = CASE WHEN p_delivery_status = 'sent' THEN NOW() ELSE sent_at END,
    response_received_at = CASE WHEN p_response_status IS NOT NULL AND p_response_status != 'no_response' THEN NOW() ELSE response_received_at END,
    updated_at = NOW()
  WHERE id = p_confirmation_id;
  
  -- Update appointment status based on response
  IF p_response_status = 'confirmed' THEN
    UPDATE turnos SET estado = 'confirmado' WHERE id = (
      SELECT turno_id FROM whatsapp_confirmations WHERE id = p_confirmation_id
    );
  ELSIF p_response_status = 'cancelled' THEN
    UPDATE turnos SET estado = 'cancelado' WHERE id = (
      SELECT turno_id FROM whatsapp_confirmations WHERE id = p_confirmation_id
    );
  ELSIF p_response_status = 'rescheduled' THEN
    UPDATE turnos SET estado = 'reprogramado' WHERE id = (
      SELECT turno_id FROM whatsapp_confirmations WHERE id = p_confirmation_id
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically schedule WhatsApp confirmation when appointment is created
CREATE OR REPLACE FUNCTION trigger_schedule_whatsapp_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only schedule for appointments that are more than 24 hours away
  IF NEW.fecha_hora > NOW() + INTERVAL '24 hours' AND NEW.estado = 'reservado' THEN
    PERFORM schedule_whatsapp_confirmation(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_schedule_whatsapp
  AFTER INSERT ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_whatsapp_confirmation();

-- Add RLS policies
ALTER TABLE whatsapp_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view confirmations for their tenant" ON whatsapp_confirmations
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert confirmations for their tenant" ON whatsapp_confirmations
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update confirmations for their tenant" ON whatsapp_confirmations
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
