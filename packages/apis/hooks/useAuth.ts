/**
 * React Hook: useAuth
 *
 * Custom hook for managing user authentication with Supabase
 */
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@apis/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseAuthResult {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    error: Error | null;
}

export function useAuth(): UseAuthResult {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const supabaseClient = useMemo(() => getSupabaseClient(), []);

    useEffect(() => {
        // Get initial session
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabaseClient]);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Sign in failed"));
            throw err;
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            setError(null);
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            // Profile is automatically created by the database trigger (handle_new_user)
            // The trigger runs with security definer privileges, so it bypasses RLS
            // No manual profile creation needed here
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Sign up failed"));
            throw err;
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Sign out failed"));
            throw err;
        }
    };

    return {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        error,
    };
}
