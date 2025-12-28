/**
 * Database types
 * Types for Supabase database schema (converted to camelCase)
 */

import type { TransportType } from "./transport";

export interface DbUser {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DbConnection {
    id: string;
    tripId: string;
    lineNumber: string;
    lineType: TransportType;
    departureStationId: string;
    arrivalStationId: string;
    scheduledDeparture: string;
    createdAt: string;
}

export interface DbUserConnection {
    id: string;
    userId: string;
    connectionId: string;
    joinedAt: string;
    leftAt?: string;
}

export interface DbFriendship {
    id: string;
    userId: string;
    friendId: string;
    status: "pending" | "accepted" | "blocked";
    createdAt: string;
}

