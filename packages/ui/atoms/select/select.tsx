"use client";

import * as React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import styles from "./select.module.scss";

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export function Select({ options, value, onChange, className = "", disabled }: SelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (option: SelectOption) => {
        onChange?.(option.value);
        setIsOpen(false);
        buttonRef.current?.blur();
    };

    const handleButtonClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div className={clsx(styles.select, className)} ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleButtonClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={styles.button}
                data-open={isOpen}>
                <span className={styles.buttonText}>{selectedOption?.label || ""}</span>
                <ChevronDown className={styles.chevron} />
            </button>
            {isOpen && (
                <div className={styles.dropdown}>
                    {options.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={clsx(
                                styles.option,
                                value === option.value && styles.optionSelected
                            )}>
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
