-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'reservado' CHECK (estado IN ('pagado', 'reservado')),
    total DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de detalle de ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_id ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto_id ON detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en ventas
CREATE TRIGGER update_ventas_updated_at 
    BEFORE UPDATE ON ventas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
