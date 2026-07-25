import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, serviceRole };
}

export function getSupabaseServerClient() {
  const { url, serviceRole } = getEnv();
  if (!url || !serviceRole) {
    throw new Error(
      "Supabase server client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!_client) {
    _client = createClient(url, serviceRole, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
