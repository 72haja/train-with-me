"use client";

import { useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import { mockStations, stationsToOptions } from "@apis/mockStations";
import { Autocomplete, type AutocompleteOption } from "@ui/atoms/autocomplete";
import { Button } from "@ui/atoms/button";
import styles from "./route-search-form.module.scss";

interface RouteSearchFormProps {
    onSearch: (originId: string, destinationId: string) => void;
    loading?: boolean;
    className?: string;
}

export function RouteSearchForm({
    onSearch,
    loading = false,
    className = "",
}: RouteSearchFormProps) {
    const [origin, setOrigin] = useState<AutocompleteOption | null>(null);
    const [destination, setDestination] = useState<AutocompleteOption | null>(null);

    const stationOptions = stationsToOptions(mockStations);

    const handleSearch = () => {
        if (origin && destination) {
            onSearch(origin.id, destination.id);
        }
    };

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const canSearch = origin && destination && origin.id !== destination.id;

    return (
        <div className={`${styles.form} ${className}`}>
            <div className={styles.fields}>
                <div className={styles.field}>
                    <Autocomplete
                        options={stationOptions}
                        value={origin}
                        onChange={setOrigin}
                        placeholder="Von..."
                        label="Start"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleSwap}
                    className={styles.swapButton}
                    aria-label="Swap origin and destination">
                    <ArrowLeftRight className={styles.swapIcon} />
                </button>

                <div className={styles.field}>
                    <Autocomplete
                        options={stationOptions}
                        value={destination}
                        onChange={setDestination}
                        placeholder="Nach..."
                        label="Ziel"
                    />
                </div>
            </div>

            <Button
                type="button"
                onClick={handleSearch}
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSearch || loading}
                loading={loading}
                className={styles.searchButton}>
                <Search className={styles.searchButtonIcon} />
                Verbindungen suchen
            </Button>
        </div>
    );
}
