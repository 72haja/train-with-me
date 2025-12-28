"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import styles from "./friend-request-card.module.scss";

interface FriendRequestCardProps {
    id: string;
    userName: string;
    userEmail: string;
    avatarUrl: string | null;
    type: "received" | "sent";
    onAccept?: (id: string) => void;
    onDecline?: (id: string) => void;
    getInitials: (name: string) => string;
}

export function FriendRequestCard({
    id,
    userName,
    userEmail,
    avatarUrl,
    type,
    onAccept,
    onDecline,
    getInitials,
}: FriendRequestCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.user}>
                <div className={styles.avatar}>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={userName}
                            width={48}
                            height={48}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{getInitials(userName)}</div>
                    )}
                </div>
                <div className={styles.info}>
                    <p className={styles.name}>{userName}</p>
                    <p className={styles.email}>{userEmail}</p>
                </div>
            </div>
            {type === "received" ? (
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => onAccept?.(id)}
                        className={styles.acceptButton}
                        aria-label="Accept">
                        <Check className={styles.actionIcon} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDecline?.(id)}
                        className={styles.declineButton}
                        aria-label="Decline">
                        <X className={styles.actionIcon} />
                    </button>
                </div>
            ) : (
                <div className={styles.status}>
                    <span className={styles.pendingBadge}>Pending</span>
                </div>
            )}
        </div>
    );
}
