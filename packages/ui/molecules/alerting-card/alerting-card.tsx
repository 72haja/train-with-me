"use client";

import type { ReactNode } from "react";
import {
    ExclamationMarkIcon,
    LightningIcon,
    QuestionMarkIcon,
} from "@ui/atoms/icons";
import styles from "./alerting-card.module.scss";

export type AlertingCardVariant = "error" | "info" | "warning";

export interface AlertingCardProps {
    variant: AlertingCardVariant;
    children: ReactNode;
    className?: string;
}

const variantIcon = {
    error: LightningIcon,
    warning: QuestionMarkIcon,
    info: ExclamationMarkIcon,
};

export function AlertingCard({ variant, children, className }: AlertingCardProps) {
    const Icon = variantIcon[variant];

    return (
        <div
            className={`${styles.card} ${styles[variant]} ${className ?? ""}`.trim()}
            role="alert"
            aria-live="polite">
            <span className={styles.iconWrapper} aria-hidden>
                <Icon className={styles.icon} />
            </span>
            <div className={styles.content}>{children}</div>
        </div>
    );
}
