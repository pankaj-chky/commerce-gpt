/**
 * Analyze PDFs to find actual book titles and rename them in Supabase Storage.
 * Run: node scripts/rename-pdfs-by-title.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ofegckpllkecdcdlpfrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_l29cqlAJIufRK0asFa-Ibw_Y7en8J2i";
const BUCKET = "Commerce GPT";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extractFirstPages(buffer, maxPages = 5) {
  const data = new Uint8Array(buffer);
  let doc;
  try {
    doc = await pdfjs.getDocument({ data }).promise;
    let text = "";
    const pagesToRead = Math.min(doc.numPages, maxPages);
    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  } catch (e) {
    console.error("  PDF extraction error:", e.message);
    return "";
  } finally {
    try { doc?.destroy?.(); } catch {}
    try { doc?.cleanup?.(); } catch {}
  }
}

function extractTitle(text) {
  // Common patterns for book titles in PDFs
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Look for title patterns (usually in first 10 lines)
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    
    // Skip common non-title lines
    if (line.match(/^(page|chapter|fig|table|figure|example|\d+|www|http|isbn|published|edition|revision)/i)) {
      continue;
    }
    
    // Look for capitalized words pattern (likely title)
    if (line.length > 5 && line.length < 200) {
      // Check if it looks like a title (mixed case or all caps)
      const words = line.split(/\s+/);
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w) && w.length > 2);
      
      if (capitalizedWords.length >= 2 || line === line.toUpperCase()) {
        // Clean up the title
        let title = line
          .replace(/[^\w\s\-—,.:;&()]/g, '') // Remove special chars except common title chars
          .replace(/\s+/g, ' ')
          .trim();
        
        if (title.length > 5) {
          return title;
        }
      }
    }
  }
  
  // Fallback: try to find longest meaningful line
  const meaningfulLines = lines
    .filter(l => l.length > 10 && l.length < 150)
    .filter(l => !l.match(/^\d+$/))
    .filter(l => !l.match(/^(page|chapter|fig|table)/i));
  
  if (meaningfulLines.length > 0) {
    return meaningfulLines[0].substring(0, 100);
  }
  
  return null;
}

async function renameFile(oldName, newName) {
  try {
    // Download old file
    const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(oldName);
    if (dlErr || !dlData) {
      console.error(`  ❌ Failed to download: ${dlErr?.message}`);
      return false;
    }

    // Upload with new name
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(newName, dlData, {
      contentType: "application/pdf",
      upsert: true
    });
    if (uploadErr) {
      console.error(`  ❌ Failed to upload new name: ${uploadErr.message}`);
      return false;
    }

    // Delete old file
    const { error: deleteErr } = await supabase.storage.from(BUCKET).remove([oldName]);
    if (deleteErr) {
      console.error(`  ⚠ Failed to delete old file: ${deleteErr.message}`);
      console.log(`  ℹ New file uploaded but old file still exists: ${newName}`);
      return true;
    }

    // Update document_chunks table if it exists
    const { error: updateDbErr } = await supabase
      .from("document_chunks")
      .update({ filename: newName })
      .eq("filename", oldName);
    
    if (updateDbErr) {
      console.log(`  ⚠ Chunks DB update failed: ${updateDbErr.message}`);
    }

    return true;
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("=== PDF Book Title Extractor ===\n");

  // List PDFs
  const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list("", {
    limit: 100
  });

  if (listErr) {
    console.error("❌ Failed to list files:", listErr.message);
    process.exit(1);
  }

  const pdfs = (files || []).filter(f => f.name?.toLowerCase().endsWith(".pdf"));
  console.log(`Found ${pdfs.length} PDF(s)\n`);

  if (pdfs.length === 0) {
    console.log("No PDFs to process.");
    process.exit(0);
  }

  const renames = [];

  for (const pdf of pdfs) {
    console.log(`[${pdfs.indexOf(pdf) + 1}/${pdfs.length}] ${pdf.name}`);
    
    // Download
    const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(pdf.name);
    if (dlErr || !dlData) {
      console.log(`  ❌ Download failed: ${dlErr?.message}\n`);
      continue;
    }

    // Extract title from first pages
    const buffer = Buffer.from(await dlData.arrayBuffer());
    const text = await extractFirstPages(buffer, 5);
    
    if (!text || text.length < 20) {
      console.log(`  ⚠ Insufficient text extracted\n`);
      continue;
    }

    const title = extractTitle(text);
    
    if (!title) {
      console.log(`  ⚠ Could not extract title\n`);
      continue;
    }

    console.log(`  📖 Detected title: "${title}"`);

    // Create safe filename
    const safeTitle = title
      .replace(/[^\w\s\-—,.:;&()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
    
    const newName = `${safeTitle}.pdf`;

    if (newName === pdf.name) {
      console.log(`  ✓ Name already correct\n`);
      continue;
    }

    console.log(`  Renaming to: "${newName}"`);
    
    const success = await renameFile(pdf.name, newName);
    if (success) {
      console.log(`  ✅ Renamed successfully\n`);
      renames.push({ old: pdf.name, new: newName });
    } else {
      console.log(`  ❌ Rename failed\n`);
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total PDFs: ${pdfs.length}`);
  console.log(`Renamed: ${renames.length}`);
  
  if (renames.length > 0) {
    console.log("\nRenamed files:");
    renames.forEach(r => console.log(`  • ${r.old} → ${r.new}`));
  }
  
  console.log("\nDone!");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});