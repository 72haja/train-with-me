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
        const fetchOptions: RequestInit & { next?: { tags: string[] } } = {
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        };

        // Add Next.js cache tags if provided
        if (nextTags.length > 0) {
            fetchOptions.next = {
                tags: ["mobidata", ...nextTags],
            };
        }
        console.log("url.toString()", url.toString());

        const response = await fetch(url.toString(), fetchOptions);

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
