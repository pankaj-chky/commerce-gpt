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
  const [isHovered, setIsHovered] = useState(false);
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
    if (onRetry) {
      onRetry(message.id);
    }
  }, [message.id, onRetry]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

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
              className="w-full min-w-[280px] bg-white/20 border-none outline-none resize-none text-sm leading-relaxed placeholder:text-white/40 text-white"
              rows={1}
            />
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-white/50">Esc to cancel &middot; Enter to save</span>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(message.content);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-all"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editValue.trim() || editValue.trim() === message.content}
                className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 px-2 py-1 rounded-md hover:bg-white/10 transition-all disabled:opacity-30"
              >
                <CornerDownLeft className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
        );
      }
      return <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>;
    }

    const hasHighlights = /{{(important|mid|source|section):/.test(message.content);
    
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
              case "section":
                return (
                  <div key={idx} className="section-header">
                    {part.content}
                  </div>
                );
              default:
                return <span key={idx}>{part.content}</span>;
            }
          })}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>;
  };

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-5 group message-appear",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
          isUser
            ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white order-2 shadow-lg shadow-emerald-600/25"
            : message.blocked
              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white order-1 shadow-lg shadow-amber-500/25"
              : "bg-gradient-to-br from-emerald-600/15 via-emerald-600/10 to-amber-500/10 text-emerald-600 order-1 luxury-border shadow-sm"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : message.blocked ? (
          <Shield className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "max-w-[80%] min-w-0",
          isUser ? "order-1" : "order-2"
        )}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground/70 font-serif tracking-wide">
            {isUser ? "You" : "Commerce GPT"}
          </span>
          {!isUser && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600/70 dark:text-emerald-400/70 bg-emerald-600/5 px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1 h-1 rounded-full bg-emerald-600/60 animate-pulse" />
              AI
            </span>
          )}
          {message.blocked && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium">
              <Shield className="w-2.5 h-2.5" />
              Blocked
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-2xl px-5 py-3.5 text-sm leading-relaxed transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white rounded-tr-md shadow-md shadow-emerald-600/15"
              : message.blocked
                ? "bg-gradient-to-br from-amber-500/8 to-amber-500/12 border border-amber-500/20 rounded-tl-md"
                : "bg-card/80 border border-border/40 hover:border-border/70 rounded-tl-md shadow-sm hover:shadow-elegant"
          )}
        >
          {renderContent()}
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && message.content && message.content.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/45 hover:text-muted-foreground px-2 py-1 rounded-md hover:bg-secondary/50 transition-all"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
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
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/45 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded-md hover:bg-secondary/50 transition-all"
              aria-label="Retry message"
              title="Regenerate response"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
            <button
              onClick={() => setFeedback(feedback === "liked" ? null : "liked")}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md hover:bg-secondary/50 transition-all",
                feedback === "liked"
                  ? "text-emerald-600"
                  : "text-muted-foreground/45 hover:text-muted-foreground"
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
                "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md hover:bg-secondary/50 transition-all",
                feedback === "disliked"
                  ? "text-red-500"
                  : "text-muted-foreground/45 hover:text-muted-foreground"
              )}
              aria-label="Dislike"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action buttons for user messages */}
        {isUser && !isEditing && (
          <div className="flex items-center gap-0.5 mt-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => {
                setEditValue(message.content);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-all"
              aria-label="Edit message"
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
  const parts: Array<{ type: "text" | "important" | "mid" | "source" | "section"; content: string }> = [];
  const regex = /\{\{(important|mid|source|section):(.*?)\}\}/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: match[1] as any, content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts;
}