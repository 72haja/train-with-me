import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { error } = await supabase.from("user_connections").insert({
            user_id: user.id,
            connection_id: connectionId,
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
