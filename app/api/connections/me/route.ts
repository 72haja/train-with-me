import { connection, NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * GET /api/connections/me
 * Returns the list of connection IDs the current user has joined (and not left).
 */
export async function GET(_request: NextRequest) {
    await connection();
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("user_connections")
            .select("connection_id")
            .eq("user_id", user.id)
            .is("left_at", null);

        if (error) {
            console.error("Error fetching user connections:", error);
            return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
        }

        const connectionIds = (data ?? []).map(row => row.connection_id as string);

        return NextResponse.json({ connectionIds });
    } catch (error) {
        console.error("Error in GET /api/connections/me:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
