import * as React from "react";
import styles from "./loading-spinner.module.scss";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
    return (
        <div className={`${styles.spinner} ${styles[size]} ${className}`}>
            <div className={styles.circle} />
        </div>
    );
}
