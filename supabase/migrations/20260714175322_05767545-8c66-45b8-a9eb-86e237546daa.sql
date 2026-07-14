
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_description_length CHECK (char_length(description) BETWEEN 1 AND 2000),
  ADD CONSTRAINT tasks_heading_length CHECK (heading IS NULL OR char_length(heading) <= 200),
  ADD CONSTRAINT tasks_category_length CHECK (task_category IS NULL OR char_length(task_category) <= 50),
  ADD CONSTRAINT tasks_color_length CHECK (color IS NULL OR char_length(color) <= 32),
  ADD CONSTRAINT tasks_type_valid CHECK (type IN ('normal', 'detailed'));
