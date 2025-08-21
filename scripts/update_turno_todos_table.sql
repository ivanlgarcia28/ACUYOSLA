-- Update turno_todos table to include comments field and improve the todo system
-- This allows doctors to create tasks and assistants to mark them complete/incomplete with comments

-- Add comments column to existing turno_todos table if it doesn't exist
ALTER TABLE turno_todos 
ADD COLUMN IF NOT EXISTS comentarios TEXT;

-- Add created_by column to track who created the task
ALTER TABLE turno_todos 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'Doctora';

-- Add updated_at column to track when tasks were last modified
ALTER TABLE turno_todos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_turno_todos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_turno_todos_timestamp_trigger ON turno_todos;
CREATE TRIGGER update_turno_todos_timestamp_trigger
    BEFORE UPDATE ON turno_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_turno_todos_timestamp();

-- Update existing records to have default values
UPDATE turno_todos 
SET comentarios = '', 
    created_by = 'Doctora',
    updated_at = CURRENT_TIMESTAMP
WHERE comentarios IS NULL;
