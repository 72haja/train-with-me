/**
 * Static VVS connection search – for testing the static model without live API.
 * Same request/response shape as POST /api/connections/search.
 */
import { NextRequest, NextResponse } from "next/server";
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";
import { searchStaticConnections } from "@apis/static-vvs/search";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { originId, destinationId, date, time } = body;

        if (!originId || !destinationId) {
            return NextResponse.json(
                { error: "originId and destinationId are required" },
                { status: 400 }
            );
        }

        let searchDate: string | undefined;
        if (date) {
            searchDate = time
                ? new Date(`${date}T${time}`).toISOString()
                : new Date(date).toISOString();
        }

        const journeys = searchStaticConnections(
            staticVvsMockData,
            originId,
            destinationId,
            searchDate,
            20
        );

        return NextResponse.json({ journeys });
    } catch (error) {
        console.error("Error in /api/static-vvs/connections/search:", error);
        return NextResponse.json({ error: "Failed to search connections" }, { status: 500 });
    }
}
