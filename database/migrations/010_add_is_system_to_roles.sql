ALTER TABLE roles
ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE roles
SET is_system = TRUE
WHERE name = 'Owner';

-- 44. esta migrtion es para agregar la colum is_system a la tale roles 
-- y actualizar los registros ya existentes 