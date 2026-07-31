"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface JournalEntryProps {
  content: string;
  handwritingStyle: {
    fontFamily: string;
    fontSize: number;
    inkColor: string;
    letterSpacing: string;
  };
  animationProgress?: number;
  isAnimating?: boolean;
}

export function JournalEntry({
  content,
  handwritingStyle,
  animationProgress = 1,
  isAnimating = false,
}: JournalEntryProps) {
  const lines = content.split("\n").filter((l) => l.trim());
  const entries = parseJournalLines(lines);

  return (
    <div className="journal-entry-wrapper my-4">
      {/* Journal Entry Header */}
      <div className="journal-header text-center mb-2">
        <span
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            fontFamily: handwritingStyle.fontFamily,
            color: handwritingStyle.inkColor,
            opacity: isAnimating ? animationProgress : 1,
          }}
        >
          Journal Entry
        </span>
      </div>

      {/* Journal Table */}
      <div className="journal-table border-2 border-gray-800 rounded-sm overflow-hidden">
        {/* Column Headers */}
        <div className="journal-table-header grid grid-cols-12 border-b-2 border-gray-800 bg-gray-100">
          <div className="col-span-2 px-2 py-1.5 border-r border-gray-400 text-xs font-bold text-center">
            Date
          </div>
          <div className="col-span-5 px-2 py-1.5 border-r border-gray-400 text-xs font-bold">
            Particulars
          </div>
          <div className="col-span-1 px-2 py-1.5 border-r border-gray-400 text-xs font-bold text-center">
            L.F.
          </div>
          <div className="col-span-2 px-2 py-1.5 border-r border-gray-400 text-xs font-bold text-right">
            Debit (₹)
          </div>
          <div className="col-span-2 px-2 py-1.5 text-xs font-bold text-right">
            Credit (₹)
          </div>
        </div>

        {/* Entry Rows */}
        {entries.map((entry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -12, y: 4 }}
            animate={{
              opacity: isAnimating ? animationProgress : 1,
              x: 0,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: idx * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={() => idx === entries.length - 1 && haptics.tick()}
          >
            {/* Main Entry Row */}
            <div
              className={cn(
                "grid grid-cols-12 border-b border-gray-300",
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              <div
                className="col-span-2 px-2 py-1 border-r border-gray-300 text-xs"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 2,
                  color: handwritingStyle.inkColor,
                }}
              >
                {entry.date || ""}
              </div>
              <div
                className="col-span-5 px-2 py-1 border-r border-gray-300 text-xs"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 2,
                  color: handwritingStyle.inkColor,
                }}
              >
                {entry.particulars}
              </div>
              <div
                className="col-span-1 px-2 py-1 border-r border-gray-300 text-xs text-center"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 2,
                  color: handwritingStyle.inkColor,
                }}
              >
                {entry.lf || ""}
              </div>
              <div
                className="col-span-2 px-2 py-1 border-r border-gray-300 text-xs text-right font-mono"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 2,
                  color: handwritingStyle.inkColor,
                }}
              >
                {entry.debit || ""}
              </div>
              <div
                className="col-span-2 px-2 py-1 text-xs text-right font-mono"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 2,
                  color: handwritingStyle.inkColor,
                }}
              >
                {entry.credit || ""}
              </div>
            </div>

            {/* Narration */}
            {entry.narration && (
              <div
                className="px-4 py-0.5 text-xs italic border-b border-gray-200 bg-gray-50/50"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize - 4,
                  color: "#666",
                }}
              >
                ({entry.narration})
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function parseJournalLines(lines: string[]) {
  const entries: Array<{
    date?: string;
    particulars: string;
    lf?: string;
    debit?: string;
    credit?: string;
    narration?: string;
  }> = [];

  let current: any = { particulars: "" };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Date detection
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(trimmed)) {
      if (current.particulars && current.particulars !== "") {
        entries.push({ ...current });
      }
      current = { date: trimmed, particulars: "" };
      continue;
    }

    // Narration
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      current.narration = trimmed.replace(/^\(|\)$/g, "");
      continue;
    }

    // Debit/Credit amounts
    if (/^[\d,]+\.?\d*$/.test(trimmed.replace(/,/g, ""))) {
      if (!current.debit) current.debit = trimmed;
      else current.credit = trimmed;
      continue;
    }

    // L.F. number
    if (/^\d+$/.test(trimmed) && trimmed.length <= 3) {
      current.lf = trimmed;
      continue;
    }

    // Particulars
    if (current.particulars) {
      current.particulars += " " + trimmed;
    } else {
      current.particulars = trimmed;
    }
  }

  if (current.particulars) {
    entries.push({ ...current });
  }

  return entries;
}