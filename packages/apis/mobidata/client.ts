/**
 * MobiData BW GTFS API client for public transportation data
 */
import { getMobidataApiUrl } from "./env";

/**
 * Base function to make requests to the MobiData BW GTFS API
 */
export const mobidataClient = async <T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    params?: Record<string, string | number | boolean | null | undefined>,
    nextTags: string[] = [],
    errorMessage?: string
): Promise<T> => {
    const apiUrl = getMobidataApiUrl();
    const url = new URL(`${apiUrl}${endpoint}`);

    // Add query parameters if provided
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    try {
        const response = await fetch(url.toString(), {
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            next: {
                tags: ["mobidata", ...nextTags],
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `${errorMessage || "Error fetching MobiData BW API:"} ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        return (await response.json()) as T;
    } catch (error) {
        console.error(errorMessage || "Error fetching MobiData BW API:", error);
        throw error;
    }
};

