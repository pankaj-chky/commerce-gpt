"use client";

import React from "react";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface LedgerAccountProps {
  content: string;
  handwritingStyle: {
    fontFamily: string;
    fontSize: number;
    inkColor: string;
    letterSpacing: string;
  };
  animationProgress?: number;
}

export function LedgerAccount({
  content,
  handwritingStyle,
  animationProgress = 1,
}: LedgerAccountProps) {
  const lines = content.split("\n").filter((l) => l.trim());
  const { title, entries } = parseLedgerLines(lines);

  return (
    <div className="ledger-account-wrapper my-4">
      {/* Account Title */}
      <div className="text-center mb-2">
        <span
          className="text-sm font-bold uppercase"
          style={{
            fontFamily: handwritingStyle.fontFamily,
            fontSize: handwritingStyle.fontSize,
            color: handwritingStyle.inkColor,
          }}
        >
          {title || "Ledger Account"}
        </span>
      </div>

      {/* T-Account */}
      <div className="t-account border-2 border-gray-800 rounded-sm">
        {/* Header Row */}
        <div className="grid grid-cols-2 border-b-2 border-gray-800">
          <div className="px-3 py-1.5 border-r-2 border-gray-800 text-xs font-bold text-center bg-gray-100">
            Dr.
          </div>
          <div className="px-3 py-1.5 text-xs font-bold text-center bg-gray-100">
            Cr.
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 min-h-[60px]">
          {/* Debit Side */}
          <div className="border-r-2 border-gray-800">
            {entries
              .filter((e) => e.side === "debit")
              .map((entry, idx) => (
                <motion.div
                  key={`dr-${idx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="px-2 py-0.5 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: handwritingStyle.fontFamily,
                        fontSize: handwritingStyle.fontSize - 2,
                        color: handwritingStyle.inkColor,
                      }}
                    >
                      {entry.particulars}
                    </span>
                    <span
                      className="text-xs font-mono ml-2"
                      style={{
                        fontFamily: handwritingStyle.fontFamily,
                        fontSize: handwritingStyle.fontSize - 2,
                        color: handwritingStyle.inkColor,
                      }}
                    >
                      {entry.amount}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Credit Side */}
          <div>
            {entries
              .filter((e) => e.side === "credit")
              .map((entry, idx) => (
                <motion.div
                  key={`cr-${idx}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="px-2 py-0.5 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: handwritingStyle.fontFamily,
                        fontSize: handwritingStyle.fontSize - 2,
                        color: handwritingStyle.inkColor,
                      }}
                    >
                      {entry.particulars}
                    </span>
                    <span
                      className="text-xs font-mono ml-2"
                      style={{
                        fontFamily: handwritingStyle.fontFamily,
                        fontSize: handwritingStyle.fontSize - 2,
                        color: handwritingStyle.inkColor,
                      }}
                    >
                      {entry.amount}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseLedgerLines(lines: string[]) {
  const title = lines[0] || "Account";
  const entries: Array<{
    side: "debit" | "credit";
    particulars: string;
    amount: string;
  }> = [];

  let currentSide: "debit" | "credit" = "debit";

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^dr\.?$/i.test(trimmed)) {
      currentSide = "debit";
      continue;
    }
    if (/^cr\.?$/i.test(trimmed)) {
      currentSide = "credit";
      continue;
    }

    // Try to parse amount from end of line
    const amountMatch = trimmed.match(/([\d,]+\.?\d*)\s*$/);
    const amount = amountMatch ? amountMatch[1] : "";
    const particulars = amountMatch
      ? trimmed.slice(0, trimmed.lastIndexOf(amountMatch[1])).trim()
      : trimmed;

    if (particulars || amount) {
      entries.push({
        side: currentSide,
        particulars: particulars || "—",
        amount: amount || "—",
      });
    }
  }

  return { title, entries };
}