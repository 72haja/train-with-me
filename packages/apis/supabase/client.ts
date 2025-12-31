/**
 * Supabase Client Configuration
 *
 * This client is used in browser/client components.
 * It uses createBrowserClient from @supabase/ssr to read cookies
 * set by server actions, ensuring the client and server share the same session.
 * Additionally, it syncs sessions to localStorage to persist them
 * even when cookies are cleared.
 */
import { createBrowserClient } from "@supabase/ssr";

// Create Supabase client for browser/client-side usage
// This client automatically reads from cookies (set by server actions)
// and syncs with localStorage for offline support
export const getSupabaseClient = () => {
    // Environment variables (set in .env.local)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // Sync session to localStorage for persistence when cookies are cleared
    if (typeof window !== "undefined") {
        // Listen for auth state changes and sync to localStorage
        client.auth.onAuthStateChange((_event, session) => {
            if (session) {
                // Store session in localStorage as backup
                try {
                    localStorage.setItem(
                        "sb-session-backup",
                        JSON.stringify({
                            access_token: session.access_token,
                            refresh_token: session.refresh_token,
                            expires_at: session.expires_at,
                        })
                    );
                } catch (error) {
                    console.error("Failed to backup session to localStorage:", error);
                }
            } else {
                // Clear backup when logged out
                try {
                    localStorage.removeItem("sb-session-backup");
                } catch (error) {
                    console.error("Failed to clear session backup:", error);
                }
            }
        });

        // On initialization, check if cookies are missing but localStorage has a session
        // This allows recovery when cookies are cleared
        client.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // No session from cookies, check localStorage
                try {
                    const backup = localStorage.getItem("sb-session-backup");
                    if (backup) {
                        const sessionData = JSON.parse(backup);
                        // Restore session from localStorage
                        client.auth.setSession({
                            access_token: sessionData.access_token,
                            refresh_token: sessionData.refresh_token,
                        });
                    }
                } catch (error) {
                    console.error("Failed to restore session from localStorage:", error);
                }
            }
        });
    }

    return client;
};
