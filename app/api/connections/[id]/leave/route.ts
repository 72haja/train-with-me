import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    _request: NextRequest,
    { params }: RouteContext<"/api/connections/[id]/leave">
) {
    try {
        const { id } = await params;
        const connectionId = id;

        // In production, this would:
        // 1. Get current user from session
        // const session = await getServerSession();
        // if (!session?.user?.id) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // 2. Leave connection in Supabase
        // await leaveConnection(session.user.id, connectionId);

        // For now, just return success
        return NextResponse.json({
            success: true,
            connectionId,
        });
    } catch (error) {
        console.error("Error leaving connection:", error);
        return NextResponse.json({ error: "Failed to leave connection" }, { status: 500 });
    }
}
