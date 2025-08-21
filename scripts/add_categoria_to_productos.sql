-- Agregar columna categoria_id a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES categorias_productos(id);

-- Agregar columna descripcion para más detalles del producto
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Agregar columna presentacion para especificar la cantidad (ej: "Caja x 100u")
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS presentacion VARCHAR(100);
