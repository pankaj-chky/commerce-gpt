/**
 * Content parser for notebook blocks
 * Parses AI-generated content into structured notebook elements
 */

export type NotebookElementType =
  | "journal-entry"
  | "ledger-account"
  | "cash-book"
  | "trial-balance"
  | "balance-sheet"
  | "table"
  | "text"
  | "heading"
  | "list"
  | "diagram"
  | "formula"
  | "mindmap"
  | "flowchart"
  | "graph"
  | "sticky-note"
  | "teacher-comment";

export interface NotebookElement {
  id: string;
  type: NotebookElementType;
  content: string;
  metadata?: Record<string, any>;
}

export interface ParsedNotebookContent {
  elements: NotebookElement[];
  title?: string;
  date?: string;
  subject?: string;
}

let elementCounter = 0;

function nextId(): string {
  return `notebook-el-${++elementCounter}`;
}

/**
 * Parse raw notebook content into structured elements
 */
export function parseNotebookContent(raw: string): ParsedNotebookContent {
  const elements: NotebookElement[] = [];
  const lines = raw.split("\n");
  let currentType: NotebookElementType = "text";
  let currentContent: string[] = [];

  function flushCurrent() {
    if (currentContent.length > 0) {
      elements.push({
        id: nextId(),
        type: currentType,
        content: currentContent.join("\n"),
      });
      currentContent = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect element types from markers
    if (trimmed.startsWith("{{journal}}")) {
      flushCurrent();
      currentType = "journal-entry";
      continue;
    }
    if (trimmed.startsWith("{{/journal}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{ledger}}")) {
      flushCurrent();
      currentType = "ledger-account";
      continue;
    }
    if (trimmed.startsWith("{{/ledger}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{cashbook}}")) {
      flushCurrent();
      currentType = "cash-book";
      continue;
    }
    if (trimmed.startsWith("{{/cashbook}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{trialbalance}}")) {
      flushCurrent();
      currentType = "trial-balance";
      continue;
    }
    if (trimmed.startsWith("{{/trialbalance}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{balancesheet}}")) {
      flushCurrent();
      currentType = "balance-sheet";
      continue;
    }
    if (trimmed.startsWith("{{/balancesheet}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{diagram}}")) {
      flushCurrent();
      currentType = "diagram";
      continue;
    }
    if (trimmed.startsWith("{{/diagram}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{mindmap}}")) {
      flushCurrent();
      currentType = "mindmap";
      continue;
    }
    if (trimmed.startsWith("{{/mindmap}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{flowchart}}")) {
      flushCurrent();
      currentType = "flowchart";
      continue;
    }
    if (trimmed.startsWith("{{/flowchart}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{graph}}")) {
      flushCurrent();
      currentType = "graph";
      continue;
    }
    if (trimmed.startsWith("{{/graph}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{formula}}")) {
      flushCurrent();
      currentType = "formula";
      continue;
    }
    if (trimmed.startsWith("{{/formula}}")) {
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("{{sticky:")) {
      flushCurrent();
      currentType = "sticky-note";
      const match = trimmed.match(/{{sticky:(.*?)}}(.*?){{\/sticky}}/);
      if (match) {
        currentContent.push(match[2]);
        flushCurrent();
        currentType = "text";
        continue;
      }
    }
    if (trimmed.startsWith("{{teacher:")) {
      flushCurrent();
      currentType = "teacher-comment";
      const match = trimmed.match(/{{teacher:(.*?)}}(.*?){{\/teacher}}/);
      if (match) {
        currentContent.push(match[2]);
        flushCurrent();
        currentType = "text";
        continue;
      }
    }
    if (trimmed.startsWith("## ")) {
      flushCurrent();
      currentType = "heading";
      currentContent.push(trimmed.slice(3));
      flushCurrent();
      currentType = "text";
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (currentType !== "list") {
        flushCurrent();
        currentType = "list";
      }
      currentContent.push(trimmed.slice(2));
      continue;
    }
    if (trimmed.startsWith("|")) {
      if (currentType !== "table") {
        flushCurrent();
        currentType = "table";
      }
      currentContent.push(trimmed);
      continue;
    }

    // If we encounter a non-table line after table started, flush table
    if (currentType === "table" && !trimmed.startsWith("|") && trimmed !== "") {
      flushCurrent();
      currentType = "text";
    }

    currentContent.push(line);
  }

  flushCurrent();
  return { elements };
}

/**
 * Detect if content contains accounting-specific formatting
 */
export function detectAccountingType(content: string): NotebookElementType | null {
  const lower = content.toLowerCase();
  if (lower.includes("journal") || lower.includes("journal entry")) return "journal-entry";
  if (lower.includes("ledger") || lower.includes("t-account") || lower.includes("t account")) return "ledger-account";
  if (lower.includes("cash book") || lower.includes("cashbook")) return "cash-book";
  if (lower.includes("trial balance")) return "trial-balance";
  if (lower.includes("balance sheet")) return "balance-sheet";
  return null;
}

/**
 * Format a journal entry into structured data
 */
export function parseJournalEntry(content: string): {
  date?: string;
  particulars: string;
  lf?: string;
  debit?: string;
  credit?: string;
  narration?: string;
}[] {
  const entries: any[] = [];
  const lines = content.split("\n").filter((l) => l.trim());

  let currentEntry: any = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(trimmed)) {
      if (currentEntry.particulars) {
        entries.push(currentEntry);
      }
      currentEntry = { date: trimmed };
    } else if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      currentEntry.narration = trimmed;
    } else if (trimmed.match(/^\d+[,.\d]*$/)) {
      if (!currentEntry.debit) currentEntry.debit = trimmed;
      else currentEntry.credit = trimmed;
    } else if (trimmed.match(/^(To|By|Dr\.?|Cr\.?)/i)) {
      currentEntry.particulars = trimmed;
    } else if (trimmed && !currentEntry.particulars) {
      currentEntry.particulars = trimmed;
    } else if (trimmed) {
      currentEntry.particulars = (currentEntry.particulars || "") + " " + trimmed;
    }
  }
  if (currentEntry.particulars) {
    entries.push(currentEntry);
  }
  return entries;
}