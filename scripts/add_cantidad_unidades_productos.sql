-- Add cantidad_unidades column to productos table
ALTER TABLE productos 
ADD COLUMN cantidad_unidades INTEGER DEFAULT 1;

-- Update existing products to have a default value
UPDATE productos 
SET cantidad_unidades = 1 
WHERE cantidad_unidades IS NULL;

-- Add comment to the column
COMMENT ON COLUMN productos.cantidad_unidades IS 'Cantidad de unidades por producto/caja';
