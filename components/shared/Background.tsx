"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle animated candlestick chart background.
 * Renders a very faint, slow-moving financial chart on a canvas behind all content.
 */
export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isDark = document.documentElement.classList.contains("dark");

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Candle spacing
      const candleW = 4;
      const gap = 16;
      const totalW = candleW + gap;
      const count = Math.ceil(w / totalW) + 2;
      const baseY = h * 0.55;
      const amp = h * 0.25;

      // Seeded pseudo-random for deterministic chart
      const seed = (i: number) => {
        const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
      };

      ctx.strokeStyle = isDark
        ? "rgba(57,182,176,0.06)"
        : "rgba(44,142,140,0.06)";
      ctx.fillStyle = isDark
        ? "rgba(57,182,176,0.04)"
        : "rgba(44,142,140,0.04)";

      for (let i = 0; i < count; i++) {
        const x = i * totalW - (offset % totalW);
        const open = baseY - seed(i * 2) * amp;
        const close = baseY - seed(i * 2 + 1) * amp;
        const high = Math.min(open, close) - seed(i * 3) * amp * 0.3;
        const low = Math.max(open, close) + seed(i * 3 + 1) * amp * 0.3;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x + candleW / 2, high);
        ctx.lineTo(x + candleW / 2, low);
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Body
        const bodyTop = Math.min(open, close);
        const bodyHeight = Math.max(1, Math.abs(close - open));
        ctx.fillRect(x, bodyTop, candleW, bodyHeight);

        // Line chart overlay
        if (i > 0) {
          const prevX = (i - 1) * totalW - (offset % totalW) + candleW / 2;
          const prevClose =
            baseY - seed((i - 1) * 2 + 1) * amp;
          ctx.beginPath();
          ctx.moveTo(prevX, prevClose);
          ctx.lineTo(x + candleW / 2, close);
          ctx.strokeStyle = isDark
            ? "rgba(139,124,255,0.04)"
            : "rgba(124,106,242,0.04)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.strokeStyle = isDark
            ? "rgba(57,182,176,0.06)"
            : "rgba(44,142,140,0.06)";
        }
      }

      offset += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      // Redraw on theme change
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
      aria-hidden="true"
    />
  );
}