-- Agregando columna insumos_id a la tabla tratamientos como foreign key
ALTER TABLE tratamientos 
ADD COLUMN insumos_id INTEGER REFERENCES insumos(id);

-- Asignar insumos por defecto a tratamientos existentes basado en el tipo de tratamiento
UPDATE tratamientos 
SET insumos_id = CASE 
  WHEN LOWER(nombre) LIKE '%consulta%' THEN 4  -- Kit Básico Consulta
  WHEN LOWER(nombre) LIKE '%limpieza%' OR LOWER(nombre) LIKE '%profilaxis%' THEN 5  -- Kit Limpieza Dental
  WHEN LOWER(nombre) LIKE '%extracción%' OR LOWER(nombre) LIKE '%extraccion%' THEN 6  -- Kit Extracción
  ELSE 4  -- Por defecto Kit Básico Consulta
END;

-- Crear índice para mejor rendimiento
CREATE INDEX idx_tratamientos_insumos ON tratamientos(insumos_id);
