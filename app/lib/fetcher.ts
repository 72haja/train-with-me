/**
 * Default fetcher for SWR – GET request, JSON response.
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error("An error occurred while fetching the data.");
        (error as Error & { status?: number }).status = res.status;
        throw error;
    }
    return res.json() as Promise<T>;
}

/**
 * POST fetcher for SWR – use with useSWR(key, (url, { arg }) => postFetcher(url, arg)).
 */
export async function postFetcher<T = unknown, B = unknown>(
    url: string,
    body: B
): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const error = new Error("An error occurred while fetching the data.");
        (error as Error & { status?: number }).status = res.status;
        throw error;
    }
    return res.json() as Promise<T>;
}
