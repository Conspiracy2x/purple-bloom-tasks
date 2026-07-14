import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, Loader2, CheckCircle2, Mail, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useTurnstile } from "@/hooks/useTurnstile";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(255, "Email is too long.")
  .email("Please enter a valid email.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const turnstile = useTurnstile();

  const validate = () => {
    const e = emailSchema.safeParse(email);
    if (!e.success) return e.error.issues[0].message;
    if (mode === "forgot") return null;
    const p = passwordSchema.safeParse(password);
    if (!p.success) return p.error.issues[0].message;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const captchaOk = await turnstile.verify();
      if (!captchaOk) {
        setError(turnstile.error || "Please complete the security check.");
        setLoading(false);
        return;
      }
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage("Check your email for a verification link before signing in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("If an account exists for that email, a reset link is on its way.");
        turnstile.reset();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-aurora animate-aurora" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <Card className="w-full max-w-sm glass shadow-glow rounded-3xl animate-scale-in border-border/60">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 relative">
            <div className="h-14 w-14 rounded-2xl bg-mint-gradient grid place-items-center shadow-glow">
              <CheckCircle2 className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-xl -z-10" />
          </div>
          <CardTitle className="font-display text-2xl font-semibold tracking-tight">
            Just <span className="text-mint-gradient">Do It</span>
          </CardTitle>
          <CardDescription className="text-sm">
            {mode === "login"
              ? "Welcome back. Focus and ship."
              : mode === "signup"
                ? "Start shipping small consistent wins."
                : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 rounded-xl bg-background/60"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                        setMessage(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-11 rounded-xl bg-background/60 pr-10"
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <div
              ref={turnstile.containerRef}
              className="flex justify-center min-h-[65px]"
              aria-label="Security check"
            />
          </CardContent>
          <CardFooter className="flex-col gap-3 pb-8">
            <Button
              type="submit"
              className="w-full h-11 gap-2 rounded-xl bg-mint-gradient text-primary-foreground border-0 shadow-glow hover:opacity-95"
              disabled={loading || !turnstile.ready}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="h-4 w-4" />
              ) : mode === "signup" ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span className="font-medium">
                {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </span>
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setMessage(null);
              }}
            >
              {mode === "forgot"
                ? "← Back to sign in"
                : mode === "login"
                  ? "New here? Create an account →"
                  : "Have an account? Sign in →"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
