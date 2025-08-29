-- Migrate data from backup table to new structure
INSERT INTO turnos (
    paciente_dni,
    tratamiento_id,
    calendar_id,
    estado,
    fecha_horario_inicio,
    fecha_horario_fin,
    created_at,
    modified_at,
    observaciones,
    tenant_id
)
SELECT 
    paciente_dni,
    tratamiento_id,
    calendar_id,
    CASE 
        WHEN estado = 'confirmado_paciente' THEN 'confirmado'
        WHEN estado = 'cancelado_paciente' THEN 'cancelado_paciente'
        WHEN estado = 'reprogramado_paciente' THEN 'reprogramado'
        ELSE COALESCE(estado, 'reservado')
    END as estado,
    fecha_horario_inicio,
    fecha_horario_fin,
    created_at,
    modified_at,
    observaciones,
    tenant_id
FROM turnos_backup
WHERE deleted_at IS NULL;

-- Migrate payment data where it exists
INSERT INTO turnos_pagos (turno_id, monto_total, monto_pagado, estado_pago, metodo_pago, fecha_pago)
SELECT 
    t.id,
    COALESCE(tb.payment_amount, tb.deposit_amount, 0) as monto_total,
    CASE 
        WHEN tb.payment_status = 'paid' THEN COALESCE(tb.payment_amount, tb.deposit_amount, 0)
        ELSE 0
    END as monto_pagado,
    CASE 
        WHEN tb.payment_status = 'paid' THEN 'pagado'
        WHEN tb.payment_status = 'pending' THEN 'pendiente'
        ELSE 'pendiente'
    END as estado_pago,
    'stripe' as metodo_pago,
    CASE WHEN tb.payment_status = 'paid' THEN tb.modified_at ELSE NULL END as fecha_pago
FROM turnos t
JOIN turnos_backup tb ON t.paciente_dni = tb.paciente_dni 
    AND t.fecha_horario_inicio = tb.fecha_horario_inicio
WHERE tb.payment_amount IS NOT NULL OR tb.deposit_amount IS NOT NULL;
