-- Crear tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias_productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las categorías principales
INSERT INTO categorias_productos (nombre, descripcion) VALUES
('Guantes de Nitrilo', 'Guantes desechables de nitrilo en diferentes colores y presentaciones'),
('Compresas Descartables', 'Compresas desechables para uso médico y odontológico'),
('Barbijos Tricapa', 'Barbijos tricapa en diferentes colores y cantidades'),
('Otros Insumos', 'Otros insumos médicos y odontológicos');
