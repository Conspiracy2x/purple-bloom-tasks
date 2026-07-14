import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Task, TASK_COLORS } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Filter, Sparkles } from "lucide-react";
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
  const activeCountRef = useRef<HTMLSpanElement>(null);
  const doneCountRef = useRef<HTMLSpanElement>(null);

  // GSAP: animated stat counters
  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = [
        { el: activeCountRef.current, val: activeTasks.length },
        { el: doneCountRef.current, val: completedTasks.length },
      ];
      targets.forEach(({ el, val }) => {
        if (!el) return;
        const obj = { n: Number(el.textContent) || 0 };
        gsap.to(obj, {
          n: val,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: () => {
            if (el) el.textContent = String(Math.round(obj.n));
          },
        });
      });
    });
    return () => ctx.revert();
  }, [activeTasks.length, completedTasks.length]);

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
    <div className="mx-auto max-w-3xl space-y-6 md:space-y-8 p-4 md:p-8 animate-fade-in">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl glass shadow-card p-5 sm:p-7">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-primary-glow/10 blur-3xl"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3 w-3" />
              Today
            </div>
            <h1 className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Your <span className="text-mint-gradient">focus</span> board.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Drag to reorder. Tint by color. Small wins compound.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5">
              <div className="text-center">
                <span
                  ref={activeCountRef}
                  className="block tabular text-2xl font-semibold text-primary leading-none"
                >
                  0
                </span>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">Active</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <span
                  ref={doneCountRef}
                  className="block tabular text-2xl font-semibold leading-none"
                >
                  0
                </span>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">Done</p>
              </div>
            </div>

            <Button
              onClick={() => { setEditingTask(null); setDialogOpen(true); }}
              className="h-11 gap-2 rounded-xl bg-mint-gradient text-primary-foreground border-0 shadow-glow hover:opacity-95 hover:scale-[1.02] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">New task</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Color filter chips */}
      {(availableSwatches.length > 1 || customColors.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground mr-1">
            <Filter className="h-3 w-3" /> Filter
          </span>
          <button
            type="button"
            onClick={() => setColorFilter(null)}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-semibold border transition-all",
              colorFilter === null
                ? "bg-mint-gradient text-primary-foreground border-transparent shadow-glow"
                : "bg-background/60 border-border hover:border-primary/40 hover:bg-primary/5"
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
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                  selected
                    ? "border-primary scale-110 ring-4 ring-primary/25"
                    : "border-border/70 hover:scale-105 hover:border-primary/40",
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
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                  selected ? "border-primary scale-110 ring-4 ring-primary/25" : "border-border/70 hover:scale-105 hover:border-primary/40"
                )}
                style={{ background: v }}
              />
            );
          })}
          {colorFilter !== null && (
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className="inline-flex items-center gap-1 h-8 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      <section className="space-y-3">
        {activeTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-mint-gradient grid place-items-center shadow-glow mb-4">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold">Nothing on deck.</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first task and start moving.</p>
          </div>
        ) : filteredActive.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No tasks match this color.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={filteredActive.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
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
                <div className="rotate-1 scale-[1.03] shadow-glow ring-2 ring-primary/60 rounded-2xl">
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
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Recently completed
            </h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {completedTasks.slice(0, 5).map((t, i) => (
                <TaskCard key={t.id} task={t} index={i} onToggle={toggleComplete} onEdit={handleEdit} onDelete={deleteTask} />
              ))}
            </AnimatePresence>
          </div>
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
