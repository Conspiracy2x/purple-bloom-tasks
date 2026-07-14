import gsap from "gsap";

/**
 * Shared motion primitives so every GSAP tween across the app
 * feels the same and stays smooth on low-end devices.
 *
 * - `EASE`: one easing curve everywhere (expo.out) → confident, natural deceleration.
 * - `DUR`:  a small scale of durations so nothing feels out-of-tempo.
 * - `prefersReducedMotion`: honors the OS-level setting.
 * - `animateCount`: efficient integer counter using a quickSetter,
 *    snapped to whole numbers, GPU-friendly, cleans up on unmount.
 */

export const EASE = "expo.out";
export const DUR = { xs: 0.35, sm: 0.5, md: 0.7, lg: 0.9 } as const;

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

// One-time global GSAP config for consistency + perf.
let configured = false;
export function configureGsap() {
  if (configured) return;
  configured = true;
  gsap.config({ force3D: true, nullTargetWarn: false });
  gsap.defaults({ ease: EASE, duration: DUR.md, overwrite: "auto" });
  // Match GSAP's ticker to the browser's rAF for jank-free updates.
  gsap.ticker.lagSmoothing(500, 33);
}

/**
 * Smoothly animate an integer counter on a text node.
 * Returns a cleanup function.
 */
export function animateCount(
  el: HTMLElement | null,
  to: number,
  opts: { duration?: number; delay?: number } = {}
): () => void {
  if (!el) return () => {};
  configureGsap();

  const from = Number(el.textContent) || 0;
  const setText = gsap.quickSetter(el, "innerText") as (v: string) => void;

  if (prefersReducedMotion()) {
    setText(String(Math.round(to)));
    return () => {};
  }

  const state = { n: from };
  const tween = gsap.to(state, {
    n: to,
    duration: opts.duration ?? DUR.lg,
    delay: opts.delay ?? 0,
    ease: EASE,
    snap: { n: 1 },
    onUpdate: () => setText(String(state.n)),
  });

  return () => tween.kill();
}