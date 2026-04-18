import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,

    users: defineTable({
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        fullName: v.optional(v.string()),
        avatarStorageId: v.optional(v.id("_storage")),
    }).index("email", ["email"]),

    friendships: defineTable({
        userId: v.id("users"),
        friendId: v.id("users"),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    })
        .index("by_user", ["userId"])
        .index("by_friend", ["friendId"])
        .index("by_user_and_friend", ["userId", "friendId"])
        .index("by_friend_and_user", ["friendId", "userId"])
        .index("by_user_and_status", ["userId", "status"])
        .index("by_friend_and_status", ["friendId", "status"]),

    userConnections: defineTable({
        userId: v.id("users"),
        connectionId: v.string(),
        tripId: v.optional(v.string()),
        joinedAt: v.number(),
        leftAt: v.optional(v.number()),
        originStationId: v.optional(v.string()),
        originStationName: v.optional(v.string()),
        destinationStationId: v.optional(v.string()),
        destinationStationName: v.optional(v.string()),
        departureTime: v.optional(v.string()),
        arrivalTime: v.optional(v.string()),
        lineNumber: v.optional(v.string()),
        lineType: v.optional(v.string()),
        lineColor: v.optional(v.string()),
        lineDirection: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_connection", ["userId", "connectionId"])
        .index("by_user_and_left", ["userId", "leftAt"])
        .index("by_trip", ["tripId"]),

    favoriteConnections: defineTable({
        userId: v.id("users"),
        originStationId: v.string(),
        destinationStationId: v.string(),
        originStationName: v.optional(v.string()),
        destinationStationName: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_route", ["userId", "originStationId", "destinationStationId"]),
});
