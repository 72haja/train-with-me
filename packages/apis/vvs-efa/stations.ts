/**
 * VVS EFA station search
 */
import type { Station } from "@/packages/types/lib/types";
import { efaClient } from "./client";
import type { EfaStopFinderPoint, EfaStopFinderResponse } from "./types";

/**
 * Search stations by name
 */
export async function searchEfaStations(query: string, trainOnly = false): Promise<Station[]> {
    const params: Record<string, string | number | boolean> = {
        type_sf: "stop",
        name_sf: query,
        locationServerActive: 1,
    };
    // anyObjFilter_sf bitmask: 1=train/S-Bahn, 2=U-Bahn — use 3 to include both rail types
    if (trainOnly) {
        params.anyObjFilter_sf = 3;
    }
    const response = await efaClient<EfaStopFinderResponse>("XML_STOPFINDER_REQUEST", params);

    const points = normalizePoints(response.stopFinder.points);
    return points.map(mapEfaPointToStation);
}

/**
 * Get a station by its VVS stop ID
 */
export async function getEfaStation(stopId: string): Promise<Station | null> {
    const response = await efaClient<EfaStopFinderResponse>("XML_STOPFINDER_REQUEST", {
        type_sf: "stop",
        name_sf: stopId,
        locationServerActive: 1,
    });

    const points = normalizePoints(response.stopFinder.points);
    if (points.length === 0) return null;

    return mapEfaPointToStation(points[0]!);
}

/**
 * EFA returns points as either an array or a single object — normalize to array
 */
function normalizePoints(
    points: EfaStopFinderPoint[] | { point: EfaStopFinderPoint } | null | undefined
): EfaStopFinderPoint[] {
    if (!points) return [];
    if (Array.isArray(points)) return points;
    if ("point" in points) {
        const p = points.point;
        return Array.isArray(p) ? p : [p];
    }
    return [];
}

function mapEfaPointToStation(point: EfaStopFinderPoint): Station {
    return {
        id: point.ref.id,
        name: point.object || point.name,
        city: point.ref.place || undefined,
        vvsId: point.ref.id,
        coordinates: parseCoords(point.ref.coords),
    };
}

function parseCoords(coords?: string): { latitude: number; longitude: number } | undefined {
    if (!coords) return undefined;
    // EFA uses Gauss-Krueger coordinates, not lat/lon — skip for now
    return undefined;
}
