"use client";

import { useState, useCallback } from "react";
import { User, Bot, Shield, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageData } from "@/app/page";

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [message.content]);

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-3 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
          isUser
            ? "bg-primary text-primary-foreground order-2"
            : message.blocked
              ? "bg-yellow-500/10 text-yellow-600 order-1"
              : "bg-primary/10 text-primary order-1"
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
          "max-w-[75%] min-w-0",
          isUser ? "order-1" : "order-2"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? "You" : "Commerce GPT"}
          </span>
          {message.blocked && (
            <span className="text-[10px] text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-full font-medium">
              Blocked
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : message.blocked
                ? "bg-yellow-500/5 border border-yellow-500/20"
                : "bg-muted"
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && message.content && message.content.length > 0 && (
          <button
            onClick={copyToClipboard}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Copy message"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}