"use client";

import React from "react";
import { motion } from "framer-motion";

interface TeacherCommentProps {
  content: string;
  type?: "correct" | "wrong" | "board-favourite" | "remember" | "tip";
}

const COMMENT_STYLES = {
  correct: {
    icon: "✓",
    label: "Correct",
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-800",
    iconColor: "text-green-600",
  },
  wrong: {
    icon: "⚠",
    label: "Check Again",
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-800",
    iconColor: "text-red-600",
  },
  "board-favourite": {
    icon: "⭐",
    label: "Board Favourite",
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-800",
    iconColor: "text-yellow-600",
  },
  remember: {
    icon: "💡",
    label: "Remember",
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-800",
    iconColor: "text-blue-600",
  },
  tip: {
    icon: "📝",
    label: "Tip",
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-800",
    iconColor: "text-purple-600",
  },
};

export function TeacherComment({
  content,
  type = "correct",
}: TeacherCommentProps) {
  const style = COMMENT_STYLES[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 20,
        mass: 0.7,
      }}
      className="my-2 ml-4 mr-2"
    >
      <div
        className={`inline-flex items-start gap-2 px-3 py-1.5 rounded-lg border-l-4 ${style.bg} ${style.border} shadow-sm`}
      >
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}
          className={`text-sm font-bold ${style.iconColor}`}
        >
          {style.icon}
        </motion.span>
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
            {style.label}
          </span>
          <p className={`text-xs mt-0.5 ${style.text}`}>{content}</p>
        </div>
      </div>
    </motion.div>
  );
}