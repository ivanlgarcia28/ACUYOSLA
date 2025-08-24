-- Add payment status field to track if completed appointments have been paid
ALTER TABLE turnos ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pendiente';

-- Update existing completed appointments to have pending payment status
UPDATE turnos 
SET estado_pago = 'pendiente' 
WHERE estado = 'completado';

-- Add comment for clarity
COMMENT ON COLUMN turnos.estado_pago IS 'Estado de pago del turno: pendiente, pagado, exento';
