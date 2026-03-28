import { useState } from "react";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Task } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function Tasks() {
  const { activeTasks, completedTasks, addTask, updateTask, deleteTask, toggleComplete } = useTaskManager();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<Task, "id" | "createdAt" | "completed">) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
      setEditingTask(null);
    } else {
      addTask(data);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{activeTasks.length} active · {completedTasks.length} done</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <section className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activeTasks.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No active tasks. Add one!</p>
          )}
          {activeTasks.map((t) => (
            <TaskCard key={t.id} task={t} onToggle={toggleComplete} onEdit={handleEdit} onDelete={deleteTask} />
          ))}
        </AnimatePresence>
      </section>

      {completedTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed</h2>
          <AnimatePresence mode="popLayout">
            {completedTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={toggleComplete} onEdit={handleEdit} onDelete={deleteTask} />
            ))}
          </AnimatePresence>
        </section>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        editTask={editingTask}
      />
    </div>
  );
}
