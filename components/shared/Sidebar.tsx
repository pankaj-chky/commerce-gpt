"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  ChevronLeft,
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
}: SidebarProps) {
  if (collapsed) {
    return null;
  }

  return (
    <aside className="w-72 border-r bg-muted/30 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <Button
          onClick={onNewChat}
          className="flex-1 gap-2 justify-start"
          variant="default"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="ml-1 flex-shrink-0"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* Session List */}
      <nav className="flex-1 overflow-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center rounded-lg transition-colors",
                session.id === activeSessionId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <button
                onClick={() => onSelectSession(session.id)}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-left min-w-0"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {session.title || "New Chat"}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                aria-label={`Delete ${session.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </nav>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Conversations
          </Button>
        </div>
      )}
    </aside>
  );
}