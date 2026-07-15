import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---- Mocks ---------------------------------------------------------------

type Row = {
  id: string;
  user_id: string;
  type: string;
  heading: string | null;
  description: string;
  task_category: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  color: string | null;
  position: number;
};

const store = new Map<string, Row>();
const updateCalls: Array<{ id: string; payload: Partial<Row> }> = [];

function seed(rows: Row[]) {
  store.clear();
  updateCalls.length = 0;
  for (const r of rows) store.set(r.id, { ...r });
}

function makeBuilder(table: string) {
  const filters: Array<(r: Row) => boolean> = [];
  let orderBy: { col: keyof Row; asc: boolean } | null = null;
  let mode: "select" | "update" | "insert" | "delete" | null = null;
  let updatePayload: Partial<Row> | null = null;

  const run = () => {
    if (table !== "tasks") return { data: [], error: null };
    const rows = Array.from(store.values()).filter((r) => filters.every((f) => f(r)));
    if (mode === "select") {
      const out = [...rows];
      if (orderBy) {
        const col = orderBy.col;
        out.sort((a, b) => (((a[col] as number) - (b[col] as number)) * (orderBy!.asc ? 1 : -1)));
      }
      return { data: out, error: null };
    }
    if (mode === "update" && updatePayload) {
      rows.forEach((r) => {
        updateCalls.push({ id: r.id, payload: { ...updatePayload! } });
        Object.assign(r, updatePayload);
      });
      return { data: rows, error: null };
    }
    if (mode === "delete") {
      rows.forEach((r) => store.delete(r.id));
      return { data: rows, error: null };
    }
    return { data: null, error: null };
  };

  const builder: any = {
    select(_cols?: string) { mode = "select"; return builder; },
    order(col: keyof Row, opts?: { ascending?: boolean }) {
      orderBy = { col, asc: opts?.ascending !== false };
      return builder;
    },
    update(payload: Partial<Row>) { mode = "update"; updatePayload = payload; return builder; },
    insert(payload: Partial<Row> | Partial<Row>[]) {
      mode = "insert";
      const list = Array.isArray(payload) ? payload : [payload];
      list.forEach((p, i) => {
        const id = (p as any).id ?? `new-${store.size + i}`;
        store.set(id, {
          id, user_id: p.user_id ?? "u1", type: p.type ?? "normal",
          heading: p.heading ?? null, description: p.description ?? "",
          task_category: p.task_category ?? null,
          completed: false, completed_at: null,
          created_at: new Date().toISOString(),
          color: p.color ?? null, position: p.position ?? 0,
        });
      });
      return Promise.resolve({ data: null, error: null });
    },
    delete() { mode = "delete"; return builder; },
    eq(col: keyof Row, val: unknown) {
      filters.push((r) => (r as any)[col] === val);
      return builder;
    },
    then(resolve: (v: any) => void, reject?: (e: any) => void) {
      try { resolve(run()); } catch (e) { reject?.(e); }
    },
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => ({ error: null }),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1" },
    session: { user: { id: "u1" } },
    loading: false,
    signOut: async () => {},
  }),
}));

// GSAP's ticker keeps the event loop alive; stub the counter helper.
vi.mock("@/lib/motion", () => ({
  animateCount: () => () => {},
}));

// framer-motion's AnimatePresence + layout can be flaky under jsdom.
// Render children synchronously with plain divs to keep the DOM stable.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const pass = ({ children, ...rest }: any) =>
    React.createElement("div", rest, children);
  const motion = new Proxy({}, { get: () => pass });
  return { motion, AnimatePresence: ({ children }: any) => children };
});

// ---- Test harness --------------------------------------------------------

import Tasks from "./Tasks";

function renderTasks() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Tasks />
    </QueryClientProvider>,
  );
}

/** Assign stacked layout rects to the task wrappers in current DOM order. */
function layoutTaskItems() {
  const items = Array.from(document.querySelectorAll<HTMLDivElement>(".touch-pan-y"));
  const H = 100;
  const GAP = 20;
  items.forEach((el, i) => {
    const top = i * (H + GAP);
    const rect: DOMRect = {
      x: 0, y: top, top, bottom: top + H,
      left: 0, right: 800, width: 800, height: H,
      toJSON() { return this; },
    } as DOMRect;
    el.getBoundingClientRect = () => rect;
  });
  return items;
}

function fireMouse(target: EventTarget, type: string, clientY: number) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientY, clientX: 100, button: 0 });
  target.dispatchEvent(ev);
}

function makeRow(id: string, description: string, position: number, createdSecondsAgo: number): Row {
  return {
    id, user_id: "u1", type: "normal",
    heading: description, description,
    task_category: null,
    completed: false, completed_at: null,
    created_at: new Date(Date.now() - createdSecondsAgo * 1000).toISOString(),
    color: null, position,
  };
}

function currentPersistedOrder(): string[] {
  return Array.from(store.values())
    .filter((r) => !r.completed)
    .sort((a, b) => a.position - b.position)
    .map((r) => r.id);
}

// ---- Tests ---------------------------------------------------------------

describe("Tasks drag & drop (end-to-end)", () => {
  const originalRaf = window.requestAnimationFrame;
  const originalCaf = window.cancelAnimationFrame;

  beforeEach(() => {
    // Run rAF synchronously via microtask so drag preview updates are observable.
    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number;
    (window as any).cancelAnimationFrame = (h: number) => clearTimeout(h);
  });

  afterEach(() => {
    cleanup();
    (window as any).requestAnimationFrame = originalRaf;
    (window as any).cancelAnimationFrame = originalCaf;
    store.clear();
    updateCalls.length = 0;
  });

  it("reorders an item and persists new positions to storage", async () => {
    seed([
      makeRow("a", "Alpha task", 0, 400),
      makeRow("b", "Bravo task", 1, 300),
      makeRow("c", "Charlie task", 2, 200),
      makeRow("d", "Delta task", 3, 100),
    ]);

    renderTasks();

    // Wait for the initial fetch to render task rows.
    const handles = await screen.findAllByLabelText("Drag to reorder");
    expect(handles).toHaveLength(4);

    // Assign deterministic rects for the wrappers in DOM order [a,b,c,d].
    const items = layoutTaskItems();
    expect(items).toHaveLength(4);

    // Grab task "a"'s drag handle. Its wrapper rect is top=0, height=100.
    const dragA = handles[0];

    await act(async () => {
      // Mouse down at the center of A (clientY=50) → offsetY=50, height=100.
      fireMouse(dragA, "mousedown", 50);
    });

    // Move to clientY=260 → draggedCenter=260 which is between
    // B midpoint (170) and C midpoint (290) → order becomes [b,a,c,d].
    await act(async () => {
      fireMouse(document, "mousemove", 260);
      // Flush the queued rAF callback.
      await new Promise((r) => setTimeout(r, 0));
    });

    // Release to commit.
    await act(async () => {
      fireMouse(document, "mouseup", 260);
    });

    // Storage should now reflect the new order via position updates.
    await waitFor(() => {
      expect(currentPersistedOrder()).toEqual(["b", "a", "c", "d"]);
    });

    // reorderTasks issues one update per row; each id was persisted exactly once.
    const idsUpdated = updateCalls.map((c) => c.id).sort();
    expect(idsUpdated).toEqual(["a", "b", "c", "d"]);

    // Positions are strictly increasing in the new order.
    const positions = ["b", "a", "c", "d"].map((id) => store.get(id)!.position);
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("does not persist when the drag is cancelled with Escape", async () => {
    seed([
      makeRow("a", "Alpha task", 0, 400),
      makeRow("b", "Bravo task", 1, 300),
      makeRow("c", "Charlie task", 2, 200),
    ]);

    renderTasks();
    const handles = await screen.findAllByLabelText("Drag to reorder");
    layoutTaskItems();

    await act(async () => { fireMouse(handles[0], "mousedown", 50); });
    await act(async () => {
      fireMouse(document, "mousemove", 260);
      await new Promise((r) => setTimeout(r, 0));
    });

    // Cancel via Escape — should NOT commit.
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    // No writes issued.
    expect(updateCalls).toHaveLength(0);
    // Persisted order unchanged.
    expect(currentPersistedOrder()).toEqual(["a", "b", "c"]);
  });

  it("moves a lower item to the top when dragged above the first midpoint", async () => {
    seed([
      makeRow("a", "Alpha task", 0, 400),
      makeRow("b", "Bravo task", 1, 300),
      makeRow("c", "Charlie task", 2, 200),
      makeRow("d", "Delta task", 3, 100),
    ]);

    renderTasks();
    const handles = await screen.findAllByLabelText("Drag to reorder");
    layoutTaskItems();

    // Drag D (wrapper top=360, height=100). mousedown at its center=410.
    await act(async () => { fireMouse(handles[3], "mousedown", 410); });

    // Move so draggedCenter (= clientY, since offsetY=50 and height/2=50) is
    // above A's midpoint (50) → inserts D at the top.
    await act(async () => {
      fireMouse(document, "mousemove", 20);
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => { fireMouse(document, "mouseup", 20); });

    await waitFor(() => {
      expect(currentPersistedOrder()).toEqual(["d", "a", "b", "c"]);
    });
  });
});