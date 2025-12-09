/**
 * React Hook: useSession
 *
 * Simple hook for reading the current user session from Supabase.
 * Session is managed by Supabase (cookies for SSR, localStorage for client).
 */
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@apis/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseSessionResult {
    user: User | null;
    loading: boolean;
}

export function useSession(): UseSessionResult {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    return {
        user,
        loading,
    };
}
