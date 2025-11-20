-- Add task_type column to client_project_tasks table
-- This enables categorizing tasks by type (Feature, Bug, Task, Improvement, Documentation, Research)

ALTER TABLE client_project_tasks 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'Task';

-- Add index for filtering by task type
CREATE INDEX IF NOT EXISTS idx_project_tasks_type ON client_project_tasks(task_type);

-- Update existing tasks to have a default type
UPDATE client_project_tasks 
SET task_type = 'Task' 
WHERE task_type IS NULL;

-- Comment explaining the types
COMMENT ON COLUMN client_project_tasks.task_type IS 'Task type: Feature, Bug, Task, Improvement, Documentation, Research';
