import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      const b: any = {
        select: () => b, order: () => b, update: () => b,
        insert: () => Promise.resolve({error:null}), delete: () => b, eq: () => b,
        then: (r: any) => r({ data: [], error: null }),
      };
      return b;
    },
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} }}}), getSession: async()=>({data:{session:null}}) },
  },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id:"u1" }, loading:false, signOut: async()=>{} }) }));
vi.mock("@/lib/motion", () => ({ animateCount: () => () => {} }));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const pass = React.forwardRef(({ children, ...rest }: any, ref: any) => React.createElement("div", { ref, ...rest }, children));
  const motion = new Proxy({}, { get: () => pass });
  return { motion, AnimatePresence: ({ children }: any) => children };
});
import Tasks from "@/pages/Tasks";
describe("render", () => {
  it("mounts", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }}});
    const { unmount } = render(<QueryClientProvider client={qc}><Tasks /></QueryClientProvider>);
    unmount();
    expect(true).toBe(true);
  });
});
