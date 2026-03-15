"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Station } from "@/packages/types/lib/types";
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
    /** Only show train/S-Bahn/U-Bahn stations */
    trainOnly?: boolean;
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
    trainOnly = false,
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
                const params = new URLSearchParams();
                if (searchQuery.trim() !== "") {
                    params.set("q", searchQuery.trim());
                }
                if (trainOnly) {
                    params.set("trainOnly", "true");
                }
                const qs = params.toString();
                const url = qs ? `/api/stations?${qs}` : "/api/stations";
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
    }, [searchQuery, trainOnly]);

    // Convert stations to autocomplete options, excluding the specified station
    const options: AutocompleteOption[] = useMemo(() => {
        return stations
            .filter((s: Station) => s.id !== excludeStationId)
            .map((s: Station) => ({
                id: s.id,
                label: s.name,
                subtitle: s.city,
            }));
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
