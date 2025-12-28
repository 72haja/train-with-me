"use client";

import Image from "next/image";
import type { Friend } from "@/packages/types/lib/types";
import styles from "./friend-avatar-group.module.scss";

interface FriendAvatarGroupProps {
    friends: Friend[];
    max?: number;
    className?: string;
}

export function FriendAvatarGroup({ friends, max = 3, className }: FriendAvatarGroupProps) {
    const displayFriends = friends.slice(0, max);
    const remainingCount = friends.length - max;

    return (
        <div className={`${styles.group} ${className || ""}`}>
            {displayFriends.map(friend => (
                <div key={friend.id} className={styles.avatar}>
                    {friend.avatarUrl ? (
                        <Image
                            src={friend.avatarUrl}
                            alt={friend.name}
                            width={32}
                            height={32}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {friend.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            ))}
            {remainingCount > 0 && (
                <div className={styles.avatarMore}>
                    <span className={styles.avatarMoreText}>+{remainingCount}</span>
                </div>
            )}
        </div>
    );
}
