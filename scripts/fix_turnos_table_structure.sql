-- Clean up turnos table structure to separate appointment status from payment status
-- Remove duplicate payment status fields and clarify the purpose of each field

-- Remove duplicate payment status field (keep only payment_status, remove estado_pago)
ALTER TABLE turnos DROP COLUMN IF EXISTS estado_pago;

-- Add comments to clarify field purposes
COMMENT ON COLUMN turnos.estado IS 'Estado del turno: reservado, confirmado, reprogramado, cancelado_paciente, cancelado_consultorio, completado, no_asistio';
COMMENT ON COLUMN turnos.payment_status IS 'Estado del pago: pending, succeeded, failed, canceled';
COMMENT ON COLUMN turnos.payment_intent_id IS 'ID del payment intent de Stripe';
COMMENT ON COLUMN turnos.deposit_amount IS 'Monto de la seña requerida';
COMMENT ON COLUMN turnos.payment_amount IS 'Monto total pagado';

-- Create index for better performance when checking availability
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_estado ON turnos(fecha_horario_inicio, estado);
