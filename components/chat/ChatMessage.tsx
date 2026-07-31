"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  User,
  Bot,
  Shield,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Pencil,
  X,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotebookSection } from "@/components/notebook/NotebookSection";
import type { ChatMessageData } from "@/app/page";

interface ChatMessageProps {
  message: ChatMessageData;
  onRetry?: (assistantMessageId: string) => void;
  onEdit?: (userMessageId: string, newContent: string) => void;
}

export function ChatMessage({ message, onRetry, onEdit }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [message.content]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.style.height = "auto";
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleEditSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, message.content, message.id, onEdit]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEditSubmit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(message.content);
      }
    },
    [handleEditSubmit, message.content]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry(message.id);
  }, [message.id, onRetry]);

  const renderContent = () => {
    if (isUser) {
      if (isEditing) {
        return (
          <div className="relative">
            <textarea
              ref={editInputRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleEditKeyDown}
              className="w-full min-w-[260px] bg-primary/10 border-none outline-none resize-none text-body leading-relaxed placeholder:text-white/40 text-white rounded-lg p-1"
              rows={1}
            />
            <div className="flex items-center gap-1 mt-2">
              <span className="text-label text-white/50">
                Esc to cancel · Enter to save
              </span>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(message.content);
                }}
                className="inline-flex items-center gap-1 text-label text-white/60 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-all"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={
                  !editValue.trim() || editValue.trim() === message.content
                }
                className="inline-flex items-center gap-1 text-label text-[#39B6B0] hover:text-[#4CCCC6] px-2 py-1 rounded-md hover:bg-white/10 transition-all disabled:opacity-30"
              >
                <CornerDownLeft className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      );
    }

    // For assistant messages, only use notebook for explicit notebook blocks
    const hasNotebookBlocks = /\{\{notebook\}\}([\s\S]*?)\{\{\/notebook\}\}/g.test(
      message.content
    );

    if (hasNotebookBlocks) {
      return renderMixedContent(message.content);
    }

    const hasHighlights = /{{(important|mid|source|section):/.test(
      message.content
    );

    if (hasHighlights) {
      const parts = parseHighlights(message.content);
      return (
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {parts.map((part, idx) => {
            switch (part.type) {
              case "important":
                return (
                  <mark key={idx} className="highlight-important">
                    {part.content}
                  </mark>
                );
              case "mid":
                return (
                  <mark key={idx} className="highlight-mid">
                    {part.content}
                  </mark>
                );
              case "source":
                return (
                  <mark key={idx} className="highlight-source">
                    {part.content}
                  </mark>
                );
              default:
                return <span key={idx}>{part.content}</span>;
            }
          })}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {message.content}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 message-appear",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center order-2 shadow-sm">
          <User className="w-[15px] h-[15px]" />
        </div>
      ) : (
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center order-1",
            message.blocked
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          )}
        >
          {message.blocked ? (
            <Shield className="w-[15px] h-[15px]" />
          ) : (
            <Bot className="w-[15px] h-[15px]" />
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "max-w-[85%] min-w-0",
          isUser ? "order-1" : "order-2"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-label font-semibold text-foreground/60">
            {isUser ? "You" : "Permiz"}
          </span>
          {!isUser && !message.blocked && (
            <span className="flex items-center gap-1 text-[11px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse-soft" />
              AI
            </span>
          )}
          {message.blocked && (
            <span className="flex items-center gap-1 text-[11px] text-destructive bg-destructive/5 px-1.5 py-0.5 rounded-full font-medium">
              <Shield className="w-[11px] h-[11px]" />
              Blocked
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-body leading-relaxed",
            isUser
              ? "bg-primary text-white rounded-tr-md"
              : message.blocked
                ? "bg-destructive/5 border border-destructive/15 rounded-tl-md"
                : "bg-surface border border-border rounded-tl-md shadow-card"
          )}
        >
          {renderContent()}
        </div>

        {/* Assistant actions */}
        {!isUser && message.content && message.content.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-label text-muted-foreground/40 hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface-hover transition-all"
              aria-label="Copy"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-primary" />
                  <span className="text-primary">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1 text-label text-muted-foreground/40 hover:text-accent px-2 py-1 rounded-lg hover:bg-surface-hover transition-all"
              aria-label="Retry"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
            <button
              onClick={() =>
                setFeedback(feedback === "liked" ? null : "liked")
              }
              className={cn(
                "inline-flex items-center gap-1 text-label px-2 py-1 rounded-lg hover:bg-surface-hover transition-all",
                feedback === "liked"
                  ? "text-primary"
                  : "text-muted-foreground/40 hover:text-foreground"
              )}
              aria-label="Like"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                setFeedback(feedback === "disliked" ? null : "disliked")
              }
              className={cn(
                "inline-flex items-center gap-1 text-label px-2 py-1 rounded-lg hover:bg-surface-hover transition-all",
                feedback === "disliked"
                  ? "text-destructive"
                  : "text-muted-foreground/40 hover:text-foreground"
              )}
              aria-label="Dislike"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* User edit action */}
        {isUser && !isEditing && (
          <div className="flex items-center gap-0.5 mt-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => {
                setEditValue(message.content);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1 text-label text-white/50 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Edit"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function parseHighlights(content: string) {
  const parts: Array<{
    type: "text" | "important" | "mid" | "source" | "section";
    content: string;
  }> = [];
  const regex = /\{\{(important|mid|source|section):(.*?)\}\}/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: match[1] as any, content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts;
}

/**
 * Parse content that may contain {{notebook}}...{{/notebook}} blocks
 * intermixed with regular text (which may also have highlight markers).
 * Returns an array of segments: either text (string) or notebook blocks.
 */
type ContentSegment =
  | { type: "text"; content: string }
  | { type: "notebook"; content: string };

function parseNotebookBlocks(raw: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = /\{\{notebook\}\}([\s\S]*?)\{\{\/notebook\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    // Text before this notebook block
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: raw.slice(lastIndex, match.index),
      });
    }
    // The notebook content
    segments.push({
      type: "notebook",
      content: match[1].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last notebook block
  if (lastIndex < raw.length) {
    segments.push({
      type: "text",
      content: raw.slice(lastIndex),
    });
  }

  return segments;
}

function renderMixedContent(raw: string): React.ReactNode {
  const segments = parseNotebookBlocks(raw);
  // If there are multiple segments, we still want the text parts in notebook format too
  // Wrap everything in notebook appearance
  const hasOnlyNotebook = segments.length === 1 && segments[0].type === "notebook";

  if (hasOnlyNotebook) {
    return <NotebookSection content={segments[0].content} />;
  }

  return (
    <div>
      {segments.map((seg, idx) => {
        if (seg.type === "notebook") {
          return <NotebookSection key={idx} content={seg.content} />;
        }
        // Text segments also render in notebook when they contain commerce content
        const isCommerceContent = /(account|journal|ledger|balance|entry|debit|credit|calculate|total|sum|profit|loss|asset|liability|trial|book|entry|₹|Rs\.)/i.test(seg.content);
        
        if (isCommerceContent && seg.content.length > 20) {
          return <NotebookSection key={idx} content={seg.content} />;
        }
        
        const hasHighlights = /\{\{(important|mid|source|section):/.test(
          seg.content
        );
        if (hasHighlights) {
          const parts = parseHighlights(seg.content);
          return (
            <div key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
              {parts.map((part, partIdx) => {
                switch (part.type) {
                  case "important":
                    return (
                      <mark key={partIdx} className="highlight-important">
                        {part.content}
                      </mark>
                    );
                  case "mid":
                    return (
                      <mark key={partIdx} className="highlight-mid">
                        {part.content}
                      </mark>
                    );
                  case "source":
                    return (
                      <mark key={partIdx} className="highlight-source">
                        {part.content}
                      </mark>
                    );
                  default:
                    return <span key={partIdx}>{part.content}</span>;
                }
              })}
            </div>
          );
        }
        return (
          <div key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
            {seg.content}
          </div>
        );
      })}
    </div>
  );
}