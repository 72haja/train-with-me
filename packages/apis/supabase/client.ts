/**
 * Supabase Client Configuration
 *
 * This is a conceptual setup for the VVS Together application.
 * In production, this would connect to a real Supabase instance.
 */
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
export const getSupabaseClient = () => {
    // Environment variables (set in .env.local)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
};
