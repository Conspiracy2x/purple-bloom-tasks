import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      const b: any = {
        select: () => b, order: () => b, update: () => b, insert: () => Promise.resolve({error:null}),
        delete: () => b, eq: () => b,
        then: (r: any) => r({ data: [], error: null }),
      };
      return b;
    },
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: {}, loading: false, signOut: async()=>{} }) }));
vi.mock("@/lib/motion", () => ({ animateCount: () => () => {} }));

import Tasks from "@/pages/Tasks";

describe("mount", () => {
  it("renders", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><Tasks /></QueryClientProvider>);
    expect(await screen.findByText(/focus/i)).toBeInTheDocument();
  });
});
