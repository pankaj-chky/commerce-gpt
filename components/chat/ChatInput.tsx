"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Mic, Paperclip, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, disabled, onStop }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 bg-card/80 backdrop-blur-sm border border-border/40 hover:border-emerald-600/25 focus-within:border-emerald-600/50 focus-within:ring-2 focus-within:ring-emerald-600/10 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Attachment button */}
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-secondary/60 transition-all duration-200 disabled:opacity-30"
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Textarea */}
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about accounting, finance, economics..."
            disabled={disabled}
            className="w-full resize-none bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/25 py-0.5 max-h-[200px] focus:ring-0 focus:outline-none disabled:opacity-50 leading-relaxed"
            rows={1}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Voice input */}
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-secondary/60 transition-all duration-200 disabled:opacity-30"
            disabled={disabled}
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send / Stop button */}
          {disabled && onStop ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="w-9 h-9 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all duration-200"
              aria-label="Stop generating"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={disabled || !message.trim()}
              size="icon"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer hint */}
      {!disabled && (
        <p className="text-[10px] text-center text-muted-foreground/20 mt-2.5 select-none font-light tracking-wide">
          Commerce GPT provides professional insights. Verify critical information.
        </p>
      )}
    </form>
  );
}