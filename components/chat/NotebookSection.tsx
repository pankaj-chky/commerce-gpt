"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NotebookSectionProps {
  content: string;
  className?: string;
}

/**
 * NotebookSection renders accounting/math content in a realistic
 * handwritten notebook page style with lined paper, red margin,
 * ring-binder holes, and a handwriting font.
 */
export function NotebookSection({ content, className }: NotebookSectionProps) {
  // Split content into lines for lined-paper effect
  const lines = content.trim().split("\n");

  return (
    <div className={cn("my-5 flex justify-center", className)}>
      <div className="notebook-page-wrapper w-full max-w-[560px]">
        {/* Ring binder holes */}
        <div className="notebook-holes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="notebook-hole" />
          ))}
        </div>

        {/* Paper */}
        <div className="notebook-paper rounded-tr-lg rounded-br-lg">
          {/* Red margin line */}
          <div className="notebook-margin" />

          {/* Content area with handwriting font */}
          <div className="notebook-content">
            {lines.map((line, i) => (
              <div key={i} className="notebook-line">
                {/* Empty lines render as blank space to maintain lined look */}
                {line === "" ? (
                  <span className="notebook-empty-line">&nbsp;</span>
                ) : (
                  <span className="notebook-text">{line}</span>
                )}
              </div>
            ))}
            {/* Extra blank lines at bottom if only a few lines */}
            {lines.length < 5 &&
              Array.from({ length: 5 - lines.length }).map((_, i) => (
                <div key={`empty-${i}`} className="notebook-line">
                  <span className="notebook-empty-line">&nbsp;</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}