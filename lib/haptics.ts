/**
 * Premium haptic feedback utility.
 *
 * Uses the Web Vibration API (navigator.vibrate) where available,
 * and gracefully no-ops on unsupported devices.
 *
 * All patterns are designed to be subtle and premium — never jarring.
 */

// Respect reduced-motion preference
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Check if vibration is supported
function isVibrationSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/**
 * Trigger a haptic vibration pattern.
 * Silently no-ops if the device doesn't support vibration or if
 * the user prefers reduced motion.
 */
function vibrate(pattern: number | number[]): void {
  if (!isVibrationSupported() || prefersReducedMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silently ignore — some browsers throw in certain contexts
  }
}

export const haptics = {
  /** Ultra-light tap — for hover, focus, subtle selections */
  light: () => vibrate(8),

  /** Light impact — for button presses, small toggles */
  medium: () => vibrate(12),

  /** Medium impact — for send, confirm actions */
  heavy: () => vibrate(20),

  /** Success pattern — two ascending taps (copy, export complete) */
  success: () => vibrate([10, 30, 18]),

  /** Error/warning pattern — two descending taps (delete, blocked) */
  warning: () => vibrate([18, 40, 10]),

  /** Selection tick — very short, for item selection */
  selection: () => vibrate(5),

  /** Soft tick — for animation milestones (char reveal start) */
  tick: () => vibrate(3),

  /** Pen-down feel — for handwriting animation start */
  penDown: () => vibrate(6),

  /** Pen-up feel — for handwriting animation complete */
  penUp: () => vibrate([4, 20, 8]),

  /** Page turn feel — a quick double tap */
  pageTurn: () => vibrate([8, 15, 6]),
};

/**
 * Convenience hook to get haptic functions.
 * Can be called in any client component.
 */
export function useHaptics() {
  return haptics;
}