/** Browser-only task storage used in guest mode. Rows mirror the backend `tasks` shape. */
const KEY = "guest-tasks";

type Row = Record<string, any> & { id: string };

function read(): Row[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(rows: Row[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export const guestStore = {
  list: () => read().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  insert: (row: Record<string, any>) =>
    write([
      ...read(),
      { id: crypto.randomUUID(), created_at: new Date().toISOString(), completed: false, completed_at: null, ...row },
    ]),
  update: (id: string, patch: Record<string, any>) =>
    write(read().map((r) => (r.id === id ? { ...r, ...patch } : r))),
  remove: (id: string) => write(read().filter((r) => r.id !== id)),
};
