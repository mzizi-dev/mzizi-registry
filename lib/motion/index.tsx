// Infrastructure lib — motion tokens + presets for brand components.

/**
 * MUKOKO MOTION SYSTEM
 *
 * Motion is not decoration — it is feedback, hierarchy, and spatial orientation.
 * Every animation in the Nyuchi ecosystem follows these tokens so that nhimbe,
 * Bush Trade, Campfire, and every app FEELS the same even when they look different.
 *
 * FOUR DURATION TIERS:
 *   quick:     100ms — micro-interactions (button press, toggle)
 *   standard:  200ms — most transitions (card appear, tab switch)
 *   emphasis:  350ms — important state changes (modal open, page transition)
 *   dramatic:  500ms — hero animations (trust meter fill, onboarding)
 *
 * FOUR EASING CURVES:
 *   entrance:  cubic-bezier(0, 0, 0.2, 1)   — elements arriving (decelerate)
 *   exit:      cubic-bezier(0.4, 0, 1, 1)    — elements leaving (accelerate)
 *   standard:  cubic-bezier(0.4, 0, 0.2, 1)  — moving between states
 *   spring:    cubic-bezier(0.34, 1.56, 0.64, 1) — interactive bounce (FAB, like)
 *
 * REDUCED MOTION: When prefers-reduced-motion is set, all durations collapse
 * to 0ms and transforms become instant opacity fades. Motion tokens carry
 * accessibility by default — you never need to remember to check.
 */

// ─── Duration Tokens ───────────────────────────────────────
export const duration = {
  quick: 100, // ms — button press, toggle switch, ripple
  standard: 200, // ms — card appear, tab switch, dropdown open
  emphasis: 350, // ms — modal open, page transition, trust meter
  dramatic: 500, // ms — hero animation, onboarding, celebration
} as const

// ─── Easing Curves ─────────────────────────────────────────
export const easing = {
  entrance: "cubic-bezier(0, 0, 0.2, 1)", // decelerate in
  exit: "cubic-bezier(0.4, 0, 1, 1)", // accelerate out
  standard: "cubic-bezier(0.4, 0, 0.2, 1)", // smooth between
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // bounce/overshoot
} as const

// ─── Choreography Patterns ─────────────────────────────────
export const choreography = {
  /** Delay between items in a list animation (ms per item) */
  listStagger: 50,
  /** Direction of cascade: which edge items animate from */
  cascadeDirection: "top" as "top" | "bottom" | "left" | "right",
  /** Max number of items to stagger (beyond this, all appear together) */
  maxStaggerItems: 8,
  /** Overlap ratio: how much items overlap in their animations (0-1) */
  overlapRatio: 0.3,
} as const

// ─── Animation Presets ─────────────────────────────────────
// Pre-built animation configs for common brand component behaviors.

export const presets = {
  // Cards and listings fade-slide-up when entering a feed
  feedItemEnter: {
    from: { opacity: 0, transform: "translateY(12px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    duration: duration.standard,
    easing: easing.entrance,
  },
  // Cards fade-slide-down when exiting
  feedItemExit: {
    from: { opacity: 1, transform: "translateY(0)" },
    to: { opacity: 0, transform: "translateY(-8px)" },
    duration: duration.quick,
    easing: easing.exit,
  },
  // Modal/bottom sheet slides up
  overlayEnter: {
    from: { opacity: 0, transform: "translateY(100%)" },
    to: { opacity: 1, transform: "translateY(0)" },
    duration: duration.emphasis,
    easing: easing.entrance,
  },
  // FAB press spring
  fabPress: {
    from: { transform: "scale(1)" },
    to: { transform: "scale(0.92)" },
    duration: duration.quick,
    easing: easing.spring,
  },
  // Verified badge appear
  badgeAppear: {
    from: { opacity: 0, transform: "scale(0.5)" },
    to: { opacity: 1, transform: "scale(1)" },
    duration: duration.standard,
    easing: easing.spring,
  },
  // Trust meter fill
  meterFill: {
    from: { width: "0%" },
    to: { width: "var(--meter-target)" },
    duration: duration.dramatic,
    easing: easing.entrance,
  },
  // Tab switch content
  tabSwitch: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: duration.quick,
    easing: easing.standard,
  },
  // Notification slide in from right
  notificationEnter: {
    from: { opacity: 0, transform: "translateX(100%)" },
    to: { opacity: 1, transform: "translateX(0)" },
    duration: duration.emphasis,
    easing: easing.entrance,
  },
  // Skeleton pulse
  skeletonPulse: {
    keyframes: [{ opacity: 0.06 }, { opacity: 0.12 }, { opacity: 0.06 }],
    duration: 1500,
    easing: "ease-in-out",
    iterations: Infinity,
  },
} as const

// ─── Reduced Motion Fallbacks ──────────────────────────────
// When prefers-reduced-motion is set, every preset collapses
// to an instant opacity transition (no movement).

export const reducedMotionPreset = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 0,
  easing: "linear",
} as const

// ─── CSS Keyframes Generator ───────────────────────────────
export function generateMotionCSS(): string {
  return `
@media (prefers-reduced-motion: no-preference) {
  @keyframes nyuchi-fade-slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nyuchi-fade-slide-down {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-8px); }
  }
  @keyframes nyuchi-scale-spring {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes nyuchi-slide-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes nyuchi-slide-right {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes nyuchi-fade-slide-up { from { opacity: 0; } to { opacity: 1; } }
  @keyframes nyuchi-fade-slide-down { from { opacity: 1; } to { opacity: 0; } }
  @keyframes nyuchi-scale-spring { from { opacity: 0; } to { opacity: 1; } }
  @keyframes nyuchi-slide-up { from { opacity: 0; } to { opacity: 1; } }
  @keyframes nyuchi-slide-right { from { opacity: 0; } to { opacity: 1; } }
}

/* Utility classes */
.nyuchi-animate-in    { animation: nyuchi-fade-slide-up ${duration.standard}ms ${easing.entrance} both; }
.nyuchi-animate-out   { animation: nyuchi-fade-slide-down ${duration.quick}ms ${easing.exit} both; }
.nyuchi-animate-spring { animation: nyuchi-scale-spring ${duration.standard}ms ${easing.spring} both; }
.nyuchi-animate-slide  { animation: nyuchi-slide-up ${duration.emphasis}ms ${easing.entrance} both; }
`
}

// ─── useMotion Hook ────────────────────────────────────────
// Returns the appropriate motion config based on user preference.

import { useTheme } from "@/components/mukoko/mukoko-theme-provider"

export function useMotion() {
  let prefersReduced = false
  try {
    const { prefersReducedMotion } = useTheme()
    prefersReduced = prefersReducedMotion
  } catch {
    // Outside provider — check directly
    if (typeof window !== "undefined") {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
  }

  return {
    duration: prefersReduced ? { quick: 0, standard: 0, emphasis: 0, dramatic: 0 } : duration,
    easing: prefersReduced
      ? { entrance: "linear", exit: "linear", standard: "linear", spring: "linear" }
      : easing,
    presets: prefersReduced
      ? Object.fromEntries(Object.keys(presets).map((k) => [k, reducedMotionPreset]))
      : presets,
    prefersReduced,
    /** Get stagger delay for item at index */
    staggerDelay: (index: number) =>
      prefersReduced ? 0 : Math.min(index, choreography.maxStaggerItems) * choreography.listStagger,
  }
}

export { duration as durations, easing as easings }
