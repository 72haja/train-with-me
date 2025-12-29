/**
 * Environment variables for MobiData BW GTFS API
 * This is a public API, so no authentication is required
 */

export const getMobidataApiUrl = (): string => {
    // Default to the public MobiData BW API
    return process.env.MOBIDATA_API_URL || "https://api.mobidata-bw.de/gtfs";
};

