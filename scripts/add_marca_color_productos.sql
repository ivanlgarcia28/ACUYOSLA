-- Agregando campos marca y color a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Actualizar productos existentes con valores por defecto
UPDATE productos 
SET marca = 'Sin especificar', color = 'Sin especificar' 
WHERE marca IS NULL OR color IS NULL;
