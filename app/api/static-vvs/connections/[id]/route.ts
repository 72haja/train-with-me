/**
 * GET /api/static-vvs/connections/[id] – fetch one connection by id (e.g. static-s1-herrenberg-0530).
 */
import { NextRequest, NextResponse } from "next/server";
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";
import { getStaticJourneyById } from "@apis/static-vvs/search";
import { mapJourneyToConnection } from "@apis/mobidata/mappers";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id || !id.startsWith("static-")) {
            return NextResponse.json({ error: "Invalid connection id" }, { status: 400 });
        }

        const datePart = new Date().toISOString().slice(0, 10);
        const journey = getStaticJourneyById(staticVvsMockData, id, datePart);
        if (!journey) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        const connection = mapJourneyToConnection(journey);
        return NextResponse.json({ connection, userConnectionId: null });
    } catch (error) {
        console.error("Error in /api/static-vvs/connections/[id]:", error);
        return NextResponse.json(
            { error: "Failed to fetch connection" },
            { status: 500 }
        );
    }
}
