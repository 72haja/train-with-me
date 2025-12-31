"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import styles from "./autocomplete.module.scss";

export interface AutocompleteOption {
    id: string;
    label: string;
    subtitle?: string;
}

interface AutocompleteProps {
    options: AutocompleteOption[];
    value?: AutocompleteOption | null;
    onChange: (option: AutocompleteOption | null) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    onSearch?: (query: string) => void;
}

export function Autocomplete({
    options,
    value,
    onChange,
    placeholder = "Search...",
    label,
    disabled = false,
    className = "",
    onSearch,
}: AutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(value?.label || "");
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            startTransition(() => {
                setSearchQuery(value.label);
            });
        } else {
            startTransition(() => {
                setSearchQuery("");
            });
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsOpen(true);
        if (!query) {
            onChange(null);
        }
        if (onSearch) {
            onSearch(query);
        }
    };

    const handleSelect = (option: AutocompleteOption) => {
        onChange(option);
        setSearchQuery(option.label);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange(null);
        setSearchQuery("");
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        setIsOpen(true);
    };

    return (
        <div className={`${styles.autocomplete} ${className}`} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <Search className={styles.searchIcon} />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={styles.input}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.clearButton}
                        aria-label="Clear selection">
                        <X className={styles.clearIcon} />
                    </button>
                )}
            </div>
            {isOpen && options.length > 0 && (
                <div className={styles.dropdown}>
                    {options.map(option => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={`${styles.option} ${
                                value?.id === option.id ? styles.optionSelected : ""
                            }`}>
                            <div className={styles.optionContent}>
                                <span className={styles.optionLabel}>{option.label}</span>
                                {option.subtitle && (
                                    <span className={styles.optionSubtitle}>{option.subtitle}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {isOpen && searchQuery && options.length === 0 && (
                <div className={styles.dropdown}>
                    <div className={styles.noResults}>No results found</div>
                </div>
            )}
        </div>
    );
}
