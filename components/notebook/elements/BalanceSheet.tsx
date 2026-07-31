"use client";

import React from "react";
import { motion } from "framer-motion";

interface BalanceSheetProps {
  content: string;
  handwritingStyle: {
    fontFamily: string;
    fontSize: number;
    inkColor: string;
    letterSpacing: string;
  };
  animationProgress?: number;
}

export function BalanceSheet({
  content,
  handwritingStyle,
  animationProgress = 1,
}: BalanceSheetProps) {
  const lines = content.split("\n").filter((l) => l.trim());
  const { title, date, assets, liabilities, total } = parseBalanceSheet(lines);

  return (
    <div className="balance-sheet-wrapper my-4">
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
          {title || "Balance Sheet"}
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

      {/* Balance Sheet Table */}
      <div className="border-2 border-gray-800 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-2 border-b-2 border-gray-800 bg-gray-100">
          <div className="px-3 py-1.5 border-r-2 border-gray-800 text-xs font-bold text-center">
            Liabilities
          </div>
          <div className="px-3 py-1.5 text-xs font-bold text-center">
            Assets
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2">
          {/* Liabilities Side */}
          <div className="border-r-2 border-gray-800">
            {liabilities.map((item, idx) => (
              <motion.div
                key={`liab-${idx}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex justify-between px-2 py-0.5 border-b border-gray-200 last:border-b-0"
              >
                <span
                  className="text-xs"
                  style={{
                    fontFamily: handwritingStyle.fontFamily,
                    fontSize: handwritingStyle.fontSize - 2,
                    color: handwritingStyle.inkColor,
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{
                    fontFamily: handwritingStyle.fontFamily,
                    fontSize: handwritingStyle.fontSize - 2,
                    color: handwritingStyle.inkColor,
                  }}
                >
                  {item.amount}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Assets Side */}
          <div>
            {assets.map((item, idx) => (
              <motion.div
                key={`asset-${idx}`}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex justify-between px-2 py-0.5 border-b border-gray-200 last:border-b-0"
              >
                <span
                  className="text-xs"
                  style={{
                    fontFamily: handwritingStyle.fontFamily,
                    fontSize: handwritingStyle.fontSize - 2,
                    color: handwritingStyle.inkColor,
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{
                    fontFamily: handwritingStyle.fontFamily,
                    fontSize: handwritingStyle.fontSize - 2,
                    color: handwritingStyle.inkColor,
                  }}
                >
                  {item.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total Row */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 border-t-2 border-gray-800 bg-gray-50"
        >
          <div className="px-3 py-1 border-r-2 border-gray-800 flex justify-between">
            <span
              className="text-xs font-bold"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
                color: handwritingStyle.inkColor,
              }}
            >
              Total
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
                color: handwritingStyle.inkColor,
              }}
            >
              {total.liabilities}
            </span>
          </div>
          <div className="px-3 py-1 flex justify-between">
            <span
              className="text-xs font-bold"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
                color: handwritingStyle.inkColor,
              }}
            >
              Total
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
                color: handwritingStyle.inkColor,
              }}
            >
              {total.assets}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function parseBalanceSheet(lines: string[]) {
  const title = lines[0] || "Balance Sheet";
  let date = "";
  const assets: Array<{ label: string; amount: string }> = [];
  const liabilities: Array<{ label: string; amount: string }> = [];
  let total = { assets: "", liabilities: "" };
  let currentSection: "assets" | "liabilities" | null = null;

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^as\s+at/i.test(trimmed)) {
      date = trimmed.replace(/^as\s+at\s*/i, "");
      continue;
    }
    if (/^liabilities/i.test(trimmed)) {
      currentSection = "liabilities";
      continue;
    }
    if (/^assets/i.test(trimmed)) {
      currentSection = "assets";
      continue;
    }
    if (/^total/i.test(trimmed)) {
      const amountMatch = trimmed.match(/([\d,]+\.?\d*)/);
      if (amountMatch) {
        if (currentSection === "liabilities") total.liabilities = amountMatch[1];
        else total.assets = amountMatch[1];
      }
      continue;
    }

    const amountMatch = trimmed.match(/([\d,]+\.?\d*)\s*$/);
    const label = amountMatch
      ? trimmed.slice(0, trimmed.lastIndexOf(amountMatch[1])).trim()
      : trimmed;
    const amount = amountMatch ? amountMatch[1] : "";

    if (currentSection === "liabilities") {
      liabilities.push({ label, amount });
    } else if (currentSection === "assets") {
      assets.push({ label, amount });
    }
  }

  return { title, date, assets, liabilities, total };
}