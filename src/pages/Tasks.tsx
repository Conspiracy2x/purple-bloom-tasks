import { useState } from "react";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Task, TASK_COLORS } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function Tasks() {
  const { activeTasks, completedTasks, addTask, updateTask, deleteTask, toggleComplete, reorderTasks } = useTaskManager();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  // Only show swatches that at least one task currently uses (plus "default" if any uncolored).
  const usedColors = Array.from(new Set(activeTasks.map((t) => t.color || "")));
  const availableSwatches = TASK_COLORS.filter((c) => usedColors.includes(c.value));
  const customColors = usedColors.filter(
    (v) => v && !TASK_COLORS.some((c) => c.value === v)
  );

  const filteredActive =
    colorFilter === null
      ? activeTasks
      : activeTasks.filter((t) => (t.color || "") === colorFilter);

  const activeDragTask = activeId ? filteredActive.find((t) => t.id === activeId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    // Reorder using the full active list so positions stay consistent even when filtered.
    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const overInFull = activeTasks.findIndex((t) => t.id === over.id);
    const newIndex = overInFull;
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    // Assign evenly spaced positions
    const updates = reordered.map((t, i) => ({ id: t.id, position: i }));
    reorderTasks(updates);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragCancel = () => setActiveId(null);

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

      {(availableSwatches.length > 1 || customColors.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setColorFilter(null)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium border transition-all",
              colorFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-accent"
            )}
          >
            All
          </button>
          {availableSwatches.map((c) => {
            const selected = colorFilter === c.value;
            const isDefault = c.value === "";
            return (
              <button
                key={c.name}
                type="button"
                aria-label={`Filter by ${c.name}`}
                title={c.name}
                onClick={() => setColorFilter(selected ? null : c.value)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                  selected ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border hover:scale-105",
                  isDefault && "bg-muted"
                )}
                style={!isDefault ? { background: c.value } : undefined}
              >
                {isDefault && <span className="text-[9px] font-semibold text-muted-foreground">—</span>}
              </button>
            );
          })}
          {customColors.map((v) => {
            const selected = colorFilter === v;
            return (
              <button
                key={v}
                type="button"
                aria-label={`Filter by ${v}`}
                title={v}
                onClick={() => setColorFilter(selected ? null : v)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                  selected ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border hover:scale-105"
                )}
                style={{ background: v }}
              />
            );
          })}
          {colorFilter !== null && (
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className="inline-flex items-center gap-1 h-7 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      <section className="space-y-3">
        {activeTasks.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No active tasks. Add one!</p>
        ) : filteredActive.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No tasks match this color.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={filteredActive.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredActive.map((t, i) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      index={i}
                      onToggle={toggleComplete}
                      onEdit={handleEdit}
                      onDelete={deleteTask}
                      sortable={colorFilter === null}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                duration: 240,
                easing: "cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              {activeDragTask ? (
                <div className="rotate-1 scale-[1.03] shadow-2xl ring-2 ring-primary/70 rounded-xl">
                  <TaskCard
                    task={activeDragTask}
                    index={filteredActive.findIndex((t) => t.id === activeDragTask.id)}
                    onToggle={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      {completedTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed</h2>
          <AnimatePresence mode="popLayout">
            {completedTasks.map((t, i) => (
              <TaskCard key={t.id} task={t} index={i} onToggle={toggleComplete} onEdit={handleEdit} onDelete={deleteTask} />
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
