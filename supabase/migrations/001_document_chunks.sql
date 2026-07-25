-- Create document_chunks table for full-text search on ingested PDFs
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ofegckpllkecdcdlpfrk/sql

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  filename TEXT NOT NULL,
  bucket TEXT,
  chunk_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable full-text search via trigram (pg_trgm) for LIKE/ILIKE and similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for trigram-based text search on content
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_trgm
  ON document_chunks USING GIN (content gin_trgm_ops);

-- Also add a tsvector column for full-text search with stemming
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS tsv TSVECTOR;

-- Populate tsv from content (english dictionary)
UPDATE document_chunks SET tsv = to_tsvector('english', content);

-- Trigger to auto-update tsv on insert/update
CREATE OR REPLACE FUNCTION document_chunks_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_chunks_tsv ON document_chunks;
CREATE TRIGGER trg_document_chunks_tsv
  BEFORE INSERT OR UPDATE ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION document_chunks_tsv_trigger();

-- GIN index on tsv for @@ (tsquery) searches
CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv
  ON document_chunks USING GIN (tsv);

-- Index on filename for source tracking
CREATE INDEX IF NOT EXISTS idx_document_chunks_filename
  ON document_chunks (filename);

-- Enable Row Level Security (RLS)
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: service_role can do everything (used server-side)
CREATE POLICY "service_role_all"
  ON document_chunks
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);