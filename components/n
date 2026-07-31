"use client";

import React from "react";
import { motion } from "framer-motion";

interface TrialBalanceProps {
  content: string;
  handwritingStyle: {
    fontFamily: string;
    fontSize: number;
    inkColor: string;
    letterSpacing: string;
  };
  animationProgress?: number;
}

export function TrialBalance({
  content,
  handwritingStyle,
  animationProgress = 1,
}: TrialBalanceProps) {
  const lines = content.split("\n").filter((l) => l.trim());
  const { title, date, entries, total } = parseTrialBalance(lines);

  return (
    <div className="trial-balance-wrapper my-4">
      {/* Title */}
      <div className="text-center mb-1">
        <span
          className="text-sm font-bold uppercase tracking-wider"
          style={{
            fontFamily: handwritingStyle.fontFamily,
            fontSize: handwritingStyle.fontSize,
            color: handwritingStyle.inkColor,
          }}
        >
          {title || "Trial Balance"}
        </span>
      </div>
      {date && (
        <div className="text-center mb-2">
          <span
            className="text-xs"
            style={{
              fontFamily: handwritingStyle.fontFamily,
              fontSize: handwritingStyle.fontSize - 3,
              color: "#666",
            }}
          >
            as at {date}
          </span>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="border-2 border-gray-800 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 border-b-2 border-gray-800 bg-gray-100">
          <div className="col-span-1 px-3 py-1.5 border-r border-gray-400 text-xs font-bold text-center">
            Account Title
          </div>
          <div className="px-3 py-1.5 border-r border-gray-400 text-xs font-bold text-right">
            Debit (₹)
          </div>
          <div className="px-3 py-1.5 text-xs font-bold text-right">
            Credit (₹)
          </div>
        </div>

        {/* Entries */}
        {entries.map((entry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -6, y: 2 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              duration: 0.35,
              delay: idx * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "grid grid-cols-3 border-b border-gray-200",
              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
            )}
          >
            <div
              className="col-span-1 px-3 py-0.5 border-r border-gray-200 text-xs"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 2,
                color: handwritingStyle.inkColor,
              }}
            >
              {entry.account}
            </div>
            <div
              className="px-3 py-0.5 border-r border-gray-200 text-xs text-right font-mono"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 2,
                color: handwritingStyle.inkColor,
              }}
            >
              {entry.debit || ""}
            </div>
            <div
              className="px-3 py-0.5 text-xs text-right font-mono"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 2,
                color: handwritingStyle.inkColor,
              }}
            >
              {entry.credit || ""}
            </div>
          </motion.div>
        ))}

        {/* Total Row */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 border-t-2 border-gray-800 bg-gray-50 font-bold"
        >
          <div
            className="col-span-1 px-3 py-1 border-r border-gray-400 text-xs"
            style={{
              fontFamily: handwritingStyle.fontFamily,
              fontSize: handwritingStyle.fontSize - 1,
              color: handwritingStyle.inkColor,
            }}
          >
            Total
          </div>
          <div
            className="px-3 py-1 border-r border-gray-400 text-xs text-right font-mono"
            style={{
              fontFamily: handwritingStyle.fontFamily,
              fontSize: handwritingStyle.fontSize - 1,
              color: handwritingStyle.inkColor,
            }}
          >
            {total.debit}
          </div>
          <div
            className="px-3 py-1 text-xs text-right font-mono"
            style={{
              fontFamily: handwritingStyle.fontFamily,
              fontSize: handwritingStyle.fontSize - 1,
              color: handwritingStyle.inkColor,
            }}
          >
            {total.credit}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function parseTrialBalance(lines: string[]) {
  const title = lines[0] || "Trial Balance";
  let date = "";
  const entries: Array<{ account: string; debit?: string; credit?: string }> = [];
  const total = { debit: "", credit: "" };

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^as\s+at/i.test(trimmed)) {
      date = trimmed.replace(/^as\s+at\s*/i, "");
      continue;
    }
    if (/^total/i.test(trimmed)) {
      const amounts = trimmed.match(/[\d,]+\.?\d*/g);
      if (amounts) {
        total.debit = amounts[0] || "";
        total.credit = amounts[1] || "";
      }
      continue;
    }

    // Parse account name and amounts
    const amounts = trimmed.match(/[\d,]+\.?\d*/g);
    if (amounts && amounts.length > 0) {
      const debit = amounts[0] || "";
      const credit = amounts[1] || "";
      const accountEnd = trimmed.lastIndexOf(amounts[0]);
      const account = trimmed.slice(0, accountEnd).trim();
      entries.push({ account, debit, credit });
    } else {
      entries.push({ account: trimmed });
    }
  }

  return { title, date, entries, total };
}