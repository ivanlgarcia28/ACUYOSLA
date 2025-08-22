-- Cleanup script to remove unused database tables
-- This script removes tables that are not being used in the application

-- Drop unused tables
DROP TABLE IF EXISTS turno_todos CASCADE;
DROP TABLE IF EXISTS tratamiento_tareas_template CASCADE;

-- Note: insumos table is kept as it's needed for surgical instrument inventory management
-- Note: All other tables are actively used in the application

-- Verify cleanup
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
