import { clsx } from "clsx";
import styles from "./favorite-connections.module.scss";

interface FavoriteConnectionsSkeletonProps {
    className?: string;
}

/** Skeleton for the favorites list. Used as Suspense fallback. */
export function FavoriteConnectionsSkeleton({
    className = "",
}: FavoriteConnectionsSkeletonProps) {
    return (
        <div className={clsx(styles.skeletonList, className)}>
            {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonRow}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonDelete} />
                </div>
            ))}
        </div>
    );
}
