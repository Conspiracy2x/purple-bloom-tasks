/**
 * Retry helper for backend calls that can fail when the backend is
 * waking up from sleep (cold start). Retries only transient network /
 * gateway failures — never auth or validation errors.
 */

const TRANSIENT_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "fetcherror",
  "load failed",
  "service unavailable",
  "gateway timeout",
];

export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const status = (err as { status?: number }).status;
  if (status === 502 || status === 503 || status === 504) return true;
  const message = String(
    (err as { message?: string }).message ?? err
  ).toLowerCase();
  // TypeError from fetch has no message body in some browsers — treat bare TypeErrors as transient
  if (err instanceof TypeError) return true;
  return TRANSIENT_PATTERNS.some((p) => message.includes(p));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `fn`, retrying transient failures with backoff.
 * Defaults: 3 attempts total, ~1s / 2.5s delays — enough for a cold start.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 1000 }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || i === attempts - 1) throw err;
      await sleep(baseDelayMs * (i + 1) * (i + 1) * 0.5 + baseDelayMs * 0.5);
    }
  }
  throw lastError;
}

/**
 * Wraps Supabase-style calls that resolve with `{ data, error }` instead of
 * throwing — throws on error so withRetry can inspect it.
 */
export async function callWithRetry<T extends { error: unknown }>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number }
): Promise<T> {
  return withRetry(async () => {
    const result = await fn();
    if (result.error) throw result.error;
    return result;
  }, opts);
}
