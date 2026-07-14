import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Task } from "@/types/task";
import { computeTaskStats, rowToTask, taskInputSchema } from "@/lib/tasks";

export function useTaskManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["tasks", user?.id];

  const { data: tasks = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToTask);
    },
    enabled: !!user,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "createdAt" | "completed">) => {
      const parsed = taskInputSchema.safeParse({
        type: task.type,
        heading: task.heading,
        description: task.description,
        taskCategory: task.taskCategory,
        color: task.color,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      // Place new tasks at the top (lowest position value)
      const minPos = tasks.reduce((m, t) => Math.min(m, t.position ?? 0), 0);
      const { error } = await supabase.from("tasks").insert({
        user_id: user!.id,
        type: parsed.data.type,
        heading: parsed.data.heading || null,
        description: parsed.data.description,
        task_category: parsed.data.taskCategory || null,
        color: parsed.data.color || null,
        position: minPos - 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Task, "id">> }) => {
      if (updates.description !== undefined) {
        const r = z.string().trim().min(1).max(2000).safeParse(updates.description);
        if (!r.success) throw new Error("Description must be 1-2000 characters.");
      }
      if (updates.heading !== undefined && updates.heading) {
        if (updates.heading.length > 200) throw new Error("Heading is too long.");
      }
      if (updates.taskCategory !== undefined && updates.taskCategory) {
        if (updates.taskCategory.length > 50) throw new Error("Category is too long.");
      }
      if (updates.type !== undefined && !["normal", "detailed"].includes(updates.type)) {
        throw new Error("Invalid task type.");
      }
      if (updates.color !== undefined && updates.color && updates.color.length > 32) {
        throw new Error("Invalid color.");
      }
      const payload: any = {};
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.heading !== undefined) payload.heading = updates.heading || null;
      if (updates.taskCategory !== undefined) payload.task_category = updates.taskCategory || null;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.color !== undefined) payload.color = updates.color || null;
      const { error } = await supabase.from("tasks").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      await Promise.all(
        updates.map((u) =>
          supabase.from("tasks").update({ position: u.position }).eq("id", u.id)
        )
      );
    },
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Task[]>(queryKey);
      if (prev) {
        const map = new Map(updates.map((u) => [u.id, u.position]));
        const next = prev
          .map((t) => (map.has(t.id) ? { ...t, position: map.get(t.id)! } : t))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        qc.setQueryData(queryKey, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: invalidate,
  });

  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt" | "completed">) => addTaskMutation.mutate(task),
    [addTaskMutation]
  );
  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, "id">>) => updateTaskMutation.mutate({ id, updates }),
    [updateTaskMutation]
  );
  const deleteTask = useCallback(
    (id: string) => deleteTaskMutation.mutate(id),
    [deleteTaskMutation]
  );
  const toggleComplete = useCallback(
    (id: string) => toggleCompleteMutation.mutate(id),
    [toggleCompleteMutation]
  );
  const reorderTasks = useCallback(
    (updates: { id: string; position: number }[]) => reorderTasksMutation.mutate(updates),
    [reorderTasksMutation]
  );

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const { completedToday, completedThisWeek, totalCompleted } = useMemo(
    () => computeTaskStats(completedTasks),
    [completedTasks],
  );

  return {
    tasks,
    activeTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    completedToday,
    completedThisWeek,
    totalCompleted,
  };
}
