-- Create views and functions for analytics and reporting

-- View for appointment analytics
CREATE OR REPLACE VIEW v_appointment_analytics AS
SELECT 
    DATE(fecha_horario_inicio) as fecha,
    COUNT(*) as total_turnos,
    COUNT(CASE WHEN estado LIKE '%confirmado%' THEN 1 END) as confirmados,
    COUNT(CASE WHEN estado LIKE '%cancelado%' THEN 1 END) as cancelados,
    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
    COUNT(CASE WHEN estado = 'no_asistio' THEN 1 END) as no_asistio,
    AVG(EXTRACT(EPOCH FROM (fecha_horario_fin - fecha_horario_inicio))/60) as duracion_promedio_minutos
FROM turnos
WHERE fecha_horario_inicio >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(fecha_horario_inicio)
ORDER BY fecha DESC;

-- View for revenue analytics
CREATE OR REPLACE VIEW v_revenue_analytics AS
SELECT 
    DATE(tp.fecha_pago) as fecha,
    COUNT(*) as total_pagos,
    SUM(tp.monto_pagado) as ingresos_totales,
    AVG(tp.monto_pagado) as ingreso_promedio,
    tr.nombre as tratamiento,
    COUNT(t.id) as cantidad_turnos_tratamiento,
    SUM(tp.monto_pagado) as ingresos_por_tratamiento
FROM turnos_pagos tp
JOIN turnos t ON tp.turno_id = t.id
LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
WHERE tp.estado_pago = 'pagado'
    AND tp.fecha_pago >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(tp.fecha_pago), tr.nombre
ORDER BY fecha DESC, ingresos_por_tratamiento DESC;

-- View for patient analytics
CREATE OR REPLACE VIEW v_patient_analytics AS
SELECT 
    DATE(created_at) as fecha_registro,
    COUNT(*) as pacientes_nuevos,
    COUNT(*) OVER (ORDER BY DATE(created_at)) as pacientes_acumulados
FROM pacientes
WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(created_at)
ORDER BY fecha_registro DESC;

-- View for efficiency metrics
CREATE OR REPLACE VIEW v_efficiency_metrics AS
SELECT 
    DATE(t.fecha_horario_inicio) as fecha,
    COUNT(*) as total_turnos,
    COUNT(tc.id) as confirmaciones_enviadas,
    COUNT(CASE WHEN tc.response_status = 'confirmed' THEN 1 END) as confirmaciones_recibidas,
    COUNT(CASE WHEN tc.response_status = 'cancelled' THEN 1 END) as cancelaciones_recibidas,
    COUNT(CASE WHEN t.estado = 'no_asistio' THEN 1 END) as no_asistencias,
    ROUND(
        (COUNT(CASE WHEN tc.response_status = 'confirmed' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(tc.id), 0)) * 100, 2
    ) as tasa_confirmacion,
    ROUND(
        (COUNT(CASE WHEN t.estado = 'no_asistio' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as tasa_no_asistencia
FROM turnos t
LEFT JOIN turnos_confirmaciones tc ON t.id = tc.turno_id
WHERE t.fecha_horario_inicio >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(t.fecha_horario_inicio)
ORDER BY fecha DESC;

-- Function to get monthly comparison data
CREATE OR REPLACE FUNCTION get_monthly_comparison(months_back INTEGER DEFAULT 6)
RETURNS TABLE (
    mes VARCHAR(7),
    total_turnos BIGINT,
    ingresos_totales NUMERIC,
    pacientes_nuevos BIGINT,
    tasa_confirmacion NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', t.fecha_horario_inicio), 'YYYY-MM') as mes,
            COUNT(t.id) as total_turnos,
            COALESCE(SUM(tp.monto_pagado), 0) as ingresos_totales,
            COUNT(DISTINCT CASE 
                WHEN p.created_at >= DATE_TRUNC('month', t.fecha_horario_inicio) 
                AND p.created_at < DATE_TRUNC('month', t.fecha_horario_inicio) + INTERVAL '1 month'
                THEN p.dni 
            END) as pacientes_nuevos,
            ROUND(
                (COUNT(CASE WHEN tc.response_status = 'confirmed' THEN 1 END)::DECIMAL / 
                 NULLIF(COUNT(tc.id), 0)) * 100, 2
            ) as tasa_confirmacion
        FROM turnos t
        LEFT JOIN turnos_pagos tp ON t.id = tp.turno_id AND tp.estado_pago = 'pagado'
        LEFT JOIN pacientes p ON t.paciente_dni = p.dni
        LEFT JOIN turnos_confirmaciones tc ON t.id = tc.turno_id
        WHERE t.fecha_horario_inicio >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * months_back
        GROUP BY DATE_TRUNC('month', t.fecha_horario_inicio)
        ORDER BY mes DESC
    )
    SELECT * FROM monthly_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get treatment popularity
CREATE OR REPLACE FUNCTION get_treatment_popularity(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    tratamiento VARCHAR(100),
    cantidad_turnos BIGINT,
    ingresos_totales NUMERIC,
    ingreso_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(tr.nombre, 'Sin especificar') as tratamiento,
        COUNT(t.id) as cantidad_turnos,
        COALESCE(SUM(tp.monto_pagado), 0) as ingresos_totales,
        COALESCE(AVG(tp.monto_pagado), 0) as ingreso_promedio
    FROM turnos t
    LEFT JOIN tratamientos tr ON t.tratamiento_id = tr.id
    LEFT JOIN turnos_pagos tp ON t.id = tp.turno_id AND tp.estado_pago = 'pagado'
    WHERE DATE(t.fecha_horario_inicio) BETWEEN start_date AND end_date
    GROUP BY tr.nombre
    ORDER BY cantidad_turnos DESC, ingresos_totales DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily trends
CREATE OR REPLACE FUNCTION get_daily_trends(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    fecha DATE,
    total_turnos BIGINT,
    turnos_confirmados BIGINT,
    turnos_completados BIGINT,
    ingresos_dia NUMERIC,
    pacientes_nuevos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(t.fecha_horario_inicio) as fecha,
        COUNT(t.id) as total_turnos,
        COUNT(CASE WHEN t.estado LIKE '%confirmado%' THEN 1 END) as turnos_confirmados,
        COUNT(CASE WHEN t.estado = 'completado' THEN 1 END) as turnos_completados,
        COALESCE(SUM(tp.monto_pagado), 0) as ingresos_dia,
        COUNT(DISTINCT CASE 
            WHEN DATE(p.created_at) = DATE(t.fecha_horario_inicio) THEN p.dni 
        END) as pacientes_nuevos
    FROM turnos t
    LEFT JOIN turnos_pagos tp ON t.id = tp.turno_id AND tp.estado_pago = 'pagado'
    LEFT JOIN pacientes p ON t.paciente_dni = p.dni
    WHERE DATE(t.fecha_horario_inicio) BETWEEN start_date AND end_date
    GROUP BY DATE(t.fecha_horario_inicio)
    ORDER BY fecha DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_estado ON turnos(DATE(fecha_horario_inicio), estado);
CREATE INDEX IF NOT EXISTS idx_turnos_pagos_fecha_estado ON turnos_pagos(DATE(fecha_pago), estado_pago);
CREATE INDEX IF NOT EXISTS idx_pacientes_fecha_creacion ON pacientes(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_turnos_confirmaciones_response ON turnos_confirmaciones(response_status, DATE(created_at));
