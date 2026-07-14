import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Task } from "@/types/task";

function rowToTask(row: any): Task {
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
      // Place new tasks at the top (lowest position value)
      const minPos = tasks.reduce((m, t) => Math.min(m, t.position ?? 0), 0);
      const { error } = await supabase.from("tasks").insert({
        user_id: user!.id,
        type: task.type,
        heading: task.heading || null,
        description: task.description,
        task_category: task.taskCategory || null,
        color: task.color || null,
        position: minPos - 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Task, "id">> }) => {
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

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString();

  const completedToday = completedTasks.filter((t) => t.completedAt && t.completedAt >= startOfDay).length;
  const completedThisWeek = completedTasks.filter((t) => t.completedAt && t.completedAt >= startOfWeek).length;
  const totalCompleted = completedTasks.length;

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
