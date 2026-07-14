import { useState } from "react";
import { Task, TaskCategory, TaskType, TASK_COLORS } from "@/types/task";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const defaultCategories: TaskCategory[] = ["Work", "Study", "Personal"];

export function CreateTaskDialog({ open, onClose, onSave, editTask }: Props) {
  const [step, setStep] = useState<"choose" | "form">(editTask ? "form" : "choose");
  const [taskType, setTaskType] = useState<TaskType>(editTask?.type ?? "normal");
  const [heading, setHeading] = useState(editTask?.heading ?? "");
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(editTask?.taskCategory ?? "Work");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [color, setColor] = useState<string>(editTask?.color ?? "");

  const reset = () => {
    setStep("choose");
    setTaskType("normal");
    setHeading("");
    setDescription("");
    setCategory("Work");
    setIsCustomCategory(false);
    setCustomCategory("");
    setColor("");
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
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    onSave({
      type: taskType,
      description: description.trim(),
      color: color || null,
      ...(taskType === "detailed" && { heading: heading.trim(), taskCategory: finalCategory || "Work" }),
    });
    handleClose();
  };

  // Reset form when editTask changes
  if (editTask && step === "choose") {
    setStep("form");
    setTaskType(editTask.type);
    setHeading(editTask.heading ?? "");
    setDescription(editTask.description);
    setColor(editTask.color ?? "");
    const editCat = editTask.taskCategory ?? "Work";
    if (defaultCategories.includes(editCat)) {
      setCategory(editCat);
      setIsCustomCategory(false);
    } else {
      setIsCustomCategory(true);
      setCustomCategory(editCat);
    }
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
                    {isCustomCategory ? (
                      <div className="flex gap-2">
                        <Input
                          id="category"
                          placeholder="Enter custom category..."
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => { setIsCustomCategory(false); setCustomCategory(""); setCategory("Work"); }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Select value={category} onValueChange={(v) => {
                        if (v === "__custom__") {
                          setIsCustomCategory(true);
                        } else {
                          setCategory(v as TaskCategory);
                        }
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {defaultCategories.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">Custom...</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="What do you need to do?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TASK_COLORS.map((c) => {
                    const selected = color === c.value;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        aria-label={c.name}
                        title={c.name}
                        onClick={() => setColor(c.value)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                          selected ? "border-primary scale-110" : "border-border hover:scale-105"
                        )}
                        style={{ background: c.value || "transparent" }}
                      >
                        {selected && <Check className="h-4 w-4 text-foreground/70" />}
                      </button>
                    );
                  })}
                  <CustomColorPicker value={color} onChange={setColor} />
                </div>
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
