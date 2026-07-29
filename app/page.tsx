"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/shared/Sidebar";
import { CanvasBackground } from "@/components/shared/Background";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";
import {
  PanelLeft,
  Plus,
  BookOpen,
  Calculator,
  Landmark,
  Scale,
  TrendingUp,
  ArrowRight,
  Bot,
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
const THEME_KEY = "commerce-gpt:theme";

const DOMAINS = [
  "Accounting",
  "Finance",
  "Economics",
  "Taxation",
  "Business Law",
];

const SUGGESTIONS = [
  {
    text: "Explain double-entry bookkeeping",
    icon: BookOpen,
    color: "border-primary/15 hover:border-primary/40",
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
  },
  {
    text: "What is NPV in finance?",
    icon: TrendingUp,
    color: "border-primary/15 hover:border-primary/40",
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
  },
  {
    text: "Difference between tax avoidance and evasion",
    icon: Scale,
    color: "border-accent/15 hover:border-accent/40",
    iconBg: "bg-accent/8",
    iconColor: "text-accent",
  },
  {
    text: "What is GST in India?",
    icon: Landmark,
    color: "border-accent/15 hover:border-accent/40",
    iconBg: "bg-accent/8",
    iconColor: "text-accent",
  },
  {
    text: "Calculate compound interest for ₹50,000 at 8% for 3 years",
    icon: Calculator,
    color: "border-primary/15 hover:border-primary/40",
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
  },
  {
    text: "What are the 5 major principles of accounting?",
    icon: BookOpen,
    color: "border-primary/15 hover:border-primary/40",
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
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
  if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
  else localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export default function HomePage() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessageData[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    setSidebarCollapsed(collapsed !== "false");
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
      const targetId =
        activeId && savedSessions.find((s) => s.id === activeId)
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
    newChat();
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages } : s
      );
      const session = updated.find((s) => s.id === activeSessionId);
      if (session && session.title === "New Inquiry" && messages.length > 0) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) session.title = firstUserMsg.content.slice(0, 50);
      }
      saveSessions(updated);
      return updated;
    });
  }, [messages, activeSessionId]);

  const switchSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        setActiveSessionId(id);
        setMessages(session.messages);
        saveActiveSessionId(id);
      }
    },
    [sessions]
  );

  const newChat = useCallback(() => {
    const newId = createId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Inquiry",
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

  const deleteSession = useCallback(
    (id: string) => {
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
              title: "New Inquiry",
              createdAt: Date.now(),
              messages: [],
            };
            setActiveSessionId(newId);
            setMessages([]);
            saveSessions([newSession]);
            saveActiveSessionId(newId);
            return [newSession];
          }
        }
        return updated;
      });
    },
    [activeSessionId]
  );

  const clearAllSessions = useCallback(() => {
    const newId = createId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Inquiry",
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
          body: JSON.stringify({ message: content, history: historySnapshot }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant",
              content: data.response ?? "OK",
              blocked: data.blocked,
            },
          ]);
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
            assistantContent += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "My apologies — an error occurred. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const handleRetry = useCallback(
    async (assistantMessageId: string) => {
      const currentMessages = messagesRef.current;
      const assistantIndex = currentMessages.findIndex(
        (m) => m.id === assistantMessageId
      );
      if (assistantIndex === -1) return;

      let userMessageIndex = -1;
      for (let i = assistantIndex - 1; i >= 0; i--) {
        if (currentMessages[i].role === "user") {
          userMessageIndex = i;
          break;
        }
      }
      if (userMessageIndex === -1) return;

      const userContent = currentMessages[userMessageIndex].content;
      const historyPrefix = currentMessages.slice(0, userMessageIndex);
      setMessages(currentMessages.slice(0, userMessageIndex + 1));
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userContent, history: historyPrefix }),
        });
        if (!response.ok) throw new Error("Failed to get response");

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.response ?? "OK",
              blocked: data.blocked,
            },
          ]);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";
        const msg: ChatMessageData = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "",
        };
        setMessages((prev) => [...prev, msg]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, content } : m))
            );
          }
        }
      } catch (err) {
        console.error("Retry error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: "My apologies — an error occurred. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleEditMessage = useCallback(
    async (userMessageId: string, newContent: string) => {
      const currentMessages = messagesRef.current;
      const userIndex = currentMessages.findIndex(
        (m) => m.id === userMessageId
      );
      if (userIndex === -1) return;
      const historyPrefix = currentMessages.slice(0, userIndex);

      setMessages((prev) =>
        prev.slice(0, userIndex).concat({ ...prev[userIndex], content: newContent })
      );
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newContent, history: historyPrefix }),
        });
        if (!response.ok) throw new Error("Failed");

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data: { blocked?: boolean; response?: string } =
            await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.response ?? "OK",
            },
          ]);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";
        const msg: ChatMessageData = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "",
        };
        setMessages((prev) => [...prev, msg]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, content } : m))
            );
          }
        }
      } catch (err) {
        console.error("Edit error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: "My apologies — an error occurred. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Subtle chart background */}
      <CanvasBackground />

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
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6 py-3 bg-background/80 backdrop-blur-lg border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0 h-9 w-9 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-[18px] h-[18px]" />
          </Button>

          {/* Logo + Tagline */}
          <div className="flex items-center gap-3">
            <img
              src="/Shortlogo.png"
              alt="Permiz"
              className="h-[22px] w-auto object-contain dark:invert"
            />
            <div className="hidden sm:block">
              <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/50 font-medium select-none">
                INTELLIGENCE &bull; PRECISION &bull; EXCELLENCE
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={newChat}
                className="text-xs gap-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover transition-all font-medium rounded-xl h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-auto px-4 md:px-6 py-6 scrollbar-thin"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center max-w-3xl mx-auto px-4">
              {/* Hero Logo */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10"
              >
                <div className="w-56 sm:w-64 mx-auto">
                  <img
                    src="/Long logo.png"
                    alt="Permiz"
                    className="w-full h-auto object-contain dark:invert"
                  />
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-caption text-muted-foreground mb-6 font-medium tracking-widest uppercase"
              >
                Your intelligent commerce assistant for
              </motion.p>

              {/* Domain Pills */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-wrap items-center justify-center gap-2 mb-12"
              >
                {DOMAINS.map((domain, i) => (
                  <span
                    key={domain}
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-caption font-medium bg-surface border border-border hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 cursor-default ${
                      i % 2 === 0 ? "text-primary" : "text-accent"
                    }`}
                  >
                    {domain}
                  </span>
                ))}
              </motion.div>

              {/* Suggestion Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-10"
              >
                {SUGGESTIONS.map((suggestion, idx) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.button
                      key={suggestion.text}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.35 + idx * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      onClick={() => handleSendMessage(suggestion.text)}
                      className={`group flex items-center gap-3 text-left text-caption px-4 py-3.5 rounded-2xl border bg-surface shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer ${suggestion.color}`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl ${suggestion.iconBg} flex items-center justify-center`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${suggestion.iconColor}`} />
                      </div>
                      <span className="flex-1 leading-snug text-foreground/80 group-hover:text-foreground">
                        {suggestion.text}
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                    </motion.button>
                  );
                })}
              </motion.div>
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
              {isLoading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-start gap-3 px-4 py-3 message-appear">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md bg-surface border border-border shadow-card">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent px-4 lg:px-6 pb-5 pt-2">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}