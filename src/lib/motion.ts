import gsap from "gsap";

// Shared motion primitives so every tween across the app feels the same.
const EASE = "expo.out";
const DUR = { xs: 0.35, sm: 0.5, md: 0.7, lg: 0.9 } as const;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

let gsapConfigured = false;
function configureGsap() {
  if (gsapConfigured) return;
  gsapConfigured = true;
  gsap.config({ force3D: true, nullTargetWarn: false });
  gsap.defaults({ ease: EASE, duration: DUR.md, overwrite: "auto" });
  gsap.ticker.lagSmoothing(500, 33);
}

/** Smoothly animate an integer counter on a text node. Returns a cleanup fn. */
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