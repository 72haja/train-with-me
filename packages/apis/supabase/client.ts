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
    console.log("supabaseUrl", supabaseUrl);
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    console.log("supabaseAnonKey", supabaseAnonKey);

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

/**
 * Database Types (generated from Supabase)
 * In production: npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 */
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string;
                };
            };
            connections: {
                Row: {
                    id: string;
                    trip_id: string;
                    line_number: string;
                    line_type: string;
                    departure_station_id: string;
                    arrival_station_id: string;
                    scheduled_departure: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    trip_id: string;
                    line_number: string;
                    line_type: string;
                    departure_station_id: string;
                    arrival_station_id: string;
                    scheduled_departure: string;
                    created_at?: string;
                };
                Update: {
                    trip_id?: string;
                    line_number?: string;
                    line_type?: string;
                    departure_station_id?: string;
                    arrival_station_id?: string;
                    scheduled_departure?: string;
                };
            };
            user_connections: {
                Row: {
                    id: string;
                    user_id: string;
                    connection_id: string;
                    joined_at: string;
                    left_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    connection_id: string;
                    joined_at?: string;
                    left_at?: string | null;
                };
                Update: {
                    left_at?: string | null;
                };
            };
            friendships: {
                Row: {
                    id: string;
                    user_id: string;
                    friend_id: string;
                    status: "pending" | "accepted" | "blocked";
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    friend_id: string;
                    status?: "pending" | "accepted" | "blocked";
                    created_at?: string;
                };
                Update: {
                    status?: "pending" | "accepted" | "blocked";
                };
            };
        };
    };
};
