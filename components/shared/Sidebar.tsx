"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Search,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Github,
  Crown,
} from "lucide-react";
import type { ChatSession } from "@/app/page";
import { useState } from "react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  collapsed: boolean;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onToggle: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  onToggle,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (collapsed) {
    return (
      <div className="w-0 overflow-hidden transition-all duration-300" />
    );
  }

  return (
    <aside className="w-72 border-r border-border/30 bg-background/95 backdrop-blur-xl flex flex-col flex-shrink-0 sidebar-slide">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-b from-emerald-600/[0.04] to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600/15 to-emerald-700/8 flex items-center justify-center shadow-sm luxury-border">
              <Crown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <span className="font-semibold text-sm text-foreground/80 font-serif tracking-wide">
              Commerce GPT
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="w-8 h-8 text-muted-foreground/40 hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-8 h-8 text-muted-foreground/40 hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] font-medium"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Inquiry
        </Button>
      </div>

      {/* Search */}
      {sessions.length > 3 && (
        <div className="px-3 pt-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/25 group-focus-within:text-emerald-600/50 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/30 bg-card/50 text-foreground/70 placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600/30 focus:bg-card/80 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Session List */}
      <nav className="flex-1 overflow-auto p-2 space-y-0.5 scrollbar-thin">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 border border-border/20">
              <MessageSquare className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground/30 leading-relaxed font-light">
              {searchQuery
                ? "No inquiries match your search."
                : "Begin a new inquiry to get started."}
            </p>
          </div>
        ) : (
          <>
            {filteredSessions.filter(
              (s) => formatDate(s.createdAt) === "Today"
            ).length > 0 && (
              <>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/25">
                  Today
                </p>
                {filteredSessions
                  .filter((s) => formatDate(s.createdAt) === "Today")
                  .map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onSelect={onSelectSession}
                      onDelete={onDeleteSession}
                    />
                  ))}
              </>
            )}
            {filteredSessions.filter(
              (s) => formatDate(s.createdAt) !== "Today"
            ).length > 0 && (
              <>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/25 pt-3">
                  Earlier
                </p>
                {filteredSessions
                  .filter((s) => formatDate(s.createdAt) !== "Today")
                  .map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onSelect={onSelectSession}
                      onDelete={onDeleteSession}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/30 bg-gradient-to-b from-transparent to-emerald-600/[0.02]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground/25 tracking-wider font-medium">
            Commerce GPT v1.0
          </span>
          <a
            href="https://github.com/pankaj-chky/commerce-gpt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/25 hover:text-muted-foreground/40 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="w-full justify-start gap-2 text-muted-foreground/30 hover:text-destructive text-xs mt-2 h-8 hover:bg-destructive/5 font-medium transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Inquiries
          </Button>
        )}
      </div>
    </aside>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-xl transition-all duration-200",
        isActive
          ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-600/20"
          : "hover:bg-secondary/40 text-muted-foreground/55 hover:text-foreground/70 border border-transparent hover:border-border/20"
      )}
    >
      <button
        onClick={() => onSelect(session.id)}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 text-xs text-left min-w-0"
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-30" />
        <span className="truncate font-medium">
          {session.title || "New Inquiry"}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 mr-1 hover:bg-destructive/8 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        aria-label={`Delete ${session.title}`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
