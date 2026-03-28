export type TaskType = "normal" | "detailed";
export type TaskCategory = "Work" | "Study" | "Personal" | "Other";

export interface Task {
  id: string;
  type: TaskType;
  heading?: string;
  description: string;
  taskCategory?: TaskCategory;
  createdAt: string;
  completedAt?: string;
  completed: boolean;
}
