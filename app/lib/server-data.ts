/**
 * Server-side data fetching for use in Server Components.
 */
import type { Connection } from "@/packages/types/lib/types";
import { searchEfaConnections } from "@apis/vvs-efa";

export type DbFavoriteConnection = {
    id: string;
    userId: string;
    originStationId: string;
    destinationStationId: string;
    originStationName?: string | null;
    destinationStationName?: string | null;
    createdAt: string;
};

export const getConnectionsSearch = async (
    originId: string,
    destinationId: string,
    date?: string,
    time?: string
): Promise<{ connections: Connection[] }> => {
    const searchDateTime =
        date && time
            ? new Date(`${date}T${time}`).toISOString()
            : date
              ? new Date(date).toISOString()
              : undefined;

    const connections = await searchEfaConnections(originId, destinationId, searchDateTime);
    return { connections };
};
