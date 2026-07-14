import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    __turnstileLoading?: Promise<void>;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoading) return window.__turnstileLoading;
  window.__turnstileLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile_load_failed")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(s);
  });
  return window.__turnstileLoading;
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch site key from edge function (public config).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("captcha-config");
        if (cancelled) return;
        if (error) throw error;
        if (!data?.siteKey) throw new Error("missing_site_key");
        setSiteKey(data.siteKey);
      } catch (e) {
        if (!cancelled) setError("Could not initialize security check.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render widget once site key + container are ready.
  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetIdRef.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "flexible",
          callback: (t: string) => {
            setToken(t);
            setReady(true);
            setError(null);
          },
          "error-callback": () => {
            setToken(null);
            setError("Security check failed. Please retry.");
          },
          "expired-callback": () => {
            setToken(null);
            setReady(false);
          },
        });
      })
      .catch(() => setError("Could not load security check."));
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  const reset = useCallback(() => {
    setToken(null);
    setReady(false);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const verify = useCallback(async (): Promise<boolean> => {
    if (!token) {
      setError("Please complete the security check.");
      return false;
    }
    try {
      const { data, error } = await supabase.functions.invoke("verify-captcha", {
        body: { token },
      });
      if (error || !data?.success) {
        setError("Security check failed. Please try again.");
        reset();
        return false;
      }
      return true;
    } catch {
      setError("Security check unavailable. Please retry.");
      reset();
      return false;
    }
  }, [token, reset]);

  return { containerRef, token, ready, error, reset, verify };
}