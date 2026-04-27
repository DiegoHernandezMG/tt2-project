import { createClient } from "@supabase/supabase-js";

const adminSupabaseUrl = import.meta.env.VITE_ADMIN_SUPABASE_URL;
export const adminSupabaseAnonKey = import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY;

export const adminSupabase = createClient(
  adminSupabaseUrl,
  adminSupabaseAnonKey,
  {
    auth: {
      storageKey: "serenamente-admin-auth",
    },
  },
);
