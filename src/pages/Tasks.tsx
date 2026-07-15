import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { animateCount } from "@/lib/motion";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Task, TASK_COLORS } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Filter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReorderedIdsForDrag, sameOrder } from "@/lib/dragReorder";
import { AnimatePresence } from "framer-motion";

type DragSnapshot = {
  id: string;
  pointerId: number;
  pointerY: number;
  offsetY: number;
  width: number;
  height: number;
  left: number;
};

type DragSurfaceStyles = {
  bodyCursor: string;
  bodyUserSelect: string;
  bodyTouchAction: string;
  rootOverscrollBehaviorY: string;
};

export default function Tasks() {
  const { activeTasks, completedTasks, addTask, updateTask, deleteTask, toggleComplete, reorderTasks } = useTaskManager();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [dragSnapshot, setDragSnapshot] = useState<DragSnapshot | null>(null);
  const activeCountRef = useRef<HTMLSpanElement>(null);
  const doneCountRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const visualOrderRef = useRef<string[]>([]);
  const filteredActiveIdsRef = useRef<string[]>([]);
  const activeTasksRef = useRef<Task[]>([]);
  const dragSnapshotRef = useRef<DragSnapshot | null>(null);
  const dragSurfaceStylesRef = useRef<DragSurfaceStyles | null>(null);

  // GSAP: animated stat counters
  useEffect(() => {
    const cleanups = [
      animateCount(activeCountRef.current, activeTasks.length),
      animateCount(doneCountRef.current, completedTasks.length),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, [activeTasks.length, completedTasks.length]);

  // Only show swatches that at least one task currently uses (plus "default" if any uncolored).
  const usedColors = Array.from(new Set(activeTasks.map((t) => t.color || "")));
  const availableSwatches = TASK_COLORS.filter((c) => usedColors.includes(c.value));
  const customColors = usedColors.filter(
    (v) => v && !TASK_COLORS.some((c) => c.value === v)
  );

  const filteredActive = useMemo(
    () =>
      colorFilter === null
        ? activeTasks
        : activeTasks.filter((t) => (t.color || "") === colorFilter),
    [activeTasks, colorFilter]
  );

  const filteredActiveIds = useMemo(() => filteredActive.map((task) => task.id), [filteredActive]);

  const filteredTaskById = useMemo(
    () => new Map(filteredActive.map((task) => [task.id, task])),
    [filteredActive]
  );

  const visibleTasks = useMemo(() => {
    const ids = orderedIds.length > 0 ? orderedIds : filteredActiveIds;
    return ids
      .map((id) => filteredTaskById.get(id))
      .filter((task): task is Task => Boolean(task));
  }, [filteredActiveIds, filteredTaskById, orderedIds]);

  const activeId = dragSnapshot?.id ?? null;
  const activeDragTask = activeId ? filteredTaskById.get(activeId) ?? null : null;
  const canReorder = colorFilter === null && filteredActive.length > 1;

  useEffect(() => {
    activeTasksRef.current = activeTasks;
  }, [activeTasks]);

  useEffect(() => {
    filteredActiveIdsRef.current = filteredActiveIds;
    if (!dragSnapshot) {
      visualOrderRef.current = filteredActiveIds;
      setOrderedIds(filteredActiveIds);
    }
  }, [dragSnapshot, filteredActiveIds]);

  useEffect(() => {
    visualOrderRef.current = orderedIds;
  }, [orderedIds]);

  useEffect(() => {
    dragSnapshotRef.current = dragSnapshot;
  }, [dragSnapshot]);

  const restoreDragSurface = useCallback(() => {
    if (typeof document === "undefined" || !dragSurfaceStylesRef.current) return;

    document.body.style.cursor = dragSurfaceStylesRef.current.bodyCursor;
    document.body.style.userSelect = dragSurfaceStylesRef.current.bodyUserSelect;
    document.body.style.touchAction = dragSurfaceStylesRef.current.bodyTouchAction;
    document.documentElement.style.overscrollBehaviorY = dragSurfaceStylesRef.current.rootOverscrollBehaviorY;
    dragSurfaceStylesRef.current = null;
  }, []);

  const applyDragSurface = useCallback(() => {
    if (typeof document === "undefined" || dragSurfaceStylesRef.current) return;

    dragSurfaceStylesRef.current = {
      bodyCursor: document.body.style.cursor,
      bodyUserSelect: document.body.style.userSelect,
      bodyTouchAction: document.body.style.touchAction,
      rootOverscrollBehaviorY: document.documentElement.style.overscrollBehaviorY,
    };
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    document.body.style.touchAction = "none";
    document.documentElement.style.overscrollBehaviorY = "contain";
  }, []);

  const reorderPreviewForPointer = useCallback((clientY: number) => {
    const snapshot = dragSnapshotRef.current;
    if (!snapshot) return;

    const currentOrder = visualOrderRef.current.length > 0
      ? visualOrderRef.current
      : filteredActiveIdsRef.current;
    if (currentOrder.length < 2) return;

    const draggedCenter = clientY - snapshot.offsetY + snapshot.height / 2;
    const itemBounds = currentOrder.flatMap((id) => {
      if (id === snapshot.id) return [];
      const item = itemRefs.current.get(id);
      if (!item) return [];

      const rect = item.getBoundingClientRect();
      return [{ id, top: rect.top, height: rect.height }];
    });
    const nextOrder = getReorderedIdsForDrag(currentOrder, snapshot.id, draggedCenter, itemBounds);

    if (!sameOrder(currentOrder, nextOrder)) {
      visualOrderRef.current = nextOrder;
      setOrderedIds(nextOrder);
    }
  }, []);

  const finishDrag = useCallback((commit: boolean) => {
    const snapshot = dragSnapshotRef.current;
    if (!snapshot) return;

    const finalOrder = visualOrderRef.current;
    const currentActiveOrder = activeTasksRef.current.map((task) => task.id);

    if (commit && finalOrder.length === currentActiveOrder.length && !sameOrder(finalOrder, currentActiveOrder)) {
      reorderTasks(finalOrder.map((id, position) => ({ id, position })));
    }

    setDragSnapshot(null);
    dragSnapshotRef.current = null;
    restoreDragSurface();
  }, [reorderTasks, restoreDragSurface]);

  useEffect(() => {
    if (!dragSnapshot) return;

    const pointerId = dragSnapshot.pointerId;
    let animationFrame = 0;
    let latestClientY = dragSnapshot.pointerY;

    const updateDrag = () => {
      animationFrame = 0;
      setDragSnapshot((current) => current ? { ...current, pointerY: latestClientY } : current);
      reorderPreviewForPointer(latestClientY);

      const edge = 96;
      const maxStep = 18;
      if (latestClientY < edge) {
        window.scrollBy({ top: -Math.ceil(((edge - latestClientY) / edge) * maxStep), behavior: "instant" });
        reorderPreviewForPointer(latestClientY);
      } else if (latestClientY > window.innerHeight - edge) {
        window.scrollBy({ top: Math.ceil(((latestClientY - (window.innerHeight - edge)) / edge) * maxStep), behavior: "instant" });
        reorderPreviewForPointer(latestClientY);
      }
    };

    const requestDragUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateDrag);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      latestClientY = event.clientY;
      requestDragUpdate();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      finishDrag(true);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      finishDrag(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishDrag(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragSnapshot, finishDrag, reorderPreviewForPointer]);

  useEffect(() => restoreDragSurface, [restoreDragSurface]);

  const registerTaskItem = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  };

  const startDrag = (taskId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canReorder || (event.pointerType === "mouse" && event.button !== 0)) return;

    const item = itemRefs.current.get(taskId);
    if (!item) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const rect = item.getBoundingClientRect();
    const snapshot: DragSnapshot = {
      id: taskId,
      pointerId: event.pointerId,
      pointerY: event.clientY,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      left: rect.left,
    };

    filteredActiveIdsRef.current = filteredActiveIds;
    visualOrderRef.current = filteredActiveIds;
    setOrderedIds(filteredActiveIds);
    applyDragSurface();
    setDragSnapshot(snapshot);
    dragSnapshotRef.current = snapshot;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(10);
    }
  };

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
              className="hidden sm:inline-flex h-11 gap-2 rounded-xl bg-mint-gradient text-primary-foreground border-0 shadow-glow hover:opacity-95 hover:scale-[1.02] transition-all"
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
          <>
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {visibleTasks.map((task, index) => {
                  const isActive = task.id === activeId;
                  return (
                    <div
                      key={task.id}
                      ref={registerTaskItem(task.id)}
                      className={cn(
                        "touch-pan-y",
                        isActive && "pointer-events-none"
                      )}
                    >
                      <TaskCard
                        task={task}
                        index={index}
                        onToggle={toggleComplete}
                        onEdit={handleEdit}
                        onDelete={deleteTask}
                        dragHandleProps={
                          canReorder
                            ? { onPointerDown: (event) => startDrag(task.id, event) }
                            : undefined
                        }
                        isDragPlaceholder={isActive}
                        dragPlaceholderHeight={dragSnapshot?.height}
                      />
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>

            {dragSnapshot && activeDragTask && createPortal(
              <div
                className="fixed z-[90] pointer-events-none"
                style={{
                  top: dragSnapshot.pointerY - dragSnapshot.offsetY,
                  left: dragSnapshot.left,
                  width: dragSnapshot.width,
                }}
              >
                <TaskCard
                  task={activeDragTask}
                  index={visibleTasks.findIndex((task) => task.id === activeDragTask.id)}
                  onToggle={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragOverlay
                />
              </div>,
              document.body
            )}
          </>
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

      {/* Floating action button — portaled to body so ancestor transforms
          (from the sidebar wrapper) don't trap `position: fixed`. */}
      {createPortal(
        <button
          type="button"
          aria-label="Create new task"
          onClick={() => { setEditingTask(null); setDialogOpen(true); }}
          className={cn(
            "sm:hidden fixed right-5 z-50",
            "h-14 w-14 rounded-full bg-mint-gradient text-primary-foreground",
            "grid place-items-center shadow-glow ring-1 ring-primary/40",
            "transform-gpu will-change-transform",
            "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            "hover:scale-105 hover:shadow-[0_24px_60px_-16px_hsl(var(--primary)/0.45)]",
            "active:scale-90 active:shadow-glow"
          )}
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>,
        document.body
      )}
    </div>
  );
}
