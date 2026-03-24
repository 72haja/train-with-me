import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: connectionId } = await params;

        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse optional metadata from request body
        let metadata: Record<string, string | null> = {};
        try {
            const body = await request.json();
            metadata = {
                origin_station_id: body.originStationId ?? null,
                origin_station_name: body.originStationName ?? null,
                destination_station_id: body.destinationStationId ?? null,
                destination_station_name: body.destinationStationName ?? null,
                departure_time: body.departureTime ?? null,
                arrival_time: body.arrivalTime ?? null,
                line_number: body.lineNumber ?? null,
                line_type: body.lineType ?? null,
                line_color: body.lineColor ?? null,
                line_direction: body.lineDirection ?? null,
                trip_id: body.tripId ?? null,
            };
        } catch {
            // No body or invalid JSON — that's fine, metadata is optional
        }

        const { error } = await supabase.from("user_connections").insert({
            user_id: user.id,
            connection_id: connectionId,
            ...metadata,
        });

        if (error) {
            console.error("Error joining connection:", error);
            return NextResponse.json({ error: "Failed to join connection" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            connectionId,
        });
    } catch (error) {
        console.error("Error joining connection:", error);
        return NextResponse.json({ error: "Failed to join connection" }, { status: 500 });
    }
}
