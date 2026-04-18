"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type MyConnectionFriend = {
    id: Id<"users">;
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

export const useMyConnections = () => {
    const data = useQuery(api.userConnections.listMine, {});

    return {
        connectionIds: data?.connectionIds ?? [],
        connections:
            data?.connections.map(
                (c): MyConnection => ({
                    id: c.id,
                    originStationId: c.originStationId,
                    originStationName: c.originStationName,
                    destinationStationId: c.destinationStationId,
                    destinationStationName: c.destinationStationName,
                    departureTime: c.departureTime,
                    arrivalTime: c.arrivalTime,
                    lineNumber: c.lineNumber,
                    lineType: c.lineType,
                    lineColor: c.lineColor,
                    lineDirection: c.lineDirection,
                    friends: c.friends.map(f => ({
                        id: f.id,
                        name: f.name,
                        avatarUrl: f.avatarUrl,
                    })),
                })
            ) ?? [],
    };
};
