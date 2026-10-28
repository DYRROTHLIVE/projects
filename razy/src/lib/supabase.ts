import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/** Returns the Supabase client configured with the public, RLS-governed key. */
export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured. Set the SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables.");
  }

  client = createClient(url, publishableKey);
  return client;
}
