"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Station } from "@/packages/types/lib/types";
import { stationsToOptions } from "@apis/mockStations";
import { Autocomplete, type AutocompleteOption } from "@ui/atoms/autocomplete";

interface StationAutocompleteProps {
    value?: AutocompleteOption | null;
    onChange: (option: AutocompleteOption | null) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    /** Station ID to exclude from options (e.g., the other station in a route search) */
    excludeStationId?: string;
    /** Initial station ID to set as value */
    initialStationId?: string;
}

/**
 * Station autocomplete component with built-in API fetching and caching
 * Handles its own station search with 1-day caching per query
 */
export function StationAutocomplete({
    value,
    onChange,
    placeholder = "Search station...",
    label,
    disabled = false,
    className = "",
    excludeStationId,
    initialStationId,
}: StationAutocompleteProps) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [stations, setStations] = useState<Station[]>([]);

    // Load initial station from API if provided
    useEffect(() => {
        if (!initialStationId || value) return;
        let cancelled = false;
        async function loadInitial() {
            try {
                const response = await fetch("/api/stations");
                if (!response.ok) return;
                const result = await response.json();
                if (cancelled || !result.success || !Array.isArray(result.data)) return;
                const station = result.data.find((s: Station) => s.id === initialStationId);
                if (station) {
                    onChange({
                        id: station.id,
                        label: station.name,
                        subtitle: station.city,
                    });
                }
            } catch (error) {
                console.error("Failed to load initial station:", error);
            }
        }
        loadInitial();
        return () => {
            cancelled = true;
        };
    }, [initialStationId, value, onChange]);

    // Fetch stations from API when search query changes (debounced)
    useEffect(() => {
        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                const url =
                    searchQuery.trim() === ""
                        ? "/api/stations"
                        : `/api/stations?q=${encodeURIComponent(searchQuery.trim())}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch stations");
                const result = await response.json();
                if (!cancelled && result.success && Array.isArray(result.data)) {
                    setStations(result.data);
                } else if (!cancelled) {
                    setStations([]);
                }
            } catch (error) {
                console.error("Failed to fetch stations:", error);
                if (!cancelled) setStations([]);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    // Convert stations to autocomplete options, excluding the specified station
    const options = useMemo(() => {
        return stationsToOptions(stations, excludeStationId);
    }, [stations, excludeStationId]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            label={label}
            disabled={disabled}
            className={className}
            onSearch={handleSearch}
        />
    );
}
