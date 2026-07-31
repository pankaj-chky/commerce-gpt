"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { JournalEntry } from "./elements/JournalEntry";
import { LedgerAccount } from "./elements/LedgerAccount";
import { BalanceSheet } from "./elements/BalanceSheet";
import { TrialBalance } from "./elements/TrialBalance";
import { StickyNote } from "./elements/StickyNote";
import { TeacherComment } from "./elements/TeacherComment";
import { useHandwritingAnimation } from "./hooks/use-handwriting-animation";
import { parseNotebookContent } from "./utils/content-parser";
import type { NotebookConfig, NotebookTheme, HandwritingStyle } from "./types";
import { HANDWRITING_STYLES, NOTEBOOK_THEMES, DEFAULT_NOTEBOOK_CONFIG } from "./types";

interface NotebookPageProps {
  content: string;
  config?: Partial<NotebookConfig>;
  pageNumber?: number;
  totalPages?: number;
  isFullscreen?: boolean;
  onConfigChange?: (config: Partial<NotebookConfig>) => void;
  className?: string;
}

export function NotebookPage({
  content,
  config: configOverride,
  pageNumber = 1,
  totalPages = 1,
  isFullscreen = false,
  onConfigChange,
  className,
}: NotebookPageProps) {
  const config = { ...DEFAULT_NOTEBOOK_CONFIG, ...configOverride };
  const handwritingStyle = HANDWRITING_STYLES[config.handwritingStyle];
  const theme = NOTEBOOK_THEMES[config.theme];

  const { startAnimation, getAnimatedText, getAnimationProgress, isAnimating } =
    useHandwritingAnimation({ speed: config.animationSpeed });

  const parsed = useMemo(() => parseNotebookContent(content), [content]);

  // Start animation on mount
  React.useEffect(() => {
    parsed.elements.forEach((el, idx) => {
      setTimeout(() => {
        startAnimation(el.id || `el-${idx}`, el.content);
      }, idx * 300);
    });
  }, [parsed.elements, startAnimation]);

  const renderElement = (el: any, idx: number) => {
    const elId = el.id || `el-${idx}`;
    const animating = isAnimating(elId);
    const progress = getAnimationProgress(elId);
    const animatedText = getAnimatedText(elId, el.content);

    switch (el.type) {
      case "journal-entry":
        return (
          <JournalEntry
            key={elId}
            content={animatedText}
            handwritingStyle={handwritingStyle}
            animationProgress={progress}
            isAnimating={animating}
          />
        );
      case "ledger-account":
      case "t-account":
        return (
          <LedgerAccount
            key={elId}
            content={animatedText}
            handwritingStyle={handwritingStyle}
            animationProgress={progress}
          />
        );
      case "balance-sheet":
        return (
          <BalanceSheet
            key={elId}
            content={animatedText}
            handwritingStyle={handwritingStyle}
            animationProgress={progress}
          />
        );
      case "trial-balance":
        return (
          <TrialBalance
            key={elId}
            content={animatedText}
            handwritingStyle={handwritingStyle}
            animationProgress={progress}
          />
        );
      case "sticky-note":
        return <StickyNote key={elId} content={el.content} />;
      case "teacher-comment":
        return <TeacherComment key={elId} content={el.content} />;
      case "heading":
        return (
          <div
            key={elId}
            className="notebook-line font-bold"
            style={{
              fontFamily: handwritingStyle.fontFamily,
              fontSize: handwritingStyle.fontSize + 4,
              color: handwritingStyle.inkColor,
              letterSpacing: handwritingStyle.letterSpacing,
            }}
          >
            {animatedText}
          </div>
        );
      case "list":
        return (
          <div key={elId} className="notebook-line pl-4">
            <span
              className="notebook-text"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize,
                color: handwritingStyle.inkColor,
                letterSpacing: handwritingStyle.letterSpacing,
              }}
            >
              • {animatedText}
            </span>
          </div>
        );
      case "table":
        return (
          <div key={elId} className="my-2 overflow-x-auto">
            <table className="border-collapse border border-gray-400 w-full text-xs">
              {animatedText.split("\n").map((row: string, ri: number) => (
                <tr key={ri}>
                  {row
                    .split("|")
                    .filter(Boolean)
                    .map((cell: string, ci: number) => (
                      <td
                        key={ci}
                        className="border border-gray-300 px-2 py-0.5"
                        style={{
                          fontFamily: handwritingStyle.fontFamily,
                          fontSize: handwritingStyle.fontSize - 2,
                          color: handwritingStyle.inkColor,
                        }}
                      >
                        {cell.trim()}
                      </td>
                    ))}
                </tr>
              ))}
            </table>
          </div>
        );
      case "diagram":
      case "flowchart":
      case "mindmap":
        return (
          <div
            key={elId}
            className="my-3 p-3 border border-dashed border-gray-400 rounded bg-gray-50/50 text-center"
          >
            <span
              className="text-xs italic text-gray-500"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 2,
              }}
            >
              [{el.type === "diagram" ? "Diagram" : el.type === "flowchart" ? "Flowchart" : "Mind Map"}]
            </span>
            <div
              className="mt-1 whitespace-pre-wrap text-xs"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
                color: handwritingStyle.inkColor,
              }}
            >
              {animatedText}
            </div>
          </div>
        );
      case "formula":
        return (
          <div
            key={elId}
            className="my-2 px-3 py-1.5 bg-yellow-50 border-l-4 border-yellow-400 rounded-r"
          >
            <span
              className="text-xs font-bold text-yellow-800"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize - 1,
              }}
            >
              Formula:
            </span>
            <div
              className="mt-0.5 text-sm font-mono"
              style={{
                fontFamily: handwritingStyle.fontFamily,
                fontSize: handwritingStyle.fontSize,
                color: handwritingStyle.inkColor,
              }}
            >
              {animatedText}
            </div>
          </div>
        );
      default:
        // Regular text
        return (
          <div key={elId} className="notebook-line">
            {animatedText === "" ? (
              <span className="notebook-empty-line">&nbsp;</span>
            ) : (
              <span
                className="notebook-text"
                style={{
                  fontFamily: handwritingStyle.fontFamily,
                  fontSize: handwritingStyle.fontSize,
                  color: handwritingStyle.inkColor,
                  letterSpacing: handwritingStyle.letterSpacing,
                }}
              >
                {animatedText}
              </span>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("notebook-page-wrapper", className)}
      style={{
        maxWidth: isFullscreen ? "100%" : `${config.pageWidth}px`,
      }}
    >
      {/* Ring binder holes */}
      {config.theme !== "plain-white" && config.theme !== "minimal-notebook" && (
        <div className="notebook-holes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="notebook-hole"
              style={{
                background: theme.holeColor,
                borderColor: theme.borderColor,
              }}
            />
          ))}
        </div>
      )}

      {/* Paper */}
      <div
        className="notebook-paper"
        style={{
          background: theme.paperGradient,
          borderColor: theme.borderColor,
          boxShadow: `0 2px 8px ${theme.shadowColor}, 0 8px 24px ${theme.shadowColor}`,
        }}
      >
        {/* Red margin line */}
        {config.showMargins && (
          <div
            className="notebook-margin"
            style={{ background: `linear-gradient(to bottom, ${theme.marginColor}, ${theme.marginColor})` }}
          />
        )}

        {/* Content area with ruled lines */}
        <div
          className="notebook-content"
          style={{
            backgroundImage: config.showRuledLines
              ? `repeating-linear-gradient(to bottom, transparent, transparent 31px, ${theme.ruledLineColor} 31px, ${theme.ruledLineColor} 32px)`
              : "none",
          }}
        >
          {/* Page Number */}
          {totalPages > 1 && (
            <div className="text-center pb-1">
              <span
                className="text-[10px] text-gray-400"
                style={{ fontFamily: handwritingStyle.fontFamily }}
              >
                — Page {pageNumber} of {totalPages} —
              </span>
            </div>
          )}

          {/* Elements */}
          {parsed.elements.length === 0 ? (
            <div className="notebook-line">
              <span className="notebook-empty-line">&nbsp;</span>
            </div>
          ) : (
            parsed.elements.map((el, idx) => renderElement(el, idx))
          )}

          {/* Fill remaining space with empty lines */}
          {parsed.elements.length < 3 &&
            Array.from({ length: 5 - parsed.elements.length }).map((_, i) => (
              <div key={`empty-${i}`} className="notebook-line">
                <span className="notebook-empty-line">&nbsp;</span>
              </div>
            ))}
        </div>
      </div>

      {/* Paper texture overlay */}
      <div className="notebook-texture" />
    </motion.div>
  );
}