import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * GET /api/favorites
 * Get all favorite connections for the current user
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get favorites
        const { data, error } = await supabase
            .from("favorite_connections")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching favorites:", error);
            return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
        }

        // Transform snake_case to camelCase
        const favorites = (data || []).map(fav => ({
            id: fav.id,
            userId: fav.user_id,
            originStationId: fav.origin_station_id,
            destinationStationId: fav.destination_station_id,
            originStationName: fav.origin_station_name,
            destinationStationName: fav.destination_station_name,
            createdAt: fav.created_at,
        }));

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Unexpected error in GET /api/favorites:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/favorites
 * Add a favorite connection
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { originStationId, destinationStationId } = body;

        if (!originStationId || !destinationStationId) {
            return NextResponse.json(
                { error: "originStationId and destinationStationId are required" },
                { status: 400 }
            );
        }

        // Fetch station names from the stations API
        let originStationName: string | null = null;
        let destinationStationName: string | null = null;

        try {
            // Use the internal stations API to fetch station names
            const { findStationById } = await import("@apis/mobidata/stations");
            const [originStation, destinationStation] = await Promise.all([
                findStationById(originStationId),
                findStationById(destinationStationId),
            ]);
            originStationName = originStation?.name || null;
            destinationStationName = destinationStation?.name || null;
        } catch (error) {
            console.error("Failed to fetch station names:", error);
            // Continue without station names - they can be updated later
        }

        // Check if favorite already exists
        const { data: existing } = await supabase
            .from("favorite_connections")
            .select("id")
            .eq("user_id", user.id)
            .eq("origin_station_id", originStationId)
            .eq("destination_station_id", destinationStationId)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Favorite already exists" }, { status: 409 });
        }

        // Insert favorite with station names
        const { data, error } = await supabase
            .from("favorite_connections")
            .insert({
                user_id: user.id,
                origin_station_id: originStationId,
                destination_station_id: destinationStationId,
                origin_station_name: originStationName,
                destination_station_name: destinationStationName,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating favorite:", error);
            return NextResponse.json({ error: "Failed to create favorite" }, { status: 500 });
        }

        // Transform snake_case to camelCase
        const favorite = {
            id: data.id,
            userId: data.user_id,
            originStationId: data.origin_station_id,
            destinationStationId: data.destination_station_id,
            originStationName: data.origin_station_name,
            destinationStationName: data.destination_station_name,
            createdAt: data.created_at,
        };

        return NextResponse.json({ favorite }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error in POST /api/favorites:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
