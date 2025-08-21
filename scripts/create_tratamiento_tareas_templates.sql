-- Crear tabla de plantillas de tareas por tratamiento
CREATE TABLE IF NOT EXISTS tratamiento_tareas_template (
    id SERIAL PRIMARY KEY,
    tratamiento_id INTEGER REFERENCES tratamientos(id) ON DELETE CASCADE,
    tarea_nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar campo de observaciones a la tabla turnos
ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Insertar tareas predefinidas para algunos tratamientos comunes
INSERT INTO tratamiento_tareas_template (tratamiento_id, tarea_nombre, descripcion, orden) 
SELECT 
    t.id,
    tarea.nombre,
    tarea.descripcion,
    tarea.orden
FROM tratamientos t
CROSS JOIN (
    VALUES 
        ('Preparar instrumental básico', 'Esterilizar y preparar instrumental dental básico', 1),
        ('Verificar anestesia', 'Comprobar disponibilidad y fecha de vencimiento de anestesia', 2),
        ('Preparar materiales', 'Alistar materiales específicos según tratamiento', 3),
        ('Revisar historial médico', 'Verificar alergias y condiciones médicas del paciente', 4)
) AS tarea(nombre, descripcion, orden)
WHERE t.nombre IN ('Consulta', 'Limpieza', 'Extracción');

-- Insertar tareas específicas para tratamientos especializados
INSERT INTO tratamiento_tareas_template (tratamiento_id, tarea_nombre, descripcion, orden)
SELECT t.id, 'Preparar equipo de rayos X', 'Verificar funcionamiento del equipo radiográfico', 5
FROM tratamientos t 
WHERE t.nombre ILIKE '%radiografía%' OR t.nombre ILIKE '%endodoncia%';

INSERT INTO tratamiento_tareas_template (tratamiento_id, tarea_nombre, descripcion, orden)
SELECT t.id, 'Preparar materiales de obturación', 'Alistar composite, amalgama y materiales de restauración', 3
FROM tratamientos t 
WHERE t.nombre ILIKE '%obturación%' OR t.nombre ILIKE '%restauración%';

-- Habilitar RLS en la nueva tabla
ALTER TABLE tratamiento_tareas_template ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para tratamiento_tareas_template
CREATE POLICY "Allow all operations for authenticated users" ON tratamiento_tareas_template
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON tratamiento_tareas_template
    FOR ALL USING (auth.role() = 'service_role');
