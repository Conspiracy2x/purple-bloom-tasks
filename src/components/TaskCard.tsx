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
        <div className="h-[92px] rounded-xl border-2 border-dashed border-primary/70 bg-primary/10 transition-colors" />
      ) : (
      <Card
        className={`transition-all hover:shadow-md ${task.completed ? "opacity-60" : ""}`}
        style={tint ? { backgroundColor: tint, borderColor: tint } : undefined}
      >
        <CardContent className="flex items-start gap-2 p-4">
          {sortable && (
            <button
              type="button"
              aria-label="Drag to reorder"
              className="mt-1 -ml-1 shrink-0 touch-none cursor-grab active:cursor-grabbing rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {typeof index === "number" && (
            <span
              className={cn(
                "mt-1 shrink-0 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                tint ? "bg-black/15 text-slate-900" : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
          )}
          <Button
            size="icon"
            variant={task.completed ? "default" : "outline"}
            className="mt-0.5 h-7 w-7 shrink-0 rounded-full"
            onClick={() => onToggle(task.id)}
          >
            {task.completed ? <Undo2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={task.type === "detailed" ? "default" : "secondary"} className="text-[10px]">
                {task.type === "detailed" ? "Detailed" : "Normal"}
              </Badge>
              {task.taskCategory && (
                <Badge variant="outline" className="text-[10px]">
                  {task.taskCategory}
                </Badge>
              )}
            </div>

            {task.heading && (
              <h3 className={`mt-1 font-semibold text-sm ${task.completed ? "line-through" : ""} ${tint ? "text-slate-900" : ""}`}>
                {task.heading}
              </h3>
            )}
            <p className={`mt-0.5 text-sm ${task.completed ? "line-through" : ""} ${tint ? "text-slate-800" : "text-foreground/80"}`}>
              {task.description}
            </p>
            <p className={`mt-1 text-[11px] ${tint ? "text-slate-700/80" : "text-muted-foreground"}`}>
              {format(new Date(task.createdAt), "MMM d, yyyy · h:mm a")}
              {task.completedAt && ` · Done ${format(new Date(task.completedAt), "MMM d · h:mm a")}`}
            </p>
          </div>

          {!task.completed && (
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className={`h-7 w-7 ${tint ? "text-slate-800 hover:bg-black/10" : ""}`} onClick={() => onEdit(task)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className={`h-7 w-7 ${tint ? "text-red-700 hover:bg-black/10" : "text-destructive"}`} onClick={() => onDelete(task.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </motion.div>
  );
}
