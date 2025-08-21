-- Habilitar Row Level Security y crear políticas de seguridad para las tablas
-- Esto protege las tablas que actualmente están marcadas como "Unrestricted"

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_sociales ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_productos
CREATE POLICY "Allow authenticated users to view categorias_productos" ON categorias_productos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert categorias_productos" ON categorias_productos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update categorias_productos" ON categorias_productos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categorias_productos" ON categorias_productos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para obras_sociales
CREATE POLICY "Allow authenticated users to view obras_sociales" ON obras_sociales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert obras_sociales" ON obras_sociales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update obras_sociales" ON obras_sociales
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete obras_sociales" ON obras_sociales
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para insumos
CREATE POLICY "Allow authenticated users to view insumos" ON insumos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert insumos" ON insumos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update insumos" ON insumos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete insumos" ON insumos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para ventas
CREATE POLICY "Allow authenticated users to view ventas" ON ventas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ventas" ON ventas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update ventas" ON ventas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete ventas" ON ventas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para detalle_ventas
CREATE POLICY "Allow authenticated users to view detalle_ventas" ON detalle_ventas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert detalle_ventas" ON detalle_ventas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update detalle_ventas" ON detalle_ventas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete detalle_ventas" ON detalle_ventas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Opcional: Crear políticas más específicas para el servicio (service_role)
-- Esto permite que la aplicación acceda a los datos usando la service key

CREATE POLICY "Allow service role full access to categorias_productos" ON categorias_productos
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access to obras_sociales" ON obras_sociales
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access to insumos" ON insumos
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access to ventas" ON ventas
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access to detalle_ventas" ON detalle_ventas
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
