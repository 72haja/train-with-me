"use client"

import Image from "next/image"
import styles from './friend-card.module.scss'
import type { Friend } from "@/types/vvs"

interface FriendCardProps {
  friend: Friend;
  className?: string;
}

export function FriendCard({ friend, className }: FriendCardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.avatarWrapper}>
        <div className={styles.avatar}>
          {friend.avatarUrl ? (
            <Image
              src={friend.avatarUrl}
              alt={friend.name}
              width={48}
              height={48}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {friend.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {friend.isOnline && <div className={styles.onlineIndicator} />}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{friend.name}</p>
        <p className={styles.status}>{friend.isOnline ? 'Active now' : 'Offline'}</p>
      </div>
    </div>
  );
}
