import * as React from "react";
import type { Line } from "@/packages/types/lib/types";
import styles from "./line-badge.module.scss";

interface LineBadgeProps {
    line: Line;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LineBadge({ line, size = "md", className }: LineBadgeProps) {
    return (
        <div
            className={`${styles.badge} ${styles[size]} ${className || ""}`}
            style={{ backgroundColor: line.color }}
            aria-label={`${line.type} ${line.number}`}>
            <span className={styles.number}>{line.number}</span>
        </div>
    );
}
