"use client";

import { Users } from "lucide-react";
import { motion } from "motion/react";
import type { Friend } from "@/packages/types/lib/types";
import { FriendCard } from "./friend-card";
import styles from "./friends-on-train-section.module.scss";

interface FriendsOnTrainSectionProps {
    friends: Friend[];
    delay?: number;
}

export function FriendsOnTrainSection({ friends, delay = 0.2 }: FriendsOnTrainSectionProps) {
    const getTitle = () => {
        if (friends.length === 0) return "No friends yet";
        if (friends.length === 1) return "1 friend on board";
        return `${friends.length} friends on board`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={styles.card}>
            <div className={styles.header}>
                <Users className={styles.icon} />
                <h3 className={styles.title}>{getTitle()}</h3>
            </div>

            {friends.length > 0 ? (
                <div className={styles.list}>
                    {friends.map((friend, index) => (
                        <motion.div
                            key={friend.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.1 + index * 0.05 }}>
                            <FriendCard friend={friend} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Users className={styles.emptyIconSvg} />
                    </div>
                    <p className={styles.emptyText}>Be the first to join this train!</p>
                </div>
            )}
        </motion.div>
    );
}
