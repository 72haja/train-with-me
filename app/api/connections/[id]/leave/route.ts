import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

async function handleLeave(
    _request: NextRequest,
    params: Promise<{ id: string }>
) {
    const { id: connectionId } = await params;

    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("user_connections")
        .update({ left_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("connection_id", connectionId)
        .is("left_at", null);

    if (error) {
        console.error("Error leaving connection:", error);
        return NextResponse.json(
            { error: "Failed to leave connection" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, connectionId });
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        return await handleLeave(request, context.params);
    } catch (error) {
        console.error("Error leaving connection:", error);
        return NextResponse.json(
            { error: "Failed to leave connection" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        return await handleLeave(request, context.params);
    } catch (error) {
        console.error("Error leaving connection:", error);
        return NextResponse.json(
            { error: "Failed to leave connection" },
            { status: 500 }
        );
    }
}
