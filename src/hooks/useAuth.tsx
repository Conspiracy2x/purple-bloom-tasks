import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const GUEST_KEY = "guest-mode";
const GUEST_USER = { id: "guest", email: "Guest" } as User;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  continueAsGuest: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === "1");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        if (session) {
          localStorage.removeItem(GUEST_KEY);
          setIsGuest(false);
        }
        // A password-recovery link creates a session and fires PASSWORD_RECOVERY.
        if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
          window.location.replace("/reset-password");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
  };

  const signOut = async () => {
    if (isGuest && !session) {
      localStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const user = session?.user ?? (isGuest ? GUEST_USER : null);

  return (
    <AuthContext.Provider value={{ session, user, loading, isGuest: isGuest && !session, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
