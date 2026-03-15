/**
 * Mock VVS Station Data (VVS EFA stop IDs)
 * Default stations shown before user searches via the VVS EFA API
 */
import type { Station } from "@/packages/types/lib/types";
import type { AutocompleteOption } from "@ui/atoms/autocomplete";

export const mockStations: Station[] = [
    {
        id: "5006118",
        name: "Hauptbahnhof (tief)",
        city: "Stuttgart",
        vvsId: "5006118",
    },
    {
        id: "5006115",
        name: "Hauptbahnhof (oben)",
        city: "Stuttgart",
        vvsId: "5006115",
    },
    {
        id: "5006002",
        name: "Vaihingen",
        city: "Stuttgart",
        vvsId: "5006002",
    },
    {
        id: "5004510",
        name: "Bondorf",
        city: "Bondorf",
        vvsId: "5004510",
    },
    {
        id: "5002183",
        name: "Herrenberg",
        city: "Herrenberg",
        vvsId: "5002183",
    },
    {
        id: "5006553",
        name: "Flughafen/Messe",
        city: "Stuttgart",
        vvsId: "5006553",
    },
    {
        id: "5006057",
        name: "Bad Cannstatt",
        city: "Stuttgart",
        vvsId: "5006057",
    },
    {
        id: "5006056",
        name: "Stadtmitte",
        city: "Stuttgart",
        vvsId: "5006056",
    },
    {
        id: "5007100",
        name: "Böblingen",
        city: "Böblingen",
        vvsId: "5007100",
    },
    {
        id: "5005070",
        name: "Backnang",
        city: "Backnang",
        vvsId: "5005070",
    },
    {
        id: "5003526",
        name: "Ludwigsburg",
        city: "Ludwigsburg",
        vvsId: "5003526",
    },
    {
        id: "5001768",
        name: "Esslingen(Neckar)",
        city: "Esslingen",
        vvsId: "5001768",
    },
    {
        id: "5006333",
        name: "Waiblingen",
        city: "Waiblingen",
        vvsId: "5006333",
    },
    {
        id: "5004673",
        name: "Plochingen",
        city: "Plochingen",
        vvsId: "5004673",
    },
];

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

/**
 * Find station by ID
 */
export function findStationById(id: string): Station | undefined {
    return mockStations.find(station => station.id === id);
}

/**
 * Search stations by query
 */
export function searchStations(query: string): Station[] {
    const lowerQuery = query.toLowerCase();
    return mockStations.filter(
        station =>
            station.name.toLowerCase().includes(lowerQuery) ||
            station.city?.toLowerCase().includes(lowerQuery)
    );
}
