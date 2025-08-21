-- Modificar la tabla pacientes para usar foreign key a obras_sociales
-- Primero, agregar una nueva columna temporal para el ID de obra social
ALTER TABLE pacientes ADD COLUMN obra_social_id INTEGER;

-- Actualizar los registros existentes para mapear los nombres a IDs
UPDATE pacientes SET obra_social_id = (
  SELECT id FROM obras_sociales 
  WHERE UPPER(obras_sociales.nombre) = UPPER(pacientes.obra_social)
);

-- Para registros que no coincidan exactamente, asignar "Particular" como default
UPDATE pacientes SET obra_social_id = (
  SELECT id FROM obras_sociales WHERE nombre = 'Particular'
) WHERE obra_social_id IS NULL;

-- Hacer la columna NOT NULL
ALTER TABLE pacientes ALTER COLUMN obra_social_id SET NOT NULL;

-- Agregar la foreign key constraint
ALTER TABLE pacientes ADD CONSTRAINT fk_pacientes_obra_social 
  FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id);

-- Eliminar la columna antigua de texto
ALTER TABLE pacientes DROP COLUMN obra_social;

-- Renombrar la nueva columna
ALTER TABLE pacientes RENAME COLUMN obra_social_id TO obra_social;

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN pacientes.obra_social IS 'Foreign key referencing obras_sociales.id';
