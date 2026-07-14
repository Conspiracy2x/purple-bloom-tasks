export type TaskType = "normal" | "detailed";
export type TaskCategory = "Work" | "Study" | "Personal" | string;

export interface Task {
  id: string;
  type: TaskType;
  heading?: string;
  description: string;
  taskCategory?: TaskCategory;
  createdAt: string;
  completedAt?: string;
  completed: boolean;
  color?: string | null;
  position?: number;
}

export const TASK_COLORS: { name: string; value: string }[] = [
  { name: "Default", value: "" },
  { name: "Rose", value: "#fecaca" },
  { name: "Amber", value: "#fde68a" },
  { name: "Lime", value: "#d9f99d" },
  { name: "Teal", value: "#99f6e4" },
  { name: "Sky", value: "#bae6fd" },
  { name: "Violet", value: "#ddd6fe" },
  { name: "Pink", value: "#fbcfe8" },
];
