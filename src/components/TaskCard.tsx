import type { PointerEventHandler } from "react";
import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2, Undo2, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  index?: number;
  dragHandleProps?: {
    onPointerDown: PointerEventHandler<HTMLElement>;
  };
  isDragOverlay?: boolean;
  isDragPlaceholder?: boolean;
  dragPlaceholderHeight?: number;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  index,
  dragHandleProps,
  isDragOverlay = false,
  isDragPlaceholder = false,
  dragPlaceholderHeight,
}: TaskCardProps) {
  const tint = task.color || undefined;
  const canDrag = Boolean(dragHandleProps) && !task.completed;

  if (isDragPlaceholder) {
    return (
      <motion.div
        aria-hidden="true"
        layout
        className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/55 bg-primary/[0.06] ring-mint"
        style={{ height: dragPlaceholderHeight ?? 124 }}
        transition={{ duration: 0.18 }}
      >
        <div className="absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-primary/25" />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={!isDragOverlay}
      initial={isDragOverlay ? false : { opacity: 0, y: 12 }}
      animate={isDragOverlay ? undefined : { opacity: 1, y: 0 }}
      exit={isDragOverlay ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className={cn(isDragOverlay && "pointer-events-none")}
    >
        <Card
          className={cn(
            "relative overflow-hidden rounded-2xl border-border/60 glass shadow-card hover-lift group",
            canDrag && "pl-1 sm:pl-0",
            task.completed && "opacity-60",
            isDragOverlay && "shadow-glow ring-2 ring-primary/45 rotate-1 scale-[1.015]"
          )}
          style={tint ? { backgroundColor: tint, borderColor: "transparent" } : undefined}
        >
          {!tint && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "radial-gradient(500px 160px at 100% 50%, hsl(var(--primary) / 0.12), transparent 70%)",
              }}
            />
          )}

          {canDrag && (
            <button
              type="button"
              aria-label="Drag to reorder"
              className={cn(
                "absolute inset-y-0 left-0 z-10 flex w-7 sm:w-6 items-center justify-center",
                "touch-none select-none cursor-grab active:cursor-grabbing",
                "transition-colors opacity-60 hover:opacity-100",
                tint
                  ? "text-slate-800/70 hover:bg-black/5 active:bg-black/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10"
              )}
              style={{ touchAction: "none" }}
              draggable={false}
              data-drag-handle="true"
              onPointerDown={dragHandleProps.onPointerDown}
              onClick={(event) => event.preventDefault()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <CardContent
            className={cn(
              "relative flex items-stretch gap-0 p-0 touch-none select-none cursor-grab active:cursor-grabbing",
              canDrag && "pl-7 sm:pl-6"
            )}
            onPointerDown={canDrag ? dragHandleProps.onPointerDown : undefined}
          >
            {/* Left rail: large editorial numeral */}
            {typeof index === "number" && (
              <div
                className={cn(
                  "shrink-0 flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-5",
                  "border-r border-dashed",
                  tint ? "border-slate-900/15" : "border-border/70"
                )}
              >
                <span
                  className={cn(
                    "font-display font-bold leading-none tabular tracking-tight",
                    "text-[34px] sm:text-[42px]",
                    tint ? "text-slate-900/90" : "text-mint-gradient"
                  )}
                  style={{ fontFeatureSettings: '"tnum", "lnum"' }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
                    tint ? "text-slate-800/60" : "text-muted-foreground/70"
                  )}
                >
                  {task.type === "detailed" ? "Detail" : "Task"}
                </span>
              </div>
            )}

            {/* Main content column */}
            <div className="min-w-0 flex-1 flex flex-col justify-center py-4 sm:py-5 px-4 sm:px-5">
              {/* Category chip + timestamp meta line */}
              <div className="flex items-center gap-2 text-[11px] tabular">
                {task.taskCategory ? (
                  <span
                    className={cn(
                      "font-semibold uppercase tracking-[0.14em] text-[10px]",
                      tint ? "text-slate-900" : "text-primary"
                    )}
                  >
                    {task.taskCategory}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "font-semibold uppercase tracking-[0.14em] text-[10px]",
                      tint ? "text-slate-900/70" : "text-muted-foreground"
                    )}
                  >
                    {task.type === "detailed" ? "Detailed" : "Quick"}
                  </span>
                )}
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    tint ? "bg-slate-900/15" : "bg-border/60"
                  )}
                />
                <span
                  className={cn(
                    "shrink-0",
                    tint ? "text-slate-800/70" : "text-muted-foreground/80"
                  )}
                >
                  {format(new Date(task.createdAt), "MMM d · h:mm a")}
                </span>
              </div>

              {task.heading && (
                <h3
                  className={cn(
                    "font-display mt-2 font-semibold text-[16px] sm:text-[17px] leading-snug tracking-tight break-words",
                    task.completed && "line-through",
                    tint ? "text-slate-900" : "text-foreground"
                  )}
                >
                  {task.heading}
                </h3>
              )}
              <p
                className={cn(
                  "mt-1 text-[13.5px] leading-relaxed break-words",
                  task.completed && "line-through",
                  tint ? "text-slate-800/90" : "text-foreground/75"
                )}
              >
                {task.description}
              </p>
              {task.completedAt && (
                <p
                  className={cn(
                    "mt-2 text-[10px] font-medium uppercase tracking-[0.14em]",
                    tint ? "text-slate-800/60" : "text-primary/80"
                  )}
                >
                  ✓ Done {format(new Date(task.completedAt), "MMM d")}
                </p>
              )}
            </div>

            {/* Right rail: perforated divider + punch button + actions */}
            <div
              className={cn(
                "shrink-0 flex flex-col items-center justify-center gap-2 pr-3 sm:pr-4 pl-2 py-4 sm:py-5",
                "border-l border-dashed relative",
                tint ? "border-slate-900/15" : "border-border/70"
              )}
            >
              {/* Perforation notches (top/bottom half-circles cut into the divider) */}
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[7px] top-0 h-3.5 w-3.5 rounded-full -translate-y-1/2",
                  tint ? "bg-background" : "bg-background"
                )}
                style={tint ? { backgroundColor: "hsl(var(--background))" } : undefined}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[7px] bottom-0 h-3.5 w-3.5 rounded-full translate-y-1/2",
                )}
                style={{ backgroundColor: "hsl(var(--background))" }}
              />

              <button
                type="button"
                aria-label={task.completed ? "Mark active" : "Mark complete"}
                onClick={() => onToggle(task.id)}
                data-no-drag="true"
                className={cn(
                  "relative h-11 w-11 sm:h-12 sm:w-12 rounded-full grid place-items-center transition-all duration-300 active:scale-95",
                  task.completed
                    ? "bg-mint-gradient text-primary-foreground shadow-glow"
                    : tint
                      ? "bg-white/50 ring-2 ring-inset ring-slate-900/25 hover:ring-slate-900/70 hover:bg-white/70 text-slate-900"
                      : "bg-background/40 ring-2 ring-inset ring-primary/25 hover:ring-primary hover:bg-primary/10 text-primary hover:shadow-glow"
                )}
              >
                {task.completed ? (
                  <Undo2 className="h-4 w-4" />
                ) : (
                  <Check
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                    )}
                  />
                )}
              </button>

              {!task.completed && (
                <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7 rounded-md",
                      tint ? "text-slate-800 hover:bg-black/10" : "hover:bg-primary/10 hover:text-primary"
                    )}
                    data-no-drag="true"
                    onClick={() => onEdit(task)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7 rounded-md",
                      tint ? "text-red-800 hover:bg-black/10" : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                    )}
                    data-no-drag="true"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </motion.div>
  );
}
