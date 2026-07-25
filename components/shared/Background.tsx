"use client";

import { useEffect, useRef } from "react";

export function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      isGold: boolean;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Create particles with gold and green tones
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.25 + 0.05,
        isGold: Math.random() > 0.6,
      });
    }

    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "hsl(160 25% 4%)" : "hsl(45 30% 97%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const particleColor = p.isGold
          ? `hsla(42 60% 48% / ${p.opacity})`
          : `hsla(160 50% 30% / ${p.opacity})`;
        ctx.fillStyle = particleColor;
        ctx.fill();

        // Subtle connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const connectionOpacity = 0.06 * (1 - dist / 120);
            const connectionColor = p.isGold && p2.isGold
              ? `hsla(42 60% 48% / ${connectionOpacity})`
              : `hsla(160 50% 30% / ${connectionOpacity})`;
            ctx.strokeStyle = connectionColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-[0.12]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}