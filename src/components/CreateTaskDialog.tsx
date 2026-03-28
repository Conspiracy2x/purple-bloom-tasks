import { useState } from "react";
import { Task, TaskCategory, TaskType } from "@/types/task";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, ClipboardList } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  editTask?: Task | null;
}

const categories: TaskCategory[] = ["Work", "Study", "Personal", "Other"];

export function CreateTaskDialog({ open, onClose, onSave, editTask }: Props) {
  const [step, setStep] = useState<"choose" | "form">(editTask ? "form" : "choose");
  const [taskType, setTaskType] = useState<TaskType>(editTask?.type ?? "normal");
  const [heading, setHeading] = useState(editTask?.heading ?? "");
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(editTask?.taskCategory ?? "Other");

  const reset = () => {
    setStep("choose");
    setTaskType("normal");
    setHeading("");
    setDescription("");
    setCategory("Other");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChoose = (type: TaskType) => {
    setTaskType(type);
    setStep("form");
  };

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSave({
      type: taskType,
      description: description.trim(),
      ...(taskType === "detailed" && { heading: heading.trim(), taskCategory: category }),
    });
    handleClose();
  };

  // Reset form when editTask changes
  if (editTask && step === "choose") {
    setStep("form");
    setTaskType(editTask.type);
    setHeading(editTask.heading ?? "");
    setDescription(editTask.description);
    setCategory(editTask.taskCategory ?? "Other");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create a Task</DialogTitle>
              <DialogDescription>Choose a task type to get started.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              <Button
                variant="outline"
                className="h-28 flex-col gap-2 hover:border-primary hover:bg-accent"
                onClick={() => handleChoose("normal")}
              >
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Normal Task</span>
                <span className="text-[11px] text-muted-foreground">Quick note</span>
              </Button>
              <Button
                variant="outline"
                className="h-28 flex-col gap-2 hover:border-primary hover:bg-accent"
                onClick={() => handleChoose("detailed")}
              >
                <ClipboardList className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Detailed Task</span>
                <span className="text-[11px] text-muted-foreground">Full details</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{editTask ? "Edit Task" : taskType === "detailed" ? "New Detailed Task" : "New Normal Task"}</DialogTitle>
              <DialogDescription>
                {taskType === "detailed" ? "Add a heading, description, and category." : "Add a quick description."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {taskType === "detailed" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="heading">Heading</Label>
                    <Input id="heading" placeholder="Task title..." value={heading} onChange={(e) => setHeading(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="What do you need to do?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              {!editTask && (
                <Button variant="ghost" onClick={() => { setStep("choose"); }}>Back</Button>
              )}
              <Button onClick={handleSubmit} disabled={!description.trim()}>
                {editTask ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
