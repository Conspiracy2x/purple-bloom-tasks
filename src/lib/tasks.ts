import { z } from "zod";
import { Task } from "@/types/task";

export const taskInputSchema = z.object({
  type: z.enum(["normal", "detailed"]),
  heading: z.string().trim().max(200, "Heading is too long.").optional().nullable(),
  description: z
    .string()
    .trim()
    .min(1, "Description cannot be empty.")
    .max(2000, "Description is too long."),
  taskCategory: z.string().trim().max(50, "Category is too long.").optional().nullable(),
  color: z.string().trim().max(32, "Invalid color.").optional().nullable(),
});

/** Maps a raw Supabase `tasks` row to the app's `Task` shape. */
export function rowToTask(row: any): Task {
  return {
    id: row.id,
    type: row.type as Task["type"],
    heading: row.heading ?? undefined,
    description: row.description,
    taskCategory: row.task_category as Task["taskCategory"] | undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    completed: row.completed,
    color: row.color ?? null,
    position: typeof row.position === "number" ? row.position : 0,
  };
}

/** Counts of completed tasks bucketed by today / this week / all-time. */
export function computeTaskStats(
  completedTasks: Task[],
  now: Date = new Date(),
): { completedToday: number; completedThisWeek: number; totalCompleted: number } {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay(),
  ).toISOString();

  let completedToday = 0;
  let completedThisWeek = 0;
  for (const t of completedTasks) {
    if (!t.completedAt) continue;
    if (t.completedAt >= startOfDay) completedToday++;
    if (t.completedAt >= startOfWeek) completedThisWeek++;
  }
  return {
    completedToday,
    completedThisWeek,
    totalCompleted: completedTasks.length,
  };
}