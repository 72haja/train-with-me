import useSWR from "swr";
import { fetcher } from "@/app/lib/fetcher";

async function fetchMyConnectionIds(): Promise<string[]> {
    try {
        const data = await fetcher<{ connectionIds: string[] }>("/api/connections/me");
        return data.connectionIds ?? [];
    } catch {
        return [];
    }
}

export function useJoinedConnectionIds() {
    const { data: joinedConnectionIds = [] } = useSWR(
        "/api/connections/me",
        fetchMyConnectionIds,
        { fallbackData: [] }
    );

    return joinedConnectionIds;
}
