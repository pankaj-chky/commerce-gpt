"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { haptics } from "@/lib/haptics";

interface AnimationConfig {
  speed: "slow" | "normal" | "fast";
  onComplete?: () => void;
}

interface AnimationState {
  isAnimating: boolean;
  visibleCharacters: number;
  totalCharacters: number;
  progress: number; // 0-1
}

// Duration in ms for the *entire* text reveal (per element)
const SPEED_DURATIONS = {
  slow: 2400,
  normal: 1400,
  fast: 700,
};

// Premium easing — ease-out-cubic with a gentle settle
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Slight ease-in-out for more natural pen feel
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function useHandwritingAnimation(config?: AnimationConfig) {
  const [states, setStates] = useState<Record<string, AnimationState>>({});
  const rafRef = useRef<Record<string, number>>({});
  const startRef = useRef<Record<string, number>>({});
  const speed = config?.speed || "normal";
  const onCompleteRef = useRef(config?.onComplete);
  const hapticTickRef = useRef<Record<string, number>>({});

  // Keep ref updated without re-triggering animations
  useEffect(() => {
    onCompleteRef.current = config?.onComplete;
  }, [config?.onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(rafRef.current).forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

  const startAnimation = useCallback(
    (elementId: string, text: string) => {
      // Cancel any existing animation for this element
      if (rafRef.current[elementId]) {
        cancelAnimationFrame(rafRef.current[elementId]);
      }

      const totalChars = text.length;
      if (totalChars === 0) {
        setStates((prev) => ({
          ...prev,
          [elementId]: {
            isAnimating: false,
            visibleCharacters: 0,
            totalCharacters: 0,
            progress: 1,
          },
        }));
        return;
      }

      // Duration scales with text length but is capped for very long text
      const baseDuration = SPEED_DURATIONS[speed];
      const duration = Math.min(
        baseDuration + totalChars * 6,
        baseDuration * 3
      );

      // Pen-down haptic
      haptics.penDown();
      hapticTickRef.current[elementId] = 0;

      setStates((prev) => ({
        ...prev,
        [elementId]: {
          isAnimating: true,
          visibleCharacters: 0,
          totalCharacters: totalChars,
          progress: 0,
        },
      }));

      const startTime = performance.now();
      startRef.current[elementId] = startTime;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const linearProgress = Math.min(elapsed / duration, 1);
        // Use ease-in-out-sine for a natural writing rhythm
        const eased = easeInOutSine(linearProgress);
        const currentChar = Math.floor(eased * totalChars);
        const progress = currentChar / totalChars;

        // Periodic haptic tick every ~15% progress
        const tickCount = Math.floor(progress / 0.15);
        if (tickCount > hapticTickRef.current[elementId]) {
          hapticTickRef.current[elementId] = tickCount;
          haptics.tick();
        }

        if (linearProgress >= 1) {
          // Animation complete
          setStates((prev) => ({
            ...prev,
            [elementId]: {
              isAnimating: false,
              visibleCharacters: totalChars,
              totalCharacters: totalChars,
              progress: 1,
            },
          }));
          haptics.penUp();
          onCompleteRef.current?.();
          delete rafRef.current[elementId];
          delete startRef.current[elementId];
          delete hapticTickRef.current[elementId];
          return;
        }

        setStates((prev) => {
          const existing = prev[elementId];
          // Skip state update if nothing changed (reduces re-renders)
          if (existing && existing.visibleCharacters === currentChar) {
            return prev;
          }
          return {
            ...prev,
            [elementId]: {
              isAnimating: true,
              visibleCharacters: currentChar,
              totalCharacters: totalChars,
              progress,
            },
          };
        });

        rafRef.current[elementId] = requestAnimationFrame(animate);
      };

      rafRef.current[elementId] = requestAnimationFrame(animate);
    },
    [speed]
  );

  const stopAnimation = useCallback((elementId: string) => {
    if (rafRef.current[elementId]) {
      cancelAnimationFrame(rafRef.current[elementId]);
      delete rafRef.current[elementId];
    }
    delete startRef.current[elementId];
    delete hapticTickRef.current[elementId];
    setStates((prev) => {
      const newStates = { ...prev };
      delete newStates[elementId];
      return newStates;
    });
  }, []);

  const getAnimatedText = useCallback(
    (elementId: string, text: string): string => {
      const state = states[elementId];
      if (!state || !state.isAnimating) return text;
      return text.slice(0, state.visibleCharacters);
    },
    [states]
  );

  const getAnimationProgress = useCallback(
    (elementId: string): number => {
      return states[elementId]?.progress || 0;
    },
    [states]
  );

  const isAnimating = useCallback(
    (elementId: string): boolean => {
      return states[elementId]?.isAnimating || false;
    },
    [states]
  );

  return {
    startAnimation,
    stopAnimation,
    getAnimatedText,
    getAnimationProgress,
    isAnimating,
  };
}

/**
 * Hook for pen stroke animation - simulates drawing lines/curves
 * Uses requestAnimationFrame with smooth easing.
 */
export function usePenStrokeAnimation() {
  const [strokeProgress, setStrokeProgress] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);

  const startStroke = useCallback((duration: number = 1200) => {
    setIsDrawing(true);
    setStrokeProgress(0);
    haptics.penDown();
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const linearProgress = Math.min(elapsed / duration, 1);
      // Premium ease-out-expo for a confident stroke
      const eased = linearProgress === 1 ? 1 : 1 - Math.pow(2, -10 * linearProgress);
      setStrokeProgress(eased);

      if (linearProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsDrawing(false);
        haptics.penUp();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const stopStroke = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsDrawing(false);
    setStrokeProgress(0);
  }, []);

  return {
    strokeProgress,
    isDrawing,
    startStroke,
    stopStroke,
  };
}

/**
 * Hook for page turn animation
 * Uses requestAnimationFrame with premium easing.
 */
export function usePageTurnAnimation() {
  const [isTurning, setIsTurning] = useState(false);
  const [turnProgress, setTurnProgress] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  const turnPage = useCallback((direction: "forward" | "backward", duration: number = 700) => {
    setIsTurning(true);
    setTurnProgress(0);
    haptics.pageTurn();
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Premium ease-in-out-quint for a luxurious page turn
      const eased =
        progress < 0.5
          ? 16 * progress * progress * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 5) / 2;
      setTurnProgress(eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsTurning(false);
        setTurnProgress(0);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  return {
    isTurning,
    turnProgress,
    turnPage,
  };
}