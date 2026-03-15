import { useCallback, useState } from "react";
import useSWR from "swr";
import { postFetcher } from "@/app/lib/fetcher";
import type { Connection } from "@/packages/types/lib/types";

export type ConnectionsSearchParams = {
    originId: string;
    destinationId: string;
    date: string | null;
    time: string | null;
};

const PAGE_SIZE = 3;

async function fetchConnections(
    params: ConnectionsSearchParams,
    limit?: number
): Promise<Connection[]> {
    const { originId, destinationId, date, time } = params;
    const data = await postFetcher<{ connections: Connection[] }>("/api/connections/search", {
        originId,
        destinationId,
        date: date ?? undefined,
        time: time ?? undefined,
        ...(limit !== undefined && { limit }),
    });
    return data.connections ?? [];
}

export function useConnectionsSearch(
    params: ConnectionsSearchParams,
    initialConnections: Connection[]
) {
    const { originId, destinationId, date, time } = params;
    const key =
        originId && destinationId && date && time
            ? (["connections", originId, destinationId, date, time] as const)
            : null;

    const {
        data: connections = initialConnections,
        isLoading,
        error,
        mutate,
    } = useSWR(key, () => fetchConnections(params), {
        fallbackData: initialConnections.length > 0 ? initialConnections : undefined,
        revalidateOnMount: true,
    });

    const [loadingEarlier, setLoadingEarlier] = useState(false);
    const [loadingLater, setLoadingLater] = useState(false);

    const loadEarlier = useCallback(async () => {
        if (!connections.length || loadingEarlier) return;

        // Find earliest departure time in current list
        const earliest = connections[0];
        if (!earliest) return;

        // Search for connections arriving before the earliest departure
        const earliestTime = earliest.departure.scheduledDeparture;
        if (!earliestTime) return;

        // Subtract 2 hours from earliest to search for prior connections
        const earliestDate = new Date(earliestTime);
        earliestDate.setHours(earliestDate.getHours() - 2);

        const dateStr = earliestDate.toISOString().split("T")[0];
        const timeStr = `${String(earliestDate.getHours()).padStart(2, "0")}:${String(earliestDate.getMinutes()).padStart(2, "0")}`;

        setLoadingEarlier(true);
        try {
            const earlier = await fetchConnections(
                { originId, destinationId, date: dateStr!, time: timeStr },
                PAGE_SIZE + connections.length
            );

            // Filter to only connections departing before the earliest current one
            const newConnections = earlier.filter(
                c =>
                    c.departure.scheduledDeparture < earliestTime &&
                    !connections.some(existing => existing.id === c.id)
            );

            // Take only the last PAGE_SIZE results (closest to current earliest)
            const toAdd = newConnections.slice(-PAGE_SIZE);

            if (toAdd.length > 0) {
                await mutate([...toAdd, ...connections], { revalidate: false });
            }
        } catch (err) {
            console.error("Failed to load earlier connections:", err);
        } finally {
            setLoadingEarlier(false);
        }
    }, [connections, originId, destinationId, mutate, loadingEarlier]);

    const loadLater = useCallback(async () => {
        if (!connections.length || loadingLater) return;

        // Find latest departure time in current list
        const latest = connections[connections.length - 1];
        if (!latest) return;

        const latestTime = latest.departure.scheduledDeparture;
        if (!latestTime) return;

        // Search starting 1 minute after the latest departure
        const laterDate = new Date(latestTime);
        laterDate.setMinutes(laterDate.getMinutes() + 1);

        const dateStr = laterDate.toISOString().split("T")[0];
        const timeStr = `${String(laterDate.getHours()).padStart(2, "0")}:${String(laterDate.getMinutes()).padStart(2, "0")}`;

        setLoadingLater(true);
        try {
            const later = await fetchConnections(
                { originId, destinationId, date: dateStr!, time: timeStr },
                PAGE_SIZE
            );

            // Filter out duplicates
            const newConnections = later.filter(
                c => !connections.some(existing => existing.id === c.id)
            );

            const toAdd = newConnections.slice(0, PAGE_SIZE);

            if (toAdd.length > 0) {
                await mutate([...connections, ...toAdd], { revalidate: false });
            }
        } catch (err) {
            console.error("Failed to load later connections:", err);
        } finally {
            setLoadingLater(false);
        }
    }, [connections, originId, destinationId, mutate, loadingLater]);

    const errorMessage = error instanceof Error ? error.message : null;

    return {
        connections,
        isLoading,
        errorMessage,
        loadEarlier,
        loadLater,
        loadingEarlier,
        loadingLater,
    };
}
