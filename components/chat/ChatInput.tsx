"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, Paperclip, CornerDownLeft } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, disabled, onStop }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    haptics.heavy();
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 bg-surface border border-border shadow-input focus-within:shadow-input-focus focus-within:border-primary/40 rounded-full px-4 py-2.5 transition-all duration-200">
        {/* Paperclip */}
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-surface-hover transition-colors"
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip className="w-[17px] h-[17px]" />
        </button>

        {/* Textarea */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about commerce..."
            disabled={disabled}
            className="w-full resize-none bg-transparent border-0 outline-none text-body placeholder:text-muted-foreground/25 py-0.5 max-h-[200px] focus:ring-0 focus:outline-none disabled:opacity-50 font-[425]"
            rows={1}
            aria-label="Message input"
          />
        </div>

        {/* Voice / Send */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {disabled && onStop ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="w-9 h-9 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-sm transition-all duration-150"
              aria-label="Stop generating"
            >
              <CornerDownLeft className="w-[17px] h-[17px]" />
            </Button>
          ) : (
            <>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-surface-hover transition-colors"
                disabled={disabled}
                aria-label="Voice input"
              >
                <Mic className="w-[17px] h-[17px]" />
              </button>
              <Button
                type="submit"
                disabled={disabled || !message.trim()}
                size="icon"
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white shadow-button hover:shadow-button-hover hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="w-[17px] h-[17px] ml-0.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hint */}
      {!disabled && (
        <p className="text-center text-[12px] text-muted-foreground/25 mt-3 select-none font-[425]">
          Permiz provides textbook-backed insights. Verify critical
          information.
        </p>
      )}
    </form>
  );
}