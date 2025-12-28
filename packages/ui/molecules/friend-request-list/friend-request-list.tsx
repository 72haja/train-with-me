"use client";

import { motion } from "motion/react";
import type { FriendRequest } from "@/packages/types/lib/types";
import { FriendRequestCard } from "@ui/molecules/friend-request-card";
import styles from "./friend-request-list.module.scss";

interface FriendRequestListProps {
    title: string;
    requests: FriendRequest[];
    onAccept?: (id: string) => void;
    onDecline?: (id: string) => void;
    getInitials: (name: string) => string;
    delay?: number;
}

export function FriendRequestList({
    title,
    requests,
    onAccept,
    onDecline,
    getInitials,
    delay = 0,
}: FriendRequestListProps) {
    if (requests.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div className={styles.list}>
                {requests.map(request => (
                    <FriendRequestCard
                        key={request.id}
                        id={request.id}
                        userName={request.user.name}
                        userEmail={request.user.email}
                        avatarUrl={request.user.avatarUrl}
                        type={request.type}
                        onAccept={onAccept}
                        onDecline={onDecline}
                        getInitials={getInitials}
                    />
                ))}
            </div>
        </motion.div>
    );
}
