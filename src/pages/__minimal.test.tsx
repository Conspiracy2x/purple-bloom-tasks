import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({}), auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} }}}), getSession: async()=>({data:{session:null}}) } },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id:"u1" }, loading:false, signOut: async()=>{} }) }));
vi.mock("@/lib/motion", () => ({ animateCount: () => () => {} }));
import Tasks from "@/pages/Tasks";
describe("import", () => {
  it("has default export", () => { expect(typeof Tasks).toBe("function"); });
});
