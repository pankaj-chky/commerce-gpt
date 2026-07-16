"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { MessageSquare, PanelLeft } from "lucide-react";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessageData[];
}

const STORAGE_KEY = "commerce-gpt:sessions";
const ACTIVE_SESSION_KEY = "commerce-gpt:activeSessionId";
const SIDEBAR_COLLAPSED_KEY = "commerce-gpt:sidebarCollapsed";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<ChatSession[]>(localStorage.getItem(STORAGE_KEY)) ?? [];
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function loadActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

function saveActiveSessionId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export default function HomePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sidebar collapse state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setSidebarCollapsed(collapsed === "true");
    }
  }, []);

  // Save sidebar collapse state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // Load sessions on mount
  useEffect(() => {
    const savedSessions = loadSessions();
    const activeId = loadActiveSessionId();

    if (savedSessions.length > 0) {
      setSessions(savedSessions);
      const targetId = activeId && savedSessions.find((s) => s.id === activeId)
        ? activeId
        : savedSessions[0].id;
      const targetSession = savedSessions.find((s) => s.id === targetId);
      if (targetSession) {
        setActiveSessionId(targetId);
        setMessages(targetSession.messages);
        saveActiveSessionId(targetId);
        return;
      }
    }

    // No sessions — create one
    const newId = createId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    };
    setSessions([newSession]);
    setActiveSessionId(newId);
    saveSessions([newSession]);
    saveActiveSessionId(newId);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist current session messages
  useEffect(() => {
    if (!activeSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages } : s
      );
      // Update title from first user message
      const session = updated.find((s) => s.id === activeSessionId);
      if (session && session.title === "New Chat" && messages.length > 0) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) {
          session.title = firstUserMsg.content.slice(0, 50);
        }
      }
      saveSessions(updated);
      return updated;
    });
  }, [messages, activeSessionId]);

  const switchSession = useCallback((id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      saveActiveSessionId(id);
    }
  }, [sessions]);

  const newChat = useCallback(() => {
    const newId = createId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(newId);
    setMessages([]);
    saveActiveSessionId(newId);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      if (id === activeSessionId) {
        if (updated.length > 0) {
          const next = updated[0];
          setActiveSessionId(next.id);
          setMessages(next.messages);
          saveActiveSessionId(next.id);
        } else {
          const newId = createId();
          const newSession: ChatSession = {
            id: newId,
            title: "New Chat",
            createdAt: Date.now(),
            messages: [],
          };
          saveSessions([newSession]);
          setActiveSessionId(newId);
          setMessages([]);
          saveActiveSessionId(newId);
          return [newSession];
        }
      }
      return updated;
    });
  }, [activeSessionId]);

  const clearAllSessions = useCallback(() => {
    const newId = createId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    };
    setSessions([newSession]);
    setActiveSessionId(newId);
    setMessages([]);
    saveSessions([newSession]);
    saveActiveSessionId(newId);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const historySnapshot = messages;

      const userMessage: ChatMessageData = {
        id: Date.now().toString(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history: historySnapshot,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const contentType = response.headers.get("content-type") || "";

        // Blocked / non-streaming branch
        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();

          const assistantMessage: ChatMessageData = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response ?? "OK",
            blocked: data.blocked,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          return;
        }

        // Streaming branch
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        const assistantMessage: ChatMessageData = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            assistantContent += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessageData = {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={sidebarCollapsed}
        onSelectSession={switchSession}
        onNewChat={newChat}
        onDeleteSession={deleteSession}
        onClearAll={clearAllSessions}
        onToggle={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold truncate">Commerce GPT</h1>
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-auto px-4 py-6"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Commerce GPT
              </h2>
              <p className="max-w-md text-balance leading-relaxed">
                Ask me anything about accounting, finance, economics, taxation, or business law.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-8 max-w-lg w-full">
                {[
                  "Explain double-entry bookkeeping",
                  "What is NPV in finance?",
                  "Difference between tax avoidance and evasion",
                  "What is GST in India?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-left text-sm px-4 py-3 rounded-xl border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 px-4 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}