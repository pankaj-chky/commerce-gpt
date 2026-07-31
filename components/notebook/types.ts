export type HandwritingStyle =
  | "cbse-neat"
  | "student"
  | "teacher"
  | "calligraphy"
  | "pencil"
  | "gel-pen"
  | "ball-pen";

export type NotebookTheme =
  | "school-notebook"
  | "accounting-register"
  | "plain-white"
  | "graph-paper"
  | "engineering-notebook"
  | "vintage-notebook"
  | "premium-leather"
  | "minimal-notebook";

export type ZoomLevel = "100%" | "125%" | "150%" | "200%" | "fit-width" | "fit-height";

export interface NotebookPage {
  id: string;
  pageNumber: number;
  content: string;
  elements: NotebookElement[];
  annotations: Annotation[];
  stickyNotes: StickyNote[];
  teacherComments: TeacherComment[];
}

export interface NotebookElement {
  id: string;
  type: NotebookElementType;
  content: string;
  metadata?: Record<string, any>;
  animationProgress?: number;
}

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
  | "teacher-comment"
  | "t-account";

export interface Annotation {
  id: string;
  type: "highlight" | "underline" | "note" | "drawing";
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
}

export interface StickyNote {
  id: string;
  color: "yellow" | "blue" | "red" | "green" | "pink";
  content: string;
  x: number;
  y: number;
  type: "rule" | "formula" | "mistake" | "tip";
}

export interface TeacherComment {
  id: string;
  type: "correct" | "wrong" | "board-favourite" | "remember" | "tip";
  content: string;
  x: number;
  y: number;
}

export interface NotebookConfig {
  handwritingStyle: HandwritingStyle;
  theme: NotebookTheme;
  zoom: ZoomLevel;
  showLineNumbers: boolean;
  showMargins: boolean;
  showRuledLines: boolean;
  pageWidth: number;
  pageHeight: number;
  fontSize: number;
  inkColor: string;
  animationSpeed: "slow" | "normal" | "fast";
}

export const DEFAULT_NOTEBOOK_CONFIG: NotebookConfig = {
  handwritingStyle: "cbse-neat",
  theme: "school-notebook",
  zoom: "100%",
  showLineNumbers: false,
  showMargins: true,
  showRuledLines: true,
  pageWidth: 560,
  pageHeight: 800,
  fontSize: 19,
  inkColor: "#1a1a2e",
  animationSpeed: "normal",
};

export const HANDWRITING_STYLES: Record<HandwritingStyle, {
  fontFamily: string;
  label: string;
  description: string;
  inkColor: string;
  fontSize: number;
  letterSpacing: string;
}> = {
  "cbse-neat": {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    label: "CBSE Neat",
    description: "Clean, legible handwriting like a CBSE topper",
    inkColor: "#1a1a2e",
    fontSize: 19,
    letterSpacing: "0.02em",
  },
  "student": {
    fontFamily: "'Patrick Hand', 'Caveat', cursive",
    label: "Student",
    description: "Natural student handwriting with slight variations",
    inkColor: "#2d2d44",
    fontSize: 18,
    letterSpacing: "0.01em",
  },
  "teacher": {
    fontFamily: "'Gloria Hallelujah', 'Caveat', cursive",
    label: "Teacher",
    description: "Bold, clear teacher-style handwriting",
    inkColor: "#1a3a5c",
    fontSize: 20,
    letterSpacing: "0.03em",
  },
  "calligraphy": {
    fontFamily: "'Dancing Script', 'Caveat', cursive",
    label: "Calligraphy",
    description: "Elegant calligraphic handwriting",
    inkColor: "#2c1810",
    fontSize: 21,
    letterSpacing: "0.05em",
  },
  "pencil": {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    label: "Pencil",
    description: "Light pencil-like handwriting",
    inkColor: "#555555",
    fontSize: 18,
    letterSpacing: "0.02em",
  },
  "gel-pen": {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    label: "Gel Pen",
    description: "Smooth gel pen handwriting with darker ink",
    inkColor: "#0a0a1a",
    fontSize: 19,
    letterSpacing: "0.02em",
  },
  "ball-pen": {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    label: "Ball Pen",
    description: "Standard ball pen handwriting",
    inkColor: "#1a1a4e",
    fontSize: 18,
    letterSpacing: "0.015em",
  },
};

export const NOTEBOOK_THEMES: Record<NotebookTheme, {
  label: string;
  paperColor: string;
  paperGradient: string;
  ruledLineColor: string;
  marginColor: string;
  borderColor: string;
  shadowColor: string;
  holeColor: string;
  darkPaperColor: string;
  darkPaperGradient: string;
  darkRuledLineColor: string;
  darkMarginColor: string;
  darkBorderColor: string;
  darkShadowColor: string;
  darkHoleColor: string;
  texture?: string;
}> = {
  "school-notebook": {
    label: "School Notebook",
    paperColor: "#fefef9",
    paperGradient: "linear-gradient(135deg, #fefef9 0%, #fdfcf5 25%, #fefef8 50%, #fcfbf4 75%, #fdfdf7 100%)",
    ruledLineColor: "rgba(120, 160, 200, 0.18)",
    marginColor: "rgba(220, 80, 80, 0.4)",
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "rgba(0,0,0,0.06)",
    holeColor: "#fefef9",
    darkPaperColor: "#f6f4e8",
    darkPaperGradient: "linear-gradient(135deg, #f6f4e8 0%, #f4f2e5 25%, #f7f5ea 50%, #f3f1e3 75%, #f5f3e7 100%)",
    darkRuledLineColor: "rgba(100, 140, 180, 0.25)",
    darkMarginColor: "rgba(200, 70, 70, 0.5)",
    darkBorderColor: "rgba(0,0,0,0.12)",
    darkShadowColor: "rgba(0,0,0,0.2)",
    darkHoleColor: "#f6f4e8",
  },
  "accounting-register": {
    label: "Accounting Register",
    paperColor: "#fcfcf7",
    paperGradient: "linear-gradient(135deg, #fcfcf7 0%, #fbfaf4 25%, #fcfbf6 50%, #faf9f3 75%, #fbfaf5 100%)",
    ruledLineColor: "rgba(80, 160, 80, 0.15)",
    marginColor: "rgba(200, 60, 60, 0.35)",
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "rgba(0,0,0,0.08)",
    holeColor: "#fcfcf7",
    darkPaperColor: "#f0efe4",
    darkPaperGradient: "linear-gradient(135deg, #f0efe4 0%, #eeede1 25%, #f1f0e5 50%, #edecdf 75%, #efeee3 100%)",
    darkRuledLineColor: "rgba(60, 140, 60, 0.2)",
    darkMarginColor: "rgba(180, 50, 50, 0.45)",
    darkBorderColor: "rgba(0,0,0,0.15)",
    darkShadowColor: "rgba(0,0,0,0.25)",
    darkHoleColor: "#f0efe4",
  },
  "plain-white": {
    label: "Plain White Paper",
    paperColor: "#ffffff",
    paperGradient: "linear-gradient(135deg, #ffffff 0%, #fefefe 25%, #ffffff 50%, #fefefe 75%, #ffffff 100%)",
    ruledLineColor: "transparent",
    marginColor: "transparent",
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "rgba(0,0,0,0.04)",
    holeColor: "#ffffff",
    darkPaperColor: "#f8f8f8",
    darkPaperGradient: "linear-gradient(135deg, #f8f8f8 0%, #f7f7f7 25%, #f8f8f8 50%, #f7f7f7 75%, #f8f8f8 100%)",
    darkRuledLineColor: "transparent",
    darkMarginColor: "transparent",
    darkBorderColor: "rgba(0,0,0,0.08)",
    darkShadowColor: "rgba(0,0,0,0.1)",
    darkHoleColor: "#f8f8f8",
  },
  "graph-paper": {
    label: "Graph Paper",
    paperColor: "#fafafa",
    paperGradient: "linear-gradient(135deg, #fafafa 0%, #f9f9f9 25%, #fafafa 50%, #f9f9f9 75%, #fafafa 100%)",
    ruledLineColor: "rgba(100, 180, 255, 0.2)",
    marginColor: "rgba(255, 100, 100, 0.3)",
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "rgba(0,0,0,0.04)",
    holeColor: "#fafafa",
    darkPaperColor: "#f0f0f0",
    darkPaperGradient: "linear-gradient(135deg, #f0f0f0 0%, #efefef 25%, #f0f0f0 50%, #efefef 75%, #f0f0f0 100%)",
    darkRuledLineColor: "rgba(80, 160, 240, 0.25)",
    darkMarginColor: "rgba(240, 80, 80, 0.4)",
    darkBorderColor: "rgba(0,0,0,0.08)",
    darkShadowColor: "rgba(0,0,0,0.12)",
    darkHoleColor: "#f0f0f0",
  },
  "engineering-notebook": {
    label: "Engineering Notebook",
    paperColor: "#fcfcf5",
    paperGradient: "linear-gradient(135deg, #fcfcf5 0%, #fbfbf3 25%, #fcfcf4 50%, #fafaf2 75%, #fbfbf3 100%)",
    ruledLineColor: "rgba(60, 120, 200, 0.12)",
    marginColor: "rgba(200, 60, 60, 0.3)",
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "rgba(0,0,0,0.06)",
    holeColor: "#fcfcf5",
    darkPaperColor: "#f0efe2",
    darkPaperGradient: "linear-gradient(135deg, #f0efe2 0%, #efede0 25%, #f0efe2 50%, #eeecdf 75%, #efede0 100%)",
    darkRuledLineColor: "rgba(40, 100, 180, 0.18)",
    darkMarginColor: "rgba(180, 50, 50, 0.4)",
    darkBorderColor: "rgba(0,0,0,0.12)",
    darkShadowColor: "rgba(0,0,0,0.18)",
    darkHoleColor: "#f0efe2",
  },
  "vintage-notebook": {
    label: "Vintage Notebook",
    paperColor: "#f5f0e0",
    paperGradient: "linear-gradient(135deg, #f5f0e0 0%, #f3edd8 25%, #f6f1e2 50%, #f2ecd5 75%, #f4efe0 100%)",
    ruledLineColor: "rgba(140, 100, 60, 0.15)",
    marginColor: "rgba(180, 60, 40, 0.3)",
    borderColor: "rgba(100, 70, 40, 0.12)",
    shadowColor: "rgba(100, 70, 40, 0.08)",
    holeColor: "#f5f0e0",
    darkPaperColor: "#e8e3d0",
    darkPaperGradient: "linear-gradient(135deg, #e8e3d0 0%, #e6e1cc 25%, #e9e4d2 50%, #e5dfc9 75%, #e7e2cf 100%)",
    darkRuledLineColor: "rgba(120, 80, 40, 0.2)",
    darkMarginColor: "rgba(160, 50, 30, 0.4)",
    darkBorderColor: "rgba(80, 50, 20, 0.15)",
    darkShadowColor: "rgba(0,0,0,0.2)",
    darkHoleColor: "#e8e3d0",
  },
  "premium-leather": {
    label: "Premium Leather Journal",
    paperColor: "#faf3e0",
    paperGradient: "linear-gradient(135deg, #faf3e0 0%, #f8f0d8 25%, #fbf4e2 50%, #f7efd5 75%, #f9f2df 100%)",
    ruledLineColor: "rgba(160, 120, 60, 0.12)",
    marginColor: "rgba(180, 80, 40, 0.25)",
    borderColor: "rgba(120, 80, 40, 0.15)",
    shadowColor: "rgba(80, 50, 20, 0.1)",
    holeColor: "#faf3e0",
    darkPaperColor: "#ece4cc",
    darkPaperGradient: "linear-gradient(135deg, #ece4cc 0%, #eae1c8 25%, #ede5ce 50%, #e9dfc5 75%, #ebe3cb 100%)",
    darkRuledLineColor: "rgba(140, 100, 40, 0.18)",
    darkMarginColor: "rgba(160, 60, 30, 0.35)",
    darkBorderColor: "rgba(100, 60, 20, 0.18)",
    darkShadowColor: "rgba(0,0,0,0.22)",
    darkHoleColor: "#ece4cc",
  },
  "minimal-notebook": {
    label: "Minimal Notebook",
    paperColor: "#fefefe",
    paperGradient: "linear-gradient(135deg, #fefefe 0%, #fdfdfd 25%, #fefefe 50%, #fdfdfd 75%, #fefefe 100%)",
    ruledLineColor: "rgba(0, 0, 0, 0.06)",
    marginColor: "rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "rgba(0,0,0,0.03)",
    holeColor: "#fefefe",
    darkPaperColor: "#fafafa",
    darkPaperGradient: "linear-gradient(135deg, #fafafa 0%, #f9f9f9 25%, #fafafa 50%, #f9f9f9 75%, #fafafa 100%)",
    darkRuledLineColor: "rgba(0, 0, 0, 0.08)",
    darkMarginColor: "rgba(0, 0, 0, 0.12)",
    darkBorderColor: "rgba(0,0,0,0.06)",
    darkShadowColor: "rgba(0,0,0,0.08)",
    darkHoleColor: "#fafafa",
  },
};