-- Actualizar políticas RLS para permitir acceso con la clave anónima
-- Esto es necesario para que la aplicación funcione sin autenticación de usuarios

-- Eliminar políticas existentes que requieren autenticación
DROP POLICY IF EXISTS "Allow authenticated users to view ventas" ON ventas;
DROP POLICY IF EXISTS "Allow authenticated users to insert ventas" ON ventas;
DROP POLICY IF EXISTS "Allow authenticated users to update ventas" ON ventas;
DROP POLICY IF EXISTS "Allow authenticated users to delete ventas" ON ventas;

DROP POLICY IF EXISTS "Allow authenticated users to view detalle_ventas" ON detalle_ventas;
DROP POLICY IF EXISTS "Allow authenticated users to insert detalle_ventas" ON detalle_ventas;
DROP POLICY IF EXISTS "Allow authenticated users to update detalle_ventas" ON detalle_ventas;
DROP POLICY IF EXISTS "Allow authenticated users to delete detalle_ventas" ON detalle_ventas;

DROP POLICY IF EXISTS "Allow authenticated users to view categorias_productos" ON categorias_productos;
DROP POLICY IF EXISTS "Allow authenticated users to insert categorias_productos" ON categorias_productos;
DROP POLICY IF EXISTS "Allow authenticated users to update categorias_productos" ON categorias_productos;
DROP POLICY IF EXISTS "Allow authenticated users to delete categorias_productos" ON categorias_productos;

DROP POLICY IF EXISTS "Allow authenticated users to view obras_sociales" ON obras_sociales;
DROP POLICY IF EXISTS "Allow authenticated users to insert obras_sociales" ON obras_sociales;
DROP POLICY IF EXISTS "Allow authenticated users to update obras_sociales" ON obras_sociales;
DROP POLICY IF EXISTS "Allow authenticated users to delete obras_sociales" ON obras_sociales;

DROP POLICY IF EXISTS "Allow authenticated users to view insumos" ON insumos;
DROP POLICY IF EXISTS "Allow authenticated users to insert insumos" ON insumos;
DROP POLICY IF EXISTS "Allow authenticated users to update insumos" ON insumos;
DROP POLICY IF EXISTS "Allow authenticated users to delete insumos" ON insumos;

-- Crear nuevas políticas que permitan acceso con clave anónima y service role
-- Políticas para ventas
CREATE POLICY "Allow anon and service access to ventas" ON ventas
    FOR ALL USING (
        auth.role() = 'anon' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Políticas para detalle_ventas
CREATE POLICY "Allow anon and service access to detalle_ventas" ON detalle_ventas
    FOR ALL USING (
        auth.role() = 'anon' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Políticas para categorias_productos
CREATE POLICY "Allow anon and service access to categorias_productos" ON categorias_productos
    FOR ALL USING (
        auth.role() = 'anon' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Políticas para obras_sociales
CREATE POLICY "Allow anon and service access to obras_sociales" ON obras_sociales
    FOR ALL USING (
        auth.role() = 'anon' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Políticas para insumos
CREATE POLICY "Allow anon and service access to insumos" ON insumos
    FOR ALL USING (
        auth.role() = 'anon' OR 
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'role' = 'service_role'
    );
