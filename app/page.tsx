"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/shared/Sidebar";
import { BackgroundParticles } from "@/components/shared/Background";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";
import {
  PanelLeft,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calculator,
  Landmark,
  Scale,
  TrendingUp,
  Bot,
  Crown,
  Gem,
} from "lucide-react";

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

const SUGGESTIONS = [
  {
    text: "Explain double-entry bookkeeping",
    icon: BookOpen,
    color: "from-emerald-600/8 to-emerald-700/4 border-emerald-600/15",
    iconBg: "from-emerald-600/15 to-emerald-700/10",
    iconColor: "text-emerald-600",
  },
  {
    text: "What is NPV in finance?",
    icon: TrendingUp,
    color: "from-emerald-600/8 to-emerald-700/4 border-emerald-600/15",
    iconBg: "from-emerald-600/15 to-emerald-700/10",
    iconColor: "text-emerald-600",
  },
  {
    text: "Difference between tax avoidance and evasion",
    icon: Scale,
    color: "from-amber-500/8 to-amber-600/4 border-amber-500/15",
    iconBg: "from-amber-500/15 to-amber-600/10",
    iconColor: "text-amber-600",
  },
  {
    text: "What is GST in India?",
    icon: Landmark,
    color: "from-amber-500/8 to-amber-600/4 border-amber-500/15",
    iconBg: "from-amber-500/15 to-amber-600/10",
    iconColor: "text-amber-600",
  },
  {
    text: "Calculate compound interest for ₹50,000 at 8% for 3 years",
    icon: Calculator,
    color: "from-emerald-600/8 to-emerald-700/4 border-emerald-600/15",
    iconBg: "from-emerald-600/15 to-emerald-700/10",
    iconColor: "text-emerald-600",
  },
  {
    text: "What are the 5 major principles of accounting?",
    icon: BookOpen,
    color: "from-emerald-600/8 to-emerald-700/4 border-emerald-600/15",
    iconBg: "from-emerald-600/15 to-emerald-700/10",
    iconColor: "text-emerald-600",
  },
];

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
  const { theme, toggleTheme } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessageData[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setSidebarCollapsed(collapsed === "true");
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

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

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!activeSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages } : s
      );
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

      const assistantMsgId = (Date.now() + 2).toString();
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

        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          const assistantMessage: ChatMessageData = {
            id: assistantMsgId,
            role: "assistant",
            content: data.response ?? "OK",
            blocked: data.blocked,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        const assistantMessage: ChatMessageData = {
          id: assistantMsgId,
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
          id: assistantMsgId,
          role: "assistant",
          content: "My apologies — an error occurred. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const handleRetry = useCallback(
    async (assistantMessageId: string) => {
      const currentMessages = messagesRef.current;
      console.log("[Retry] Called with assistantId:", assistantMessageId);
      console.log("[Retry] Current messages:", currentMessages.map(m => `${m.id.slice(-4)} (${m.role})`));

      const assistantIndex = currentMessages.findIndex(
        (m) => m.id === assistantMessageId
      );
      console.log("[Retry] Assistant index:", assistantIndex);
      if (assistantIndex === -1) {
        console.warn("[Retry] Assistant message not found!");
        return;
      }

      let userMessageIndex = -1;
      for (let i = assistantIndex - 1; i >= 0; i--) {
        if (currentMessages[i].role === "user") {
          userMessageIndex = i;
          break;
        }
      }
      console.log("[Retry] User message index:", userMessageIndex);
      if (userMessageIndex === -1) {
        console.warn("[Retry] No preceding user message found!");
        return;
      }

      const userContent = currentMessages[userMessageIndex].content;
      const historyPrefix = currentMessages.slice(0, userMessageIndex);

      console.log("[Retry] User content:", userContent.slice(0, 50) + "...");
      console.log("[Retry] History prefix length:", historyPrefix.length);

      // Keep the user message visible, strip everything after it
      setMessages(currentMessages.slice(0, userMessageIndex + 1));
      setIsLoading(true);

      try {
        console.log("[Retry] Sending fetch...");
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userContent,
            history: historyPrefix,
          }),
        });

        console.log("[Retry] Response status:", response.status);

        if (!response.ok) throw new Error("Failed to get response");

        const contentType = response.headers.get("content-type") || "";
        console.log("[Retry] Content-Type:", contentType);

        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          console.log("[Retry] JSON response received");
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response ?? "OK",
            blocked: data.blocked,
          }]);
          return;
        }

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
          console.log("[Retry] Streaming response started");
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
          console.log("[Retry] Streaming complete, length:", assistantContent.length);
        }
      } catch (error) {
        console.error("[Retry] Error:", error);
        setMessages((prev) => [...prev, {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: "My apologies — an error occurred. Please try again.",
        }]);
      } finally {
        setIsLoading(false);
      }
    },
    [] // No dependency on messages — use ref instead
  );

  const handleEditMessage = useCallback(
    async (userMessageId: string, newContent: string) => {
      const currentMessages = messagesRef.current;
      const userIndex = currentMessages.findIndex((m) => m.id === userMessageId);
      if (userIndex === -1) return;

      const historyPrefix = currentMessages.slice(0, userIndex);

      setMessages((prev) => {
        const updated = prev.slice(0, userIndex).concat({
          ...prev[userIndex],
          content: newContent,
        });
        return updated;
      });

      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: newContent,
            history: historyPrefix,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response ?? "OK",
            blocked: data.blocked,
          }]);
          return;
        }

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
        console.error("Edit error:", error);
        setMessages((prev) => [...prev, {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: "My apologies — an error occurred. Please try again.",
        }]);
      } finally {
        setIsLoading(false);
      }
    },
    [] // No dependency on messages — use ref instead
  );

  return (
    <div className="flex h-screen bg-background">
      <BackgroundParticles />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={sidebarCollapsed}
        onSelectSession={switchSession}
        onNewChat={newChat}
        onDeleteSession={deleteSession}
        onClearAll={clearAllSessions}
        onToggle={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 bg-rolex-radial pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rolex-glow pointer-events-none" />

        {/* Header */}
        <header className="relative flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-background/95 backdrop-blur-xl z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600/15 to-emerald-700/8 flex items-center justify-center shadow-sm luxury-border">
              <Crown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground/90 font-serif tracking-wide">
                Commerce GPT
              </h1>
              <p className="text-[10px] text-muted-foreground/50 tracking-[0.15em] uppercase font-medium">
                Intelligence &bull; Precision &bull; Excellence
              </p>
            </div>
          </div>
          <div className="flex-1" />
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={newChat}
              className="text-xs gap-1.5 text-muted-foreground/60 hover:text-emerald-700 dark:hover:text-emerald-400 border border-border/40 hover:border-emerald-600/30 transition-all duration-200 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Inquiry
            </Button>
          )}
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-auto px-4 md:px-6 py-6 relative z-0 scrollbar-thin"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              {/* Logo */}
              <div className="relative mb-10">
                <div
                  className="w-28 h-28 rounded-3xl luxury-border flex items-center justify-center shadow-elegant"
                  style={{
                    background: 'linear-gradient(135deg, hsl(160 50% 15%), hsl(160 40% 10%))',
                  }}
                >
                  <Gem className="w-14 h-14 text-emerald-200/90" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-amber-500/90 flex items-center justify-center shadow-gold">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-5xl font-bold mb-4 tracking-tight font-serif">
                <span className="text-gradient">Commerce GPT</span>
              </h2>
              <p className="text-sm text-muted-foreground/60 max-w-md leading-relaxed mb-12 font-light tracking-wide">
                An elite intelligence for accounting, finance, economics,
                taxation, and business law. Precision-crafted for the
                discerning professional.
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={suggestion.text}
                      onClick={() => handleSendMessage(suggestion.text)}
                      className={`suggestion-btn group flex items-center gap-3 text-left text-xs px-4 py-3.5 rounded-xl border border-border/30 hover:border-emerald-600/25 transition-all duration-300 text-muted-foreground/65 hover:text-foreground ${suggestion.color} bg-card/40 hover:bg-card/70 shadow-sm hover:shadow-elegant`}
                    >
                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${suggestion.iconBg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${suggestion.iconColor}`} />
                      </div>
                      <span className="flex-1 leading-snug font-medium">
                        {suggestion.text}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-600/50" />
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mt-10 mb-4 w-full max-w-md">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-600/15 to-transparent" />
                <span className="text-[10px] text-muted-foreground/30 font-medium uppercase tracking-[0.2em]">
                  Or Compose Your Inquiry
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-600/15 to-transparent" />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-1">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRetry={handleRetry}
                  onEdit={handleEditMessage}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3 px-4 py-4 message-appear">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600/15 via-emerald-600/10 to-amber-500/10 flex items-center justify-center shadow-sm luxury-border">
                    <Bot className="w-4.5 h-4.5 text-emerald-600/70" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md bg-card/70 border border-border/30 shadow-sm">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative border-t border-border/30 bg-background/95 backdrop-blur-xl z-10">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}