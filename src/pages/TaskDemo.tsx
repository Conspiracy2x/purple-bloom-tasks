import { TaskCard } from "@/components/TaskCard";
import { Task } from "@/types/task";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const sampleTasks: Task[] = [
  {
    id: "1",
    type: "normal",
    heading: "Review design direction",
    description: "Pick the final visual direction for the new landing page.",
    taskCategory: "Design",
    color: "",
    completed: false,
    createdAt: new Date().toISOString(),
    position: 0,
  },
  {
    id: "2",
    type: "detailed",
    heading: "Write migration script",
    description: "Add RLS grants for the new user_roles table.",
    taskCategory: "Backend",
    color: "#c4b5fd",
    completed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    position: 1,
  },
  {
    id: "3",
    type: "normal",
    heading: "Ship weekly update",
    description: "Publish the changelog and notify the team.",
    taskCategory: "Product",
    color: "",
    completed: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date().toISOString(),
    position: 2,
  },
];

export default function TaskDemo() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-3">
        <h1 className="font-display text-2xl font-semibold mb-4">TaskCard preview</h1>
        <DndContext>
          <SortableContext items={sampleTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {sampleTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                sortable={i < 2}
                onToggle={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
