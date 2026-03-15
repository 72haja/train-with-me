/**
 * VVS EFA (Elektronische Fahrplanauskunft) API client
 * Free, public, no authentication required
 */

const EFA_BASE = "https://efastatic.vvs.de/umweltrechner";

export const efaClient = async <T>(
    endpoint: string,
    params: Record<string, string | number | boolean>
): Promise<T> => {
    const url = new URL(`${EFA_BASE}/${endpoint}`);
    url.searchParams.set("outputFormat", "JSON");

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
    });

    const response = await fetch(url.toString(), { cache: "no-store" });

    if (!response.ok) {
        throw new Error(
            `VVS EFA API error (${endpoint}): ${response.status} ${response.statusText}`
        );
    }

    return (await response.json()) as T;
};
