/**
 * Mock VVS Station Data
 * This will be replaced with actual API calls when the VVS API is integrated
 */
import type { Station } from "@/packages/types/lib/types";
import type { AutocompleteOption } from "@ui/atoms/autocomplete";

// Common Stuttgart VVS Stations
export const mockStations: Station[] = [
    {
        id: "de:08111:6056",
        name: "Hauptbahnhof",
        city: "Stuttgart",
        vvsId: "5006056",
        coordinates: { latitude: 48.7838, longitude: 9.1816 },
    },
    {
        id: "de:08111:6118",
        name: "Universität",
        city: "Stuttgart",
        vvsId: "5006118",
        coordinates: { latitude: 48.7462, longitude: 9.1058 },
    },
    {
        id: "de:08111:6088",
        name: "Vaihingen",
        city: "Stuttgart",
        vvsId: "5006088",
        coordinates: { latitude: 48.7254, longitude: 9.1078 },
    },
    {
        id: "de:08115:4512",
        name: "Herrenberg",
        city: "Herrenberg",
        vvsId: "5004512",
        coordinates: { latitude: 48.5947, longitude: 8.8675 },
    },
    {
        id: "de:08111:6553",
        name: "Flughafen/Messe",
        city: "Stuttgart",
        vvsId: "5006553",
        coordinates: { latitude: 48.6908, longitude: 9.1966 },
    },
    {
        id: "de:08111:6057",
        name: "Bad Cannstatt",
        city: "Stuttgart",
        vvsId: "5006057",
        coordinates: { latitude: 48.8069, longitude: 9.2176 },
    },
    {
        id: "de:08111:6071",
        name: "Rotebühlplatz",
        city: "Stuttgart",
        vvsId: "5006071",
    },
    {
        id: "de:08111:6075",
        name: "Charlottenplatz",
        city: "Stuttgart",
        vvsId: "5006075",
    },
    {
        id: "de:08111:6117",
        name: "Österfeld",
        city: "Stuttgart",
        vvsId: "5006117",
    },
    {
        id: "de:08115:4510",
        name: "Böblingen",
        city: "Böblingen",
        vvsId: "5004510",
    },
    {
        id: "de:08116:3720",
        name: "Leinfelden",
        city: "Leinfelden-Echterdingen",
        vvsId: "5003720",
    },
    {
        id: "de:08119:5070",
        name: "Backnang",
        city: "Backnang",
        vvsId: "5005070",
    },
    {
        id: "de:08118:7418",
        name: "Gerlingen",
        city: "Gerlingen",
        vvsId: "5007418",
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
