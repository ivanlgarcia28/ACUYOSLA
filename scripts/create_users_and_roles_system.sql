-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('doctora', 'asistente')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos por rol
CREATE TABLE IF NOT EXISTS permisos_rol (
  id SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL,
  modulo VARCHAR(100) NOT NULL,
  puede_ver BOOLEAN DEFAULT false,
  puede_crear BOOLEAN DEFAULT false,
  puede_editar BOOLEAN DEFAULT false,
  puede_eliminar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar permisos para doctora (acceso completo)
INSERT INTO permisos_rol (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
('doctora', 'pacientes', true, true, true, true),
('doctora', 'turnos', true, true, true, true),
('doctora', 'tratamientos', true, true, true, true),
('doctora', 'productos', true, true, true, true),
('doctora', 'ventas', true, true, true, true),
('doctora', 'obras_sociales', true, true, true, true),
('doctora', 'inventario', true, true, true, true),
('doctora', 'reportes', true, false, false, false),
('doctora', 'archivos_pacientes', true, true, true, true);

-- Insertar permisos para asistente (acceso limitado)
INSERT INTO permisos_rol (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
('asistente', 'pacientes', true, true, true, false),
('asistente', 'turnos', true, true, true, false),
('asistente', 'tratamientos', true, false, false, false),
('asistente', 'productos', true, false, false, false),
('asistente', 'ventas', true, true, false, false),
('asistente', 'obras_sociales', true, false, false, false),
('asistente', 'inventario', false, false, false, false),
('asistente', 'reportes', false, false, false, false),
('asistente', 'archivos_pacientes', true, true, false, false);

-- Crear usuarios iniciales (debes cambiar las contraseñas)
-- Nota: Estos usuarios deben crearse también en Supabase Auth
INSERT INTO usuarios_sistema (email, nombre_completo, rol) VALUES
('doctora@eleodontologia.com', 'Dra. Elena Rodriguez', 'doctora'),
('asistente@eleodontologia.com', 'María González', 'asistente');

-- Habilitar RLS en las nuevas tablas
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_rol ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios_sistema
CREATE POLICY "Usuarios pueden ver su propia información" ON usuarios_sistema
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Solo service role puede gestionar usuarios" ON usuarios_sistema
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para permisos_rol
CREATE POLICY "Todos pueden ver permisos" ON permisos_rol
  FOR SELECT USING (true);

CREATE POLICY "Solo service role puede gestionar permisos" ON permisos_rol
  FOR ALL USING (auth.role() = 'service_role');
