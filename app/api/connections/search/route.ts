/**
 * API route for searching connections via VVS EFA API
 */
import { NextRequest, NextResponse } from "next/server";
import { searchEfaConnections } from "@apis/vvs-efa";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { originId, destinationId, date, time, limit } = body;

        if (!originId || !destinationId) {
            return NextResponse.json(
                { error: "originId and destinationId are required" },
                { status: 400 }
            );
        }

        let searchDateTime: string | undefined;
        if (date) {
            if (time) {
                searchDateTime = new Date(`${date}T${time}`).toISOString();
            } else {
                searchDateTime = new Date(date).toISOString();
            }
        }

        const connections = await searchEfaConnections(
            originId,
            destinationId,
            searchDateTime,
            typeof limit === "number" ? limit : undefined
        );

        return NextResponse.json({ connections });
    } catch (error) {
        console.error("Error in /api/connections/search:", error);
        return NextResponse.json({ error: "Failed to search connections" }, { status: 500 });
    }
}
