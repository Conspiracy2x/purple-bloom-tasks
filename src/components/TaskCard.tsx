import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, Trash2, Undo2, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  sortable?: boolean;
  index?: number;
}

export function TaskCard({ task, onToggle, onEdit, onDelete, sortable = false, index }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
      }
    : undefined;

  const tint = task.color || undefined;

  const placeholder = sortable && isDragging;

  return (
    <motion.div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {placeholder ? (
        <div className="h-[112px] rounded-2xl border-2 border-dashed border-primary/60 bg-primary/[0.06] ring-mint transition-colors" />
      ) : (
        <Card
          className={cn(
            "relative overflow-hidden rounded-2xl border-border/60 glass shadow-card hover-lift group",
            sortable && "pl-1 sm:pl-0",
            task.completed && "opacity-60"
          )}
          style={tint ? { backgroundColor: tint, borderColor: "transparent" } : undefined}
        >
          {/* Ambient mint glow on hover (non-tinted only) */}
          {!tint && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "radial-gradient(400px 120px at var(--x,50%) 0%, hsl(var(--primary) / 0.14), transparent 70%)",
              }}
            />
          )}

          {/* Full-height drag rail on mobile — a big, obvious target that
              never fights with page scroll. Collapses to a compact grip on ≥sm. */}
          {sortable && (
            <button
              type="button"
              aria-label="Drag to reorder"
              className={cn(
                "absolute inset-y-0 left-0 z-10 flex w-9 sm:w-7 items-center justify-center",
                "touch-none select-none cursor-grab active:cursor-grabbing",
                "transition-colors",
                tint
                  ? "text-slate-800/50 hover:text-slate-900 hover:bg-black/5 active:bg-black/10"
                  : "text-muted-foreground/50 hover:text-primary hover:bg-primary/5 active:bg-primary/10"
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          )}

          <CardContent
            className={cn(
              "relative flex items-start gap-3 p-4 sm:p-5",
              sortable && "pl-11 sm:pl-9"
            )}
          >

            {typeof index === "number" && (
              <div
                className={cn(
                  "mt-0.5 shrink-0 flex flex-col items-center justify-start pt-0.5 select-none",
                  tint ? "text-slate-900" : "text-foreground"
                )}
              >
                <span
                  className={cn(
                    "tabular text-[22px] leading-none font-semibold tracking-tight",
                    tint ? "text-slate-900" : "text-mint-gradient"
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 h-[2px] w-4 rounded-full",
                    tint ? "bg-slate-900/40" : "bg-mint-gradient opacity-70"
                  )}
                />
              </div>
            )}

            <button
              type="button"
              aria-label={task.completed ? "Mark active" : "Mark complete"}
              onClick={() => onToggle(task.id)}
              className={cn(
                "relative mt-0.5 h-9 w-9 sm:h-8 sm:w-8 shrink-0 rounded-full grid place-items-center transition-all duration-300",
                "before:absolute before:inset-0 before:rounded-full before:transition-opacity before:duration-300",
                task.completed
                  ? "bg-mint-gradient text-primary-foreground shadow-glow scale-100"
                  : tint
                    ? "bg-white/40 ring-1 ring-inset ring-slate-900/25 hover:ring-slate-900/60 hover:bg-white/60 active:scale-95"
                    : "bg-background/40 ring-1 ring-inset ring-border hover:ring-primary/70 hover:bg-primary/5 active:scale-95 before:opacity-0 hover:before:opacity-100 before:bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent_70%)]"
              )}
            >
              {task.completed ? (
                <Undo2 className="relative h-4 w-4 sm:h-3.5 sm:w-3.5" />
              ) : (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-[3px] rounded-full border border-dashed transition-all duration-500",
                      tint
                        ? "border-slate-900/25 group-hover:border-slate-900/50 group-hover:rotate-45"
                        : "border-primary/30 group-hover:border-primary/70 group-hover:rotate-45"
                    )}
                  />
                  <Check
                    className={cn(
                      "relative h-4 w-4 sm:h-3.5 sm:w-3.5 transition-all duration-200",
                      "opacity-50 sm:opacity-0 sm:group-hover:opacity-100 group-hover:scale-110",
                      tint ? "text-slate-900" : "text-primary"
                    )}
                  />
                </>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  className={cn(
                    "text-[10px] font-medium h-5 px-2 border-0",
                    tint
                      ? "bg-black/20 text-slate-900"
                      : task.type === "detailed"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {task.type === "detailed" ? "Detailed" : "Quick"}
                </Badge>
                {task.taskCategory && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium h-5 px-2",
                      tint ? "border-slate-900/30 text-slate-900" : "border-border/70 text-muted-foreground"
                    )}
                  >
                    {task.taskCategory}
                  </Badge>
                )}
              </div>

              {task.heading && (
                <h3
                  className={cn(
                    "font-display mt-1.5 font-semibold text-[15px] leading-snug tracking-tight break-words",
                    task.completed && "line-through",
                    tint ? "text-slate-900" : "text-foreground"
                  )}
                >
                  {task.heading}
                </h3>
              )}
              <p
                className={cn(
                  "mt-0.5 text-sm leading-relaxed break-words",
                  task.completed && "line-through",
                  tint ? "text-slate-800" : "text-foreground/80"
                )}
              >
                {task.description}
              </p>
              <p
                className={cn(
                  "mt-2 text-[11px] tabular",
                  tint ? "text-slate-700/70" : "text-muted-foreground/80"
                )}
              >
                {format(new Date(task.createdAt), "MMM d · h:mm a")}
                {task.completedAt && ` · Done ${format(new Date(task.completedAt), "MMM d")}`}
              </p>
            </div>

            {!task.completed && (
              <div className="flex flex-col sm:flex-row gap-0.5 shrink-0 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md",
                    tint ? "text-slate-800 hover:bg-black/10" : "hover:bg-primary/10 hover:text-primary"
                  )}
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md",
                    tint ? "text-red-800 hover:bg-black/10" : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                  )}
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
