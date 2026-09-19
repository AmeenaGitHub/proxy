  import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the SECRET service-role key, which must
// never be exposed to the browser (no NEXT_PUBLIC_ prefix on it).
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing Supabase settings: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "(in .env.local on your computer, and in Vercel > Settings > Environment Variables)."
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
