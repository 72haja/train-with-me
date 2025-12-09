/**
 * Supabase Client Configuration
 *
 * This client is used in browser/client components.
 * It uses createBrowserClient from @supabase/ssr to read cookies
 * set by server actions, ensuring the client and server share the same session.
 */
import { createBrowserClient } from "@supabase/ssr";

// Create Supabase client for browser/client-side usage
// This client automatically reads from cookies (set by server actions)
// and syncs with localStorage for offline support
export const getSupabaseClient = () => {
    // Environment variables (set in .env.local)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
