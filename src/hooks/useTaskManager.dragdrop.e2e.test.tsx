import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getReorderedIdsForDrag } from "@/lib/dragReorder";

// ---- In-memory storage double ------------------------------------------

type Row = {
  id: string; user_id: string; type: string; heading: string | null;
  description: string; task_category: string | null;
  completed: boolean; completed_at: string | null;
  created_at: string; color: string | null; position: number;
};

const store = new Map<string, Row>();
const writes: Array<{ id: string; position: number }> = [];

function seed(rows: Row[]) {
  store.clear();
  writes.length = 0;
  for (const r of rows) store.set(r.id, { ...r });
}

function makeBuilder() {
  const filters: Array<(r: Row) => boolean> = [];
  let orderBy: { col: keyof Row; asc: boolean } | null = null;
  let mode: "select" | "update" | null = null;
  let payload: Partial<Row> | null = null;
  const run = () => {
    const rows = Array.from(store.values()).filter((r) => filters.every((f) => f(r)));
    if (mode === "select") {
      const out = [...rows];
      if (orderBy) {
        const col = orderBy.col;
        out.sort((a, b) => ((a[col] as number) - (b[col] as number)) * (orderBy!.asc ? 1 : -1));
      }
      return { data: out, error: null };
    }
    if (mode === "update" && payload) {
      rows.forEach((r) => {
        if (typeof payload!.position === "number") {
          writes.push({ id: r.id, position: payload!.position });
        }
        Object.assign(r, payload);
      });
      return { data: rows, error: null };
    }
    return { data: null, error: null };
  };
  const b: any = {
    select() { mode = "select"; return b; },
    order(col: keyof Row, opts?: { ascending?: boolean }) {
      orderBy = { col, asc: opts?.ascending !== false }; return b;
    },
    update(p: Partial<Row>) { mode = "update"; payload = p; return b; },
    eq(col: keyof Row, val: unknown) { filters.push((r) => (r as any)[col] === val); return b; },
    then(resolve: (v: any) => void) { resolve(run()); },
  };
  return b;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => makeBuilder() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

import { useTaskManager } from "./useTaskManager";

function makeRow(id: string, position: number): Row {
  return {
    id, user_id: "u1", type: "normal",
    heading: id.toUpperCase(), description: `desc ${id}`,
    task_category: null, completed: false, completed_at: null,
    created_at: new Date(Date.now() - position * 1000).toISOString(),
    color: null, position,
  };
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function persistedActiveOrder(): string[] {
  return Array.from(store.values())
    .filter((r) => !r.completed)
    .sort((a, b) => a.position - b.position)
    .map((r) => r.id);
}

// Bounds representing a rendered vertical list: id -> {top,height}.
function stackedBounds(ids: string[], height = 100, gap = 20) {
  return ids.map((id, i) => ({ id, top: i * (height + gap), height }));
}

describe("drag reorder end-to-end (hook + storage)", () => {
  beforeEach(() => {
    seed([makeRow("a", 0), makeRow("b", 1), makeRow("c", 2), makeRow("d", 3)]);
  });
  afterEach(() => { store.clear(); writes.length = 0; });

  it("simulates dragging item A between B and C and persists new positions", async () => {
    const { result } = renderHook(() => useTaskManager(), { wrapper: wrapper() });

    await waitFor(() => {
      expect(result.current.activeTasks.map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
    });

    // Simulate the drag interaction: user picks A and drops it where its
    // centroid crosses B's midpoint but stays above C's. The same helper
    // the UI uses computes the visual order.
    const initialOrder = result.current.activeTasks.map((t) => t.id);
    const bounds = stackedBounds(initialOrder);
    // B midpoint = 170, C midpoint = 290 -> pick draggedCenter = 260.
    const newOrder = getReorderedIdsForDrag(initialOrder, "a", 260, bounds);
    expect(newOrder).toEqual(["b", "a", "c", "d"]);

    // Commit like the page does on mouseup.
    await act(async () => {
      result.current.reorderTasks(newOrder.map((id, position) => ({ id, position })));
    });

    await waitFor(() => {
      expect(persistedActiveOrder()).toEqual(["b", "a", "c", "d"]);
    });

    // Every affected row was written exactly once with a monotonically
    // increasing position matching its new index.
    const byId = new Map(writes.map((w) => [w.id, w.position]));
    expect([...byId.keys()].sort()).toEqual(["a", "b", "c", "d"]);
    const positions = newOrder.map((id) => byId.get(id)!);
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }

    // Cache reflects the new ordering for subsequent renders.
    await waitFor(() => {
      expect(result.current.activeTasks.map((t) => t.id)).toEqual(["b", "a", "c", "d"]);
    });
  });

  it("moves D to the top when dragged above the first midpoint", async () => {
    const { result } = renderHook(() => useTaskManager(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.activeTasks).toHaveLength(4));

    const initialOrder = result.current.activeTasks.map((t) => t.id);
    const bounds = stackedBounds(initialOrder);
    // Above A midpoint (50): draggedCenter = 20.
    const newOrder = getReorderedIdsForDrag(initialOrder, "d", 20, bounds);
    expect(newOrder).toEqual(["d", "a", "b", "c"]);

    await act(async () => {
      result.current.reorderTasks(newOrder.map((id, position) => ({ id, position })));
    });

    await waitFor(() => {
      expect(persistedActiveOrder()).toEqual(["d", "a", "b", "c"]);
    });
  });

  it("does not write to storage when the computed order is unchanged", async () => {
    const { result } = renderHook(() => useTaskManager(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.activeTasks).toHaveLength(4));

    const initialOrder = result.current.activeTasks.map((t) => t.id);
    const bounds = stackedBounds(initialOrder);
    // Tiny nudge that doesn't cross any midpoint.
    const newOrder = getReorderedIdsForDrag(initialOrder, "a", 40, bounds);
    expect(newOrder).toEqual(initialOrder);

    // The page guards reorderTasks behind a sameOrder check; emulate that here.
    if (newOrder.join() !== initialOrder.join()) {
      await act(async () => {
        result.current.reorderTasks(newOrder.map((id, position) => ({ id, position })));
      });
    }

    expect(writes).toHaveLength(0);
    expect(persistedActiveOrder()).toEqual(["a", "b", "c", "d"]);
  });
});