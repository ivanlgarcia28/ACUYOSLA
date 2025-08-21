-- Sistema de control de inventario por lotes
-- Permite rastrear compras de productos por fecha y precio para calcular ganancias

-- Tabla para registrar compras/lotes de productos
CREATE TABLE IF NOT EXISTS public.lotes_productos (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    fecha_compra DATE NOT NULL,
    precio_compra NUMERIC(10,2) NOT NULL,
    cantidad_comprada INTEGER NOT NULL,
    cantidad_disponible INTEGER NOT NULL,
    proveedor VARCHAR(255),
    numero_factura VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_lotes_productos_producto_id ON public.lotes_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_productos_fecha_compra ON public.lotes_productos(fecha_compra);

-- Tabla para registrar qué lotes se usaron en cada venta (para calcular ganancias exactas)
CREATE TABLE IF NOT EXISTS public.detalle_ventas_lotes (
    id SERIAL PRIMARY KEY,
    detalle_venta_id INTEGER NOT NULL REFERENCES public.detalle_ventas(id) ON DELETE CASCADE,
    lote_id INTEGER NOT NULL REFERENCES public.lotes_productos(id) ON DELETE CASCADE,
    cantidad_usada INTEGER NOT NULL,
    precio_compra_unitario NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_lotes_detalle_venta_id ON public.detalle_ventas_lotes(detalle_venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_lotes_lote_id ON public.detalle_ventas_lotes(lote_id);

-- Función para actualizar cantidad disponible en lotes cuando se hace una venta
CREATE OR REPLACE FUNCTION actualizar_lotes_en_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta función se ejecutará cuando se inserte un detalle de venta
    -- y actualizará automáticamente los lotes usando FIFO (First In, First Out)
    
    DECLARE
        cantidad_restante INTEGER := NEW.cantidad;
        lote_record RECORD;
    BEGIN
        -- Recorrer lotes del producto ordenados por fecha (FIFO)
        FOR lote_record IN 
            SELECT id, cantidad_disponible, precio_compra
            FROM public.lotes_productos 
            WHERE producto_id = (
                SELECT producto_id 
                FROM public.productos 
                WHERE id = NEW.producto_id
            )
            AND cantidad_disponible > 0
            ORDER BY fecha_compra ASC, id ASC
        LOOP
            IF cantidad_restante <= 0 THEN
                EXIT;
            END IF;
            
            DECLARE
                cantidad_a_usar INTEGER := LEAST(cantidad_restante, lote_record.cantidad_disponible);
            BEGIN
                -- Registrar qué lote se usó en esta venta
                INSERT INTO public.detalle_ventas_lotes (
                    detalle_venta_id, 
                    lote_id, 
                    cantidad_usada, 
                    precio_compra_unitario
                ) VALUES (
                    NEW.id, 
                    lote_record.id, 
                    cantidad_a_usar, 
                    lote_record.precio_compra
                );
                
                -- Actualizar cantidad disponible en el lote
                UPDATE public.lotes_productos 
                SET cantidad_disponible = cantidad_disponible - cantidad_a_usar,
                    updated_at = NOW()
                WHERE id = lote_record.id;
                
                -- Reducir cantidad restante
                cantidad_restante := cantidad_restante - cantidad_a_usar;
            END;
        END LOOP;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_lotes_en_venta ON public.detalle_ventas;
CREATE TRIGGER trigger_actualizar_lotes_en_venta
    AFTER INSERT ON public.detalle_ventas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_lotes_en_venta();

-- Vista para calcular ganancias por venta
CREATE OR REPLACE VIEW public.vista_ganancias_ventas AS
SELECT 
    v.id as venta_id,
    v.fecha,
    v.total as total_venta,
    COALESCE(SUM(dvl.cantidad_usada * dvl.precio_compra_unitario), 0) as costo_total,
    v.total - COALESCE(SUM(dvl.cantidad_usada * dvl.precio_compra_unitario), 0) as ganancia_bruta,
    CASE 
        WHEN v.total > 0 THEN 
            ROUND(((v.total - COALESCE(SUM(dvl.cantidad_usada * dvl.precio_compra_unitario), 0)) / v.total * 100), 2)
        ELSE 0 
    END as margen_ganancia_porcentaje
FROM public.ventas v
LEFT JOIN public.detalle_ventas dv ON v.id = dv.venta_id
LEFT JOIN public.detalle_ventas_lotes dvl ON dv.id = dvl.detalle_venta_id
GROUP BY v.id, v.fecha, v.total;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.lotes_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas_lotes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir acceso completo por ahora)
CREATE POLICY "Allow all operations on lotes_productos" ON public.lotes_productos FOR ALL USING (true);
CREATE POLICY "Allow all operations on detalle_ventas_lotes" ON public.detalle_ventas_lotes FOR ALL USING (true);
