"use client";

import useSWR from "swr";
import { fetcher } from "@/app/lib/fetcher";
import { useSession } from "@apis/hooks/useSession";

export type MyConnectionFriend = {
    id: string;
    name: string;
    avatarUrl: string | null;
};

export type MyConnection = {
    id: string;
    originStationId: string | null;
    originStationName: string | null;
    destinationStationId: string | null;
    destinationStationName: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    lineNumber: string | null;
    lineType: string | null;
    lineColor: string | null;
    lineDirection: string | null;
    friends: MyConnectionFriend[];
};

type MyConnectionsResponse = {
    connectionIds: string[];
    connections: MyConnection[];
};

export function useMyConnections() {
    const { user } = useSession();

    const { data, mutate } = useSWR(
        user ? ["/api/connections/me", user.id] : null,
        () => fetcher<MyConnectionsResponse>("/api/connections/me"),
        { fallbackData: { connectionIds: [], connections: [] } }
    );

    return {
        connectionIds: data?.connectionIds ?? [],
        connections: data?.connections ?? [],
        mutate,
    };
}
