import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`transition-all hover:shadow-md ${task.completed ? "opacity-60" : ""}`}>
        <CardContent className="flex items-start gap-3 p-4">
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
              <h3 className={`mt-1 font-semibold text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.heading}
              </h3>
            )}
            <p className={`mt-0.5 text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
              {task.description}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {format(new Date(task.createdAt), "MMM d, yyyy · h:mm a")}
              {task.completedAt && ` · Done ${format(new Date(task.completedAt), "MMM d · h:mm a")}`}
            </p>
          </div>

          {!task.completed && (
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(task)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
