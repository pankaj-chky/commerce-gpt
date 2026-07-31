"use client";

import React from "react";
import { motion } from "framer-motion";

interface StickyNoteProps {
  content: string;
  color?: "yellow" | "blue" | "red" | "green" | "pink";
  type?: "rule" | "formula" | "mistake" | "tip";
}

const STICKY_COLORS = {
  yellow: { bg: "#fff9c4", border: "#f0d060", text: "#5d4e37" },
  blue: { bg: "#bbdefb", border: "#64b5f6", text: "#1a237e" },
  red: { bg: "#ffcdd2", border: "#e57373", text: "#b71c1c" },
  green: { bg: "#c8e6c9", border: "#81c784", text: "#1b5e20" },
  pink: { bg: "#f8bbd0", border: "#f06292", text: "#880e4f" },
};

const TYPE_LABELS = {
  rule: "📌 Remember this rule",
  formula: "📐 Formula",
  mistake: "⚠️ Common Mistake",
  tip: "💡 Tip",
};

export function StickyNote({
  content,
  color = "yellow",
  type = "tip",
}: StickyNoteProps) {
  const colors = STICKY_COLORS[color];

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -6, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, rotate: 0, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 18,
        mass: 0.8,
      }}
      whileHover={{
        rotate: 1,
        scale: 1.03,
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      className="my-3 mx-2 relative"
    >
      <div
        className="rounded-lg p-3 shadow-md relative"
        style={{
          backgroundColor: colors.bg,
          borderLeft: `4px solid ${colors.border}`,
          transform: "rotate(-0.5deg)",
        }}
      >
        {/* Pin effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-400 shadow-inner"
        />

        {/* Label */}
        <div
          className="text-xs font-bold mb-1"
          style={{ color: colors.text }}
        >
          {TYPE_LABELS[type]}
        </div>

        {/* Content */}
        <div
          className="text-xs leading-relaxed"
          style={{ color: colors.text }}
        >
          {content}
        </div>
      </div>
    </motion.div>
  );
}