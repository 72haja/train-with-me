/**
 * Station utilities using MobiData BW API
 */
import { unstable_cache } from "next/cache";
import type { Station } from "@/packages/types/lib/types";
import type { AutocompleteOption } from "@ui/atoms/autocomplete";
import { getStops } from "./api/stops";
import { mapMobidataStopToStation } from "./mappers";
import { PostgrestFilters } from "./postgrest";

/**
 * Get cache key for a search query (normalize empty string and null)
 */
function getCacheKey(query: string | undefined | null): string {
    return (query || "").toLowerCase().trim();
}

/**
 * Internal function to fetch stations from API
 * This is wrapped with unstable_cache below
 * Filters to VVS Stuttgart region (stop_id starting with de:08119: or de:08111:)
 */
async function fetchStationsInternal(query: string): Promise<Station[]> {
    // Normalize query for API call
    const searchQuery = query.trim() || undefined;

    // VVS Stuttgart uses region codes 08119 and 08111 in stop IDs
    // We need to fetch both regions and combine them
    const vvsRegionCodes = ["08119", "08111"];

    // Fetch stations from both VVS regions
    const allStops: Awaited<ReturnType<typeof getStops>> = [];

    for (const regionCode of vvsRegionCodes) {
        const params: Parameters<typeof getStops>[0] = {
            stop_id: PostgrestFilters.like(`de:${regionCode}:*`),
            location_type: PostgrestFilters.eq("station"),
            limit: 50, // Get enough stations from each region
        };

        if (searchQuery) {
            // Add name filter if query provided
            params.stop_name = PostgrestFilters.ilike(`*${searchQuery}*`);
        }

        try {
            const stops = await getStops(params);
            allStops.push(...stops);
        } catch (error) {
            console.error(`Failed to fetch stops for region ${regionCode}:`, error);
            // Continue with other region
        }
    }

    // Filter to VVS Stuttgart region (stop_id starting with de:08119: or de:08111:)
    // This is a safety check in case the API returns other stations
    const vvsStops = allStops.filter(
        stop => stop.stop_id.startsWith("de:08119:") || stop.stop_id.startsWith("de:08111:")
    );

    // Remove duplicates (in case same station appears in both queries)
    const uniqueStops = Array.from(new Map(vvsStops.map(stop => [stop.stop_id, stop])).values());

    // Sort by name for consistent ordering
    uniqueStops.sort((a, b) => a.stop_name.localeCompare(b.stop_name));

    // Limit results if query provided
    const limitedStops = searchQuery ? uniqueStops.slice(0, 10) : uniqueStops.slice(0, 20);

    return limitedStops.map(mapMobidataStopToStation);
}

/**
 * Cached function to search stations
 * Uses Next.js unstable_cache - caches based on function arguments
 * Each unique query argument gets its own cache entry
 * Cache duration: 24 hours (86400 seconds)
 */
const getCachedStations = unstable_cache(
    async (query: string) => fetchStationsInternal(query),
    ["stations-search"],
    {
        revalidate: 86400, // 1 day in seconds
        tags: ["stations"],
    }
);

/**
 * Search stations by query with 1-day caching using Next.js unstable_cache
 * Results are cached per query (including empty string)
 * Cache duration: 24 hours (86400 seconds)
 *
 * Uses Next.js unstable_cache for server-side caching.
 * Each unique query gets its own cache entry based on function arguments.
 */
export async function searchStations(query: string = ""): Promise<Station[]> {
    const normalizedQuery = getCacheKey(query);

    // Call the cached function - Next.js caches based on the function argument
    // Each unique normalizedQuery value gets its own cache entry
    return getCachedStations(normalizedQuery);
}

/**
 * Get all stations from MobiData BW API (uses empty query cache)
 * Results are cached for 1 day
 */
export async function getAllStations(): Promise<Station[]> {
    return searchStations("");
}

/**
 * Find station by ID
 */
export async function findStationById(id: string): Promise<Station | undefined> {
    const stations = await getAllStations();
    return stations.find(station => station.id === id);
}

/**
 * Convert stations to autocomplete options
 */
export function stationsToOptions(stations: Station[], excludeId?: string): AutocompleteOption[] {
    return stations
        .filter(station => station.id !== excludeId)
        .map(station => ({
            id: station.id,
            label: station.name,
            subtitle: station.city,
        }));
}
