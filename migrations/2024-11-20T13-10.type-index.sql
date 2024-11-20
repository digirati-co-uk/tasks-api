--type-index (up)

-- Create index on type column
create index tasks_type_index
    on tasks (type);

-- Crete GIN index on context column
create index tasks_context_gin_index
    on tasks using GIN (context jsonb_ops);
