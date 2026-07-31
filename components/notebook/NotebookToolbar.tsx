"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Edit3,
  Copy,
  Download,
  Printer,
  Share2,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lightbulb,
  Pen,
  Palette,
  FileText,
  Image,
  Table,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import type { HandwritingStyle, NotebookTheme, ZoomLevel } from "./types";
import { HANDWRITING_STYLES, NOTEBOOK_THEMES } from "./types";

interface NotebookToolbarProps {
  onCopy?: () => void;
  onDownloadPDF?: () => void;
  onDownloadPNG?: () => void;
  onDownloadDOCX?: () => void;
  onDownloadExcel?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onRegenerate?: () => void;
  onExplain?: () => void;
  onFullscreen?: () => void;
  onZoomChange?: (zoom: ZoomLevel) => void;
  onHandwritingChange?: (style: HandwritingStyle) => void;
  onThemeChange?: (theme: NotebookTheme) => void;
  currentZoom?: ZoomLevel;
  currentHandwriting?: HandwritingStyle;
  currentTheme?: NotebookTheme;
  isFullscreen?: boolean;
  isBookmarked?: boolean;
  className?: string;
}

export function NotebookToolbar({
  onCopy,
  onDownloadPDF,
  onDownloadPNG,
  onDownloadDOCX,
  onDownloadExcel,
  onPrint,
  onShare,
  onBookmark,
  onRegenerate,
  onExplain,
  onFullscreen,
  onZoomChange,
  onHandwritingChange,
  onThemeChange,
  currentZoom = "100%",
  currentHandwriting = "cbse-neat",
  currentTheme = "school-notebook",
  isFullscreen = false,
  isBookmarked = false,
  className,
}: NotebookToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const [showHandwritingPicker, setShowHandwritingPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showZoomPicker, setShowZoomPicker] = useState(false);

  const zoomLevels: ZoomLevel[] = ["100%", "125%", "150%", "200%", "fit-width", "fit-height"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-2xl",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
        "border border-gray-200/50 dark:border-gray-700/50",
        "shadow-lg shadow-black/5",
        className
      )}
    >
      {/* Primary Actions */}
      <ToolbarButton icon={Edit3} label="Edit" onClick={() => {}} />
      <ToolbarButton icon={Copy} label="Copy" onClick={onCopy} />
      
      {/* Download Dropdown */}
      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Download"
          onClick={() => setShowMore(!showMore)}
        />
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute top-full left-0 mt-1 p-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl min-w-[160px] z-50"
            >
              <DropdownItem icon={FileText} label="PDF" onClick={onDownloadPDF} />
              <DropdownItem icon={Image} label="PNG" onClick={onDownloadPNG} />
              <DropdownItem icon={FileText} label="DOCX" onClick={onDownloadDOCX} />
              <DropdownItem icon={Table} label="Excel" onClick={onDownloadExcel} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Print & Share */}
      <ToolbarButton icon={Printer} label="Print" onClick={onPrint} />
      <ToolbarButton icon={Share2} label="Share" onClick={onShare} />
      <ToolbarButton
        icon={Bookmark}
        label="Bookmark"
        onClick={onBookmark}
        active={isBookmarked}
      />

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Handwriting Style Picker */}
      <div className="relative">
        <ToolbarButton
          icon={Pen}
          label="Handwriting"
          onClick={() => setShowHandwritingPicker(!showHandwritingPicker)}
        />
        <AnimatePresence>
          {showHandwritingPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute top-full left-0 mt-1 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl min-w-[200px] z-50"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Handwriting Style
              </div>
              {(Object.entries(HANDWRITING_STYLES) as [HandwritingStyle, typeof HANDWRITING_STYLES[HandwritingStyle]][]).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => {
                    onHandwritingChange?.(key);
                    setShowHandwritingPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                    currentHandwriting === key
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="font-medium" style={{ fontFamily: style.fontFamily }}>
                    {style.label}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {style.description}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme Picker */}
      <div className="relative">
        <ToolbarButton
          icon={Palette}
          label="Theme"
          onClick={() => setShowThemePicker(!showThemePicker)}
        />
        <AnimatePresence>
          {showThemePicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute top-full left-0 mt-1 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl min-w-[200px] z-50"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Notebook Theme
              </div>
              {(Object.entries(NOTEBOOK_THEMES) as [NotebookTheme, typeof NOTEBOOK_THEMES[NotebookTheme]][]).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange?.(key);
                    setShowThemePicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                    currentTheme === key
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="font-medium">{theme.label}</div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Zoom Controls */}
      <div className="relative">
        <ToolbarButton
          icon={ZoomIn}
          label={currentZoom}
          onClick={() => setShowZoomPicker(!showZoomPicker)}
        />
        <AnimatePresence>
          {showZoomPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute top-full left-0 mt-1 p-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl min-w-[120px] z-50"
            >
              {zoomLevels.map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => {
                    onZoomChange?.(zoom);
                    setShowZoomPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded-lg text-xs transition-colors",
                    currentZoom === zoom
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {zoom}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Regenerate & Explain */}
      <ToolbarButton icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
      <ToolbarButton icon={Lightbulb} label="Explain" onClick={onExplain} />

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Fullscreen */}
      <ToolbarButton
        icon={isFullscreen ? Minimize2 : Maximize2}
        label={isFullscreen ? "Exit" : "Fullscreen"}
        onClick={onFullscreen}
      />
    </motion.div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}