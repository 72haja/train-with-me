import useSWR from "swr";
import type { Connection } from "@/packages/types/lib/types";
import { mapJourneyToConnection } from "@apis/mobidata/mappers";
import { postFetcher } from "@/app/lib/fetcher";
import type { Journey } from "@/app/api/connections/search/route";

export type ConnectionsSearchParams = {
    originId: string;
    destinationId: string;
    date: string | null;
    time: string | null;
};

async function fetchConnections(params: ConnectionsSearchParams): Promise<Connection[]> {
    const { originId, destinationId, date, time } = params;
    const data = await postFetcher<{ journeys: Journey[] }>(
        "/api/static-vvs/connections/search",
        { originId, destinationId, date: date ?? undefined, time: time ?? undefined }
    );
    const journeys = data.journeys ?? [];
    return journeys.map((j: Journey) => mapJourneyToConnection(j));
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

    const { data: connections = initialConnections, isLoading, error } = useSWR(
        key,
        () => fetchConnections(params),
        {
            fallbackData: initialConnections,
            revalidateOnMount: false,
        }
    );

    const errorMessage = error instanceof Error ? error.message : null;

    return { connections, isLoading, errorMessage };
}
