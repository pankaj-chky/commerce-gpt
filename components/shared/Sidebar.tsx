"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Search,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import type { ChatSession } from "@/app/page";

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

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 bg-sidebar border-r border-border flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-auto h-[22px]">
                <img
                  src="/Shortlogo.png"
                  alt="Permiz"
                  className="h-[22px] w-auto object-contain dark:invert"
                />
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleTheme}
                  className="h-8 w-8 rounded-lg hover:bg-surface-hover text-muted-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-[15px] h-[15px]" />
                  ) : (
                    <Moon className="w-[15px] h-[15px]" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 rounded-lg hover:bg-surface-hover text-muted-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Close sidebar"
                >
                  <ChevronLeft className="w-[16px] h-[16px]" />
                </Button>
              </div>
            </div>

            <Button
              onClick={onNewChat}
              className="w-full gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl h-9 font-medium text-sm shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              New Inquiry
            </Button>
          </div>

          {/* Search */}
          {sessions.length > 3 && (
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-muted-foreground/30" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-[7px] text-[13px] rounded-xl border border-border bg-surface/50 text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1.5 focus:ring-primary/30 focus:border-primary/30 focus:bg-surface transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Sessions */}
          <nav className="flex-1 overflow-auto px-2 py-1 space-y-0.5 scrollbar-thin">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 border border-border/50">
                  <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
                </div>
                <p className="text-[13px] text-muted-foreground/30 leading-relaxed">
                  {searchQuery
                    ? "No inquiries match your search."
                    : "Begin a new inquiry to get started."}
                </p>
              </div>
            ) : (
              <>
                {filteredSessions.some(
                  (s) => formatDate(s.createdAt) === "Today"
                ) && (
                  <>
                    <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/30">
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
                {filteredSessions.some(
                  (s) => formatDate(s.createdAt) !== "Today"
                ) && (
                  <>
                    <p className="px-3 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/30">
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
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] text-muted-foreground/30 font-medium tracking-wide">
                Permiz v1.0
              </span>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="w-full justify-start gap-2 text-muted-foreground/30 hover:text-destructive text-[12px] h-8 hover:bg-destructive/5 font-medium rounded-lg transition-all"
              >
                <Trash2 className="w-[14px] h-[14px]" />
                Clear All Inquiries
              </Button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
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
    <motion.div
      layout
      className={cn(
        "group flex items-center rounded-xl transition-all duration-150",
        isActive
          ? "bg-primary/8 text-primary border border-primary/15"
          : "hover:bg-surface-hover text-muted-foreground/60 hover:text-foreground/80 border border-transparent"
      )}
    >
      <button
        onClick={() => onSelect(session.id)}
        className="flex-1 flex items-center gap-3 px-3 py-2 text-[13px] text-left min-w-0"
      >
        <Clock className="w-[14px] h-[14px] flex-shrink-0 opacity-40" />
        <span className="truncate font-medium">
          {session.title || "New Inquiry"}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150 mr-1 hover:bg-destructive/8 hover:text-destructive rounded-lg"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        aria-label={`Delete ${session.title}`}
      >
        <Trash2 className="w-[13px] h-[13px]" />
      </Button>
    </motion.div>
  );
}