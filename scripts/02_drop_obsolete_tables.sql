-- Drop obsolete tables that will be replaced by new structure
-- Drop old audit and status tables (we have backups)
DROP TABLE IF EXISTS turnos_audit CASCADE;
DROP TABLE IF EXISTS turnos_status_history CASCADE;

-- Note: We keep the main turnos table for now to migrate data
