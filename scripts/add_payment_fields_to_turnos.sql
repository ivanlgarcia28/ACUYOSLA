-- Add payment tracking fields to turnos table
ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 5000.00;

-- Update existing appointments to not require deposit by default
UPDATE turnos SET deposit_required = false WHERE payment_status IS NULL;

-- Add index for payment queries
CREATE INDEX IF NOT EXISTS idx_turnos_payment_intent ON turnos(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_turnos_payment_status ON turnos(payment_status);
