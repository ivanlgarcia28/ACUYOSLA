-- Create new turnos_pagos table for payment tracking
CREATE TABLE turnos_pagos (
    id SERIAL PRIMARY KEY,
    turno_id INTEGER NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    estado_pago VARCHAR(20) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    fecha_pago TIMESTAMPTZ NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_turnos_pagos_estado ON turnos_pagos(estado_pago);
CREATE INDEX idx_turnos_pagos_turno ON turnos_pagos(turno_id);
CREATE INDEX idx_turnos_pagos_fecha ON turnos_pagos(fecha_pago);

-- Add constraint to ensure monto_pagado doesn't exceed monto_total
ALTER TABLE turnos_pagos ADD CONSTRAINT chk_monto_pagado 
    CHECK (monto_pagado <= monto_total);
