"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Star } from "lucide-react";
import {
    flip,
    offset,
    shift,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
} from "@floating-ui/react";
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
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: "top",
        middleware: [offset(8), flip(), shift({ padding: 8 })],
    });

    const hover = useHover(context, { move: false });
    const focus = useFocus(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus]);

    return (
        <div className={clsx(styles.container, className)}>
            <button
                type="button"
                ref={refs.setReference}
                onClick={onClick}
                disabled={isLoading}
                {...getReferenceProps()}
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
            {isOpen && (
                <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    {...getFloatingProps()}
                    className={styles.tooltip}
                    role="tooltip">
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </div>
            )}
        </div>
    );
}
