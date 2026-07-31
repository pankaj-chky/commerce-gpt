"use client";

import React, { useState, useCallback, useRef } from "react";
import { Copy, Check, Download, ChevronDown, FileText, Image as ImageIcon } from "lucide-react";

interface NotebookSectionProps {
  content: string;
  className?: string;
  title?: string;
}

type ContentType = "journal" | "ledger" | "trial-balance" | "balance-sheet" | "calculation" | "text";

function detectContentType(content: string): ContentType {
  const lower = content.toLowerCase();
  if (lower.includes("journal") && (lower.includes("debit") || lower.includes("particulars"))) return "journal";
  if (lower.includes("dr.") && lower.includes("cr.") && lower.includes("account")) return "ledger";
  if (lower.includes("trial balance")) return "trial-balance";
  if (lower.includes("balance sheet") || (lower.includes("assets") && lower.includes("liabilities"))) return "balance-sheet";
  if (/[\d,]+\s*[+\-*/=]\s*[\d,]+/.test(content) || (lower.includes("=") && /\d/.test(content))) return "calculation";
  return "text";
}

function parseJournal(content: string) {
  const lines = content.split("\n").filter(l => l.trim());
  const entries: Array<{
    date?: string;
    particulars: string;
    lf?: string;
    debit?: string;
    credit?: string;
    narration?: string;
    isTotal?: boolean;
  }> = [];
  let current: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (/^date\s+particulars/i.test(trimmed) || /^journal\s+entr/i.test(trimmed)) continue;

    // Total line
    if (/^total/i.test(trimmed) || /^={3,}/.test(trimmed)) {
      const amounts = trimmed.match(/[\d,]+\.?\d*/g);
      if (amounts) {
        current.isTotal = true;
        current.particulars = "Total";
        current.debit = amounts[0] || "";
        current.credit = amounts[1] || "";
        entries.push({ ...current });
        current = {};
      }
      continue;
    }

    // Date line (starts new entry)
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(trimmed) || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      if (current.particulars) {
        entries.push({ ...current });
        current = {};
      }
      // Parse date and particulars from same line
      const dateMatch = trimmed.match(/^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})/);
      current.date = dateMatch ? dateMatch[1] : trimmed;
      const rest = trimmed.slice(dateMatch ? dateMatch[0].length : 0).trim();
      if (rest) current.particulars = rest;
      continue;
    }

    // Narration (in brackets)
    if (/^\(.*\)$/.test(trimmed)) {
      current.narration = trimmed.replace(/^\(|\)$/g, "");
      continue;
    }

    // Amounts
    if (/^[\d,]+\.?\d*$/.test(trimmed)) {
      if (!current.debit) current.debit = trimmed;
      else current.credit = trimmed;
      continue;
    }

    // Particulars with "To" or "By" or "Dr."
    if (/^(to|by|dr\.?|cr\.?)/i.test(trimmed)) {
      if (current.particulars) {
        current.particulars += "\n" + trimmed;
      } else {
        current.particulars = trimmed;
      }
      continue;
    }

    // L.F.
    if (/^\d{1,3}$/.test(trimmed) && !current.lf) {
      current.lf = trimmed;
      continue;
    }

    // Default - add to particulars
    if (current.particulars) {
      current.particulars += "\n" + trimmed;
    } else {
      current.particulars = trimmed;
    }
  }

  if (current.particulars) {
    entries.push({ ...current });
  }

  return entries;
}

function parseLedger(content: string) {
  const lines = content.split("\n").filter(l => l.trim());
  const debitEntries: Array<{ date: string; particulars: string; jf?: string; amount: string }> = [];
  const creditEntries: Array<{ date: string; particulars: string; jf?: string; amount: string }> = [];
  let side: "debit" | "credit" = "debit";
  let title = "Account";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^dr\.?\s/i.test(trimmed) || trimmed === "Dr.") {
      side = "debit";
      const titleMatch = trimmed.match(/dr\.?\s+(.*?)\s+(account|a\/c)\s+cr/i);
      if (titleMatch) title = titleMatch[1];
      continue;
    }
    if (/^cr\.?\s*$/i.test(trimmed) || trimmed === "Cr.") {
      side = "credit";
      continue;
    }

    // Parse entry: date particulars amount
    const dateMatch = trimmed.match(/^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const date = dateMatch[1];
      const rest = trimmed.slice(dateMatch[0].length).trim();
      const amountMatch = rest.match(/([\d,]+\.?\d*)\s*$/);
      const amount = amountMatch ? amountMatch[1] : "";
      const particulars = amountMatch ? rest.slice(0, rest.lastIndexOf(amountMatch[1])).trim() : rest;

      const entry = { date, particulars, amount };
      if (side === "debit") debitEntries.push(entry);
      else creditEntries.push(entry);
    }
  }

  return { title, debitEntries, creditEntries };
}

export function NotebookSection({ content, className, title }: NotebookSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const notebookRef = useRef<HTMLDivElement>(null);

  // Clean content
  const cleanContent = content
    .replace(/\{\{notebook\}\}/g, "")
    .replace(/\{\{\/notebook\}\}/g, "")
    .replace(/\{\{journal\}\}/g, "")
    .replace(/\{\{\/journal\}\}/g, "")
    .replace(/\{\{ledger\}\}/g, "")
    .replace(/\{\{\/ledger\}\}/g, "")
    .replace(/\{\{balancesheet\}\}/g, "")
    .replace(/\{\{\/balancesheet\}\}/g, "")
    .replace(/\{\{trialbalance\}\}/g, "")
    .replace(/\{\{\/trialbalance\}\}/g, "")
    .replace(/\{\{cashbook\}\}/g, "")
    .replace(/\{\{\/cashbook\}\}/g, "")
    .replace(/\{\{formula\}\}/g, "")
    .replace(/\{\{\/formula\}\}/g, "")
    .replace(/\{\{diagram\}\}/g, "")
    .replace(/\{\{\/diagram\}\}/g, "")
    .replace(/\{\{mindmap\}\}/g, "")
    .replace(/\{\{\/mindmap\}\}/g, "")
    .replace(/\{\{flowchart\}\}/g, "")
    .replace(/\{\{\/flowchart\}\}/g, "")
    .replace(/\{\{graph\}\}/g, "")
    .replace(/\{\{\/graph\}\}/g, "")
    .trim();

  const contentType = detectContentType(cleanContent);

  // Copy
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [cleanContent]);

  // Download PNG
  const handleDownloadPNG = useCallback(async () => {
    if (!notebookRef.current) return;
    setIsExporting(true);
    setShowDownloadMenu(false);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(notebookRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#fefef9" });
      const link = document.createElement("a");
      link.download = `${title || "notebook"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { console.error("PNG export error:", e); }
    finally { setIsExporting(false); }
  }, [title]);

  // Download JPG
  const handleDownloadJPG = useCallback(async () => {
    if (!notebookRef.current) return;
    setIsExporting(true);
    setShowDownloadMenu(false);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(notebookRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#fefef9" });
      const link = document.createElement("a");
      link.download = `${title || "notebook"}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (e) { console.error("JPG export error:", e); }
    finally { setIsExporting(false); }
  }, [title]);

  // Download PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!notebookRef.current) return;
    setIsExporting(true);
    setShowDownloadMenu(false);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(notebookRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#fefef9" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`${title || "notebook"}.pdf`);
    } catch (e) { console.error("PDF export error:", e); }
    finally { setIsExporting(false); }
  }, [title]);

  // Render journal entry table
  const renderJournal = () => {
    const entries = parseJournal(cleanContent);
    return (
      <div style={{ fontFamily: "'Caveat', cursive", color: "#1a1a2e" }}>
        <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "18px", fontWeight: 700, textDecoration: "underline" }}>
          Journal Entries
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333", borderTop: "2px solid #333" }}>
              <th style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center", width: "12%" }}>Date</th>
              <th style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "left", width: "45%" }}>Particulars</th>
              <th style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center", width: "8%" }}>L.F.</th>
              <th style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "right", width: "17.5%" }}>Debit (Rs.)</th>
              <th style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "right", width: "17.5%" }}>Credit (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <React.Fragment key={idx}>
                <tr style={{ borderBottom: entry.isTotal ? "2px solid #333" : "1px solid #ccc" }}>
                  <td style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center" }}>{entry.date || ""}</td>
                  <td style={{ border: "1px solid #555", padding: "4px 8px", whiteSpace: "pre-wrap", fontWeight: entry.isTotal ? 700 : 400 }}>
                    {entry.particulars}
                  </td>
                  <td style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center" }}>{entry.lf || ""}</td>
                  <td style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "right", fontWeight: entry.isTotal ? 700 : 400 }}>{entry.debit || ""}</td>
                  <td style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "right", fontWeight: entry.isTotal ? 700 : 400 }}>{entry.credit || ""}</td>
                </tr>
                {entry.narration && (
                  <tr>
                    <td style={{ border: "1px solid #555", padding: "2px 8px" }}></td>
                    <td style={{ border: "1px solid #555", padding: "2px 8px", fontStyle: "italic", fontSize: "13px", color: "#666" }}>
                      ({entry.narration})
                    </td>
                    <td style={{ border: "1px solid #555" }}></td>
                    <td style={{ border: "1px solid #555" }}></td>
                    <td style={{ border: "1px solid #555" }}></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render ledger T-account
  const renderLedger = () => {
    const { title: acctTitle, debitEntries, creditEntries } = parseLedger(cleanContent);
    const maxRows = Math.max(debitEntries.length, creditEntries.length, 1);
    return (
      <div style={{ fontFamily: "'Caveat', cursive", color: "#1a1a2e" }}>
        <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "18px", fontWeight: 700, textDecoration: "underline" }}>
          {acctTitle} Account
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333", borderTop: "2px solid #333" }}>
              <th colSpan={4} style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center", width: "50%" }}>Dr.</th>
              <th colSpan={4} style={{ border: "1px solid #555", padding: "4px 8px", textAlign: "center", width: "50%" }}>Cr.</th>
            </tr>
            <tr style={{ borderBottom: "1px solid #555" }}>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "center", fontSize: "13px" }}>Date</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "left", fontSize: "13px" }}>Particulars</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "center", fontSize: "13px" }}>J.F.</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "right", fontSize: "13px" }}>Amount</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "center", fontSize: "13px" }}>Date</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "left", fontSize: "13px" }}>Particulars</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "center", fontSize: "13px" }}>J.F.</th>
              <th style={{ border: "1px solid #555", padding: "2px 6px", textAlign: "right", fontSize: "13px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }).map((_, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "center" }}>{debitEntries[idx]?.date || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px" }}>{debitEntries[idx]?.particulars || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "center" }}>{debitEntries[idx]?.jf || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "right" }}>{debitEntries[idx]?.amount || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "center" }}>{creditEntries[idx]?.date || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px" }}>{creditEntries[idx]?.particulars || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "center" }}>{creditEntries[idx]?.jf || ""}</td>
                <td style={{ border: "1px solid #555", padding: "3px 6px", textAlign: "right" }}>{creditEntries[idx]?.amount || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render calculation
  const renderCalculation = () => {
    const lines = cleanContent.split("\n");
    return (
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "20px", color: "#1a1a2e", lineHeight: "34px", whiteSpace: "pre-wrap" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: "34px", lineHeight: "34px" }}>
            {line || "\u00A0"}
          </div>
        ))}
      </div>
    );
  };

  // Render text content
  const renderText = () => {
    const lines = cleanContent.split("\n");
    return (
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "20px", color: "#1a1a2e", lineHeight: "32px", whiteSpace: "pre-wrap" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: "32px", lineHeight: "32px" }}>
            {line || "\u00A0"}
          </div>
        ))}
      </div>
    );
  };

  // Render content based on type
  const renderNotebookContent = () => {
    switch (contentType) {
      case "journal": return renderJournal();
      case "ledger": return renderLedger();
      case "calculation": return renderCalculation();
      default: return renderText();
    }
  };

  return (
    <div className={`notebook-section relative w-full my-4 ${className || ""}`}>
      {/* Simple toolbar: Copy + Download */}
      <div className="flex items-center justify-end gap-1 mb-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDownloadMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
              <div className="absolute top-full right-0 mt-1 p-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl min-w-[140px] z-50">
                <button onClick={handleDownloadPDF} disabled={isExporting} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={handleDownloadPNG} disabled={isExporting} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50">
                  <ImageIcon className="w-3.5 h-3.5" /> PNG Image
                </button>
                <button onClick={handleDownloadJPG} disabled={isExporting} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50">
                  <ImageIcon className="w-3.5 h-3.5" /> JPG Image
                </button>
              </div>
            </>
          )}
        </div>

        {isExporting && <span className="text-xs text-blue-500 animate-pulse">Exporting...</span>}
      </div>

      {/* Notebook page - bigger and wider */}
      <div className="flex justify-center">
        <div ref={notebookRef} className="relative w-full" style={{ maxWidth: "900px" }}>
          {/* Ring holes */}
          <div style={{ position: "absolute", left: "4px", top: "20px", bottom: "20px", display: "flex", flexDirection: "column", justifyContent: "space-evenly", width: "16px", zIndex: 2 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#e0e0e0", border: "2px solid #bbb", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.15)" }} />
            ))}
          </div>

          {/* Paper */}
          <div style={{
            background: "linear-gradient(135deg, #fefef9 0%, #fdfcf5 50%, #fefef8 100%)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)",
            marginLeft: "24px",
            padding: "24px 24px 24px 52px",
            minHeight: "200px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Red margin line */}
            <div style={{ position: "absolute", left: "42px", top: 0, bottom: 0, width: "1px", background: "rgba(220,80,80,0.4)" }} />

            {/* Ruled lines - only for text/calculation, not for tables */}
            {(contentType === "text" || contentType === "calculation") && (
              <div style={{
                position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
                backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(120,160,200,0.18) 31px, rgba(120,160,200,0.18) 32px)",
                backgroundSize: "100% 32px", pointerEvents: "none",
              }} />
            )}

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {renderNotebookContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}