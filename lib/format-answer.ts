/**
 * Parses AI responses and applies highlight formatting:
 * - {{important:text}} → pink highlight (most important)
 * - {{mid:text}} → lime/light green highlight
 * - {{source:text}} → yellow highlight
 * - {{section:text}} → section header
 */

export interface FormattedSegment {
  type: "text" | "important" | "mid" | "source" | "section";
  content: string;
}

const HIGHLIGHT_PATTERN = /\{\{(important|mid|source|section):(.*?)\}\}/gs;

export function formatAnswer(raw: string): FormattedSegment[] {
  const segments: FormattedSegment[] = [];
  let lastIndex = 0;

  let match;
  while ((match = HIGHLIGHT_PATTERN.exec(raw)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: raw.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: match[1] as FormattedSegment["type"],
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < raw.length) {
    segments.push({
      type: "text",
      content: raw.slice(lastIndex),
    });
  }

  return segments;
}

export function renderFormattedAnswer(segments: FormattedSegment[]): string {
  return segments
    .map((seg) => {
      switch (seg.type) {
        case "important":
          return `<mark class="highlight-important">${escapeHtml(seg.content)}</mark>`;
        case "mid":
          return `<mark class="highlight-mid">${escapeHtml(seg.content)}</mark>`;
        case "source":
          return `<mark class="highlight-source">${escapeHtml(seg.content)}</mark>`;
        case "section":
          return `<div class="section-header">${escapeHtml(seg.content)}</div>`;
        default:
          return escapeHtml(seg.content);
      }
    })
    .join("");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}