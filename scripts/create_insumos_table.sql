-- Creando nueva tabla insumos para gestionar los insumos necesarios por tratamiento
CREATE TABLE IF NOT EXISTS insumos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER REFERENCES categorias_productos(id),
  cantidad_necesaria INTEGER NOT NULL DEFAULT 1,
  unidad_medida VARCHAR(50) DEFAULT 'unidad', -- unidad, caja, paquete, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos insumos básicos comunes en tratamientos dentales
INSERT INTO insumos (nombre, descripcion, categoria_id, cantidad_necesaria, unidad_medida) VALUES
('Guantes de Nitrilo Básicos', 'Guantes desechables para procedimientos básicos', 1, 2, 'unidad'),
('Compresas Básicas', 'Compresas descartables para limpieza', 2, 5, 'unidad'),
('Barbijo Tricapa Estándar', 'Barbijo de protección estándar', 3, 1, 'unidad'),
('Kit Básico Consulta', 'Insumos básicos para consulta general', 4, 1, 'kit'),
('Kit Limpieza Dental', 'Insumos para limpieza y profilaxis', 4, 1, 'kit'),
('Kit Extracción', 'Insumos necesarios para extracciones', 4, 1, 'kit');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_insumos_categoria ON insumos(categoria_id);
CREATE INDEX idx_insumos_nombre ON insumos(nombre);
