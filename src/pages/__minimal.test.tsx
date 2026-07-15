import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => { const b: any = { select: () => b, order: () => b, update: () => b, insert: () => Promise.resolve({error:null}), delete: () => b, eq: () => b, then: (r: any) => r({ data: [], error: null }) }; return b; },
  auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} }}}), getSession: async()=>({data:{session:null}}) } },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id:"u1" }, loading:false, signOut: async()=>{} }) }));
vi.mock("@/lib/motion", () => ({ animateCount: () => () => {} }));
describe("stepwise", () => {
  it("imports Tasks", async () => {
    console.log("A");
    const mod = await import("@/pages/Tasks");
    console.log("B", typeof mod.default);
    expect(typeof mod.default).toBe("function");
  });
});
