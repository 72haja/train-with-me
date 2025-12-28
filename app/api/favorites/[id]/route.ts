import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * DELETE /api/favorites/[id]
 * Remove a favorite connection
 */
export async function DELETE(
    _request: NextRequest,
    { params }: RouteContext<"/api/favorites/[id]">
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { id } = await params;

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify the favorite belongs to the user
        const { data: favorite, error: fetchError } = await supabase
            .from("favorite_connections")
            .select("user_id")
            .eq("id", id)
            .single();

        if (fetchError || !favorite) {
            return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
        }

        if (favorite.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete favorite
        const { error } = await supabase.from("favorite_connections").delete().eq("id", id);

        if (error) {
            console.error("Error deleting favorite:", error);
            return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unexpected error in DELETE /api/favorites/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
