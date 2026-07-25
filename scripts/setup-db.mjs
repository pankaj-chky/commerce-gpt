/**
 * Supabase Database Setup - Creates the document_chunks table.
 * 
 * This script will attempt to connect directly to your Supabase PostgreSQL database
 * and create the document_chunks table.
 * 
 * Prerequisites:
 *   1. Set DATABASE_URL in your .env file:
 *      - Go to https://supabase.com/dashboard/project/ofegckpllkecdcdlpfrk/settings/database
 *      - Scroll to "Connection string" → Select "URI"
 *      - Copy the full URI and paste as DATABASE_URL in .env
 *      - IMPORTANT: Replace [YOUR-PASSWORD] with the actual database password shown there
 * 
 *   2. Or, run the SQL manually (faster):
 *      a. Open https://supabase.com/dashboard/project/ofegckpllkecdcdlpfrk/sql/new
 *      b. Paste the SQL below
 *      c. Click "Run"
 * 
 * Run: node scripts/setup-db.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

// Try direct pg connection if available
let pool = null;
try {
  const { Pool } = await import("pg");
  if (DATABASE_URL && DATABASE_URL !== "postgresql://postgres:postgres@localhost:5432/commerce_gpt?schema=public") {
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
} catch {
  // pg not installed or misconfigured
}

async function main() {
  console.log("=== Commerce GPT: Supabase Database Setup ===\n");

  const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "001_document_chunks.sql");
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Attempt 1: Direct pg connection
  if (pool) {
    console.log("Attempting direct PostgreSQL connection...");
    try {
      await pool.query(sql);
      console.log("✅ Table created successfully via pg connection!");
      await pool.end();
      return;
    } catch (e) {
      console.log(`❌ pg connection failed: ${e.message}\n`);
      try { await pool.end(); } catch {}
    }
  }

  // Attempt 2: Node-postgres not available or failed
  console.log("=".repeat(60));
  console.log("MANUAL SETUP (fastest option)");
  console.log("=".repeat(60));
  console.log("\n1. Open: https://supabase.com/dashboard/project/ofegckpllkecdcdlpfrk/sql/new\n");
  console.log("2. Paste the entire SQL below and click Run:\n");
  console.log("--- COPY FROM HERE ---\n");
  console.log("-- Create the document_chunks table for storing PDF chunks\n");
  console.log("CREATE TABLE document_chunks (");
  console.log("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),");
  console.log("  content TEXT NOT NULL,");
  console.log("  filename TEXT NOT NULL,");
  console.log("  bucket TEXT,");
  console.log("  chunk_index INTEGER DEFAULT 0,");
  console.log("  created_at TIMESTAMPTZ DEFAULT now()");
  console.log(");\n");
  console.log("ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;\n");
  console.log("CREATE POLICY \"service_role_all\"");
  console.log("  ON document_chunks");
  console.log("  FOR ALL");
  console.log("  TO service_role");
  console.log("  USING (true)");
  console.log("  WITH CHECK (true);");
  console.log("\n--- COPY TO HERE ---\n");
  console.log("3. After the SQL runs successfully, restart your dev server.\n");
  console.log("=".repeat(60));
  console.log("\nALTERNATIVE: Set DATABASE_URL in .env for automatic setup:");
  console.log("  1. Go to https://supabase.com/dashboard/project/ofegckpllkecdcdlpfrk/settings/database");
  console.log("  2. Copy the Connection String (URI format)");
  console.log("  3. Paste as DATABASE_URL in your .env file");
  console.log("  4. Re-run: node scripts/setup-db.mjs\n");
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});