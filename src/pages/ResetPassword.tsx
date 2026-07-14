import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { passwordSchema, getAuthErrorMessage } from "@/lib/validation";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase places the recovery token in the URL hash and creates a session
  // once onAuthStateChange fires with a PASSWORD_RECOVERY event.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If the user opens the link twice, an existing session may already exist.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const p = passwordSchema.safeParse(password);
    if (!p.success) return setError(p.error.issues[0].message);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, "Could not update password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-aurora animate-aurora" />
      <Card className="w-full max-w-sm glass shadow-glow rounded-3xl animate-scale-in border-border/60">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-mint-gradient grid place-items-center shadow-glow">
            {done ? (
              <CheckCircle2 className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            ) : (
              <KeyRound className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            )}
          </div>
          <CardTitle className="font-display text-2xl font-semibold tracking-tight">
            {done ? "Password updated" : "Set a new password"}
          </CardTitle>
          <CardDescription className="text-sm">
            {done
              ? "Redirecting you to your tasks…"
              : ready
                ? "Choose a strong password you haven't used before."
                : "Verifying your reset link…"}
          </CardDescription>
        </CardHeader>
        {!done && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  maxLength={72}
                  className="h-11 rounded-xl bg-background/60"
                  disabled={!ready}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <PasswordInput
                  id="confirm"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  maxLength={72}
                  className="h-11 rounded-xl bg-background/60"
                  disabled={!ready}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pb-8">
              <Button
                type="submit"
                className="w-full h-11 gap-2 rounded-xl bg-mint-gradient text-primary-foreground border-0 shadow-glow hover:opacity-95"
                disabled={loading || !ready}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                <span className="font-medium">Update password</span>
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate("/auth")}
              >
                Back to sign in
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}