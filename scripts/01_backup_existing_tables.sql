-- Create backup of existing tables before migration
-- Backup existing turnos table
CREATE TABLE turnos_backup AS SELECT * FROM turnos;

-- Backup existing audit tables
CREATE TABLE turnos_audit_backup AS SELECT * FROM turnos_audit;
CREATE TABLE turnos_status_history_backup AS SELECT * FROM turnos_status_history;

-- Add comment for reference
COMMENT ON TABLE turnos_backup IS 'Backup of original turnos table before redesign migration';
COMMENT ON TABLE turnos_audit_backup IS 'Backup of original turnos_audit table before redesign migration';
COMMENT ON TABLE turnos_status_history_backup IS 'Backup of original turnos_status_history table before redesign migration';
