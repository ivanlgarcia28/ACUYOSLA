-- Update permissions for assistant role to only see Dashboard, Pacientes, Turnos, and Ventas
UPDATE permisos_rol 
SET puede_ver = false 
WHERE rol = 'asistente' 
AND modulo IN ('tratamientos', 'productos', 'inventario', 'obras_sociales', 'reportes');

-- Ensure assistant can see the allowed modules
UPDATE permisos_rol 
SET puede_ver = true 
WHERE rol = 'asistente' 
AND modulo IN ('pacientes', 'turnos', 'ventas');

-- Insert missing permissions if they don't exist
INSERT INTO permisos_rol (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
VALUES 
  ('asistente', 'pacientes', true, true, true, false),
  ('asistente', 'turnos', true, true, true, false),
  ('asistente', 'ventas', true, true, true, false)
ON CONFLICT (rol, modulo) DO UPDATE SET
  puede_ver = EXCLUDED.puede_ver,
  puede_crear = EXCLUDED.puede_crear,
  puede_editar = EXCLUDED.puede_editar,
  puede_eliminar = EXCLUDED.puede_eliminar;
