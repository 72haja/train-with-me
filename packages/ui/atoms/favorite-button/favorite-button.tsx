"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Star } from "lucide-react";
import styles from "./favorite-button.module.scss";

interface FavoriteButtonProps {
    isFavorite: boolean;
    isLoading?: boolean;
    onClick: () => void;
    className?: string;
    iconSize?: "sm" | "md";
}

export function FavoriteButton({
    isFavorite,
    isLoading = false,
    onClick,
    className = "",
    iconSize = "sm",
}: FavoriteButtonProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={clsx(styles.container, className)}>
            <button
                type="button"
                onClick={onClick}
                disabled={isLoading}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className={clsx(
                    styles.button,
                    isFavorite && styles.buttonActive,
                    iconSize === "md" && styles.buttonMd
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <Star
                    className={clsx(
                        styles.icon,
                        isFavorite && styles.iconActive,
                        iconSize === "md" && styles.iconMd
                    )}
                    fill={isFavorite ? "currentColor" : "none"}
                />
            </button>
            {showTooltip && (
                <div className={styles.tooltip} role="tooltip">
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </div>
            )}
        </div>
    );
}
