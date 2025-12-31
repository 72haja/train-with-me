"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { format } from "date-fns";
import { ArrowUpDown, MapPin, Search } from "lucide-react";
import type { AutocompleteOption } from "@ui/atoms/autocomplete";
import { Button } from "@ui/atoms/button";
import { DatePicker } from "@ui/molecules/date-picker";
import { StationAutocomplete } from "@ui/molecules/station-autocomplete";
import { TimePicker } from "@ui/molecules/time-picker";
import styles from "./route-search-form.module.scss";

interface RouteSearchFormProps {
    loading?: boolean;
    className?: string;
    initialOriginId?: string;
    initialDestinationId?: string;
}

export interface RouteSearchFormRef {
    setOrigin: (originId: string) => void;
    setDestination: (destinationId: string) => void;
    setRoute: (originId: string, destinationId: string) => void;
}

export const RouteSearchForm = forwardRef<RouteSearchFormRef, RouteSearchFormProps>(
    function RouteSearchForm(
        { loading = false, className = "", initialOriginId, initialDestinationId },
        ref
    ) {
        const [origin, setOrigin] = useState<AutocompleteOption | null>(null);
        const [destination, setDestination] = useState<AutocompleteOption | null>(null);
        const [stations, setStations] = useState<
            Array<{ id: string; name: string; city?: string }>
        >([]);

        const getDefaultTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, "0");
            const minutes = now.getMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`;
        };

        // Initialize date to today at midnight to match date picker options
        const getDefaultDate = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        };

        const [date, setDate] = useState<Date | undefined>(getDefaultDate());
        const [time, setTime] = useState<string>(getDefaultTime());

        // Load all stations for ref methods (setOrigin, setDestination, setRoute)
        useEffect(() => {
            async function loadAllStations() {
                try {
                    const response = await fetch("/api/stations");
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            setStations(result.data);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load stations:", error);
                }
            }
            loadAllStations();
        }, []);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            setOrigin: (originId: string) => {
                const station = stations.find(s => s.id === originId);
                if (station) {
                    setOrigin({ id: station.id, label: station.name, subtitle: station.city });
                }
            },
            setDestination: (destinationId: string) => {
                const station = stations.find(s => s.id === destinationId);
                if (station) {
                    setDestination({
                        id: station.id,
                        label: station.name,
                        subtitle: station.city,
                    });
                }
            },
            setRoute: (originId: string, destinationId: string) => {
                const originStation = stations.find(s => s.id === originId);
                const destinationStation = stations.find(s => s.id === destinationId);
                if (originStation) {
                    setOrigin({
                        id: originStation.id,
                        label: originStation.name,
                        subtitle: originStation.city,
                    });
                }
                if (destinationStation) {
                    setDestination({
                        id: destinationStation.id,
                        label: destinationStation.name,
                        subtitle: destinationStation.city,
                    });
                }
            },
        }));

        const handleSwap = () => {
            const temp = origin;
            setOrigin(destination);
            setDestination(temp);
        };

        const canSearch = origin && destination && origin.id !== destination.id;

        // Build the search URL with query params
        const searchHref = useMemo(() => {
            if (!canSearch || !date) return "#";

            const dateStr = format(date, "yyyy-MM-dd");
            const params = new URLSearchParams({
                origin: origin.id,
                destination: destination.id,
                date: dateStr,
                time: time,
            });

            return `/connections?${params.toString()}`;
        }, [origin, destination, date, time, canSearch]);

        return (
            <div className={clsx(styles.form, className)}>
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <MapPin className={styles.locationIcon} />
                        <label className={styles.fieldLabel}>Start</label>
                        <div className={styles.autocompleteWrapper}>
                            <StationAutocomplete
                                value={origin}
                                onChange={setOrigin}
                                placeholder="Von..."
                                excludeStationId={destination?.id}
                                initialStationId={initialOriginId}
                            />
                        </div>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.field}>
                        <MapPin className={styles.locationIcon} />
                        <label className={styles.fieldLabel}>Ziel</label>
                        <div className={styles.autocompleteWrapper}>
                            <StationAutocomplete
                                value={destination}
                                onChange={setDestination}
                                placeholder="Nach..."
                                excludeStationId={origin?.id}
                                initialStationId={initialDestinationId}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSwap}
                        className={styles.swapButton}
                        aria-label="Swap origin and destination">
                        <ArrowUpDown className={styles.swapIcon} />
                    </button>
                </div>

                <div className={styles.dateTimeFields}>
                    <div className={styles.field}>
                        <DatePicker value={date} onChange={setDate} />
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.field}>
                        <TimePicker value={time} onChange={setTime} />
                    </div>
                </div>

                {canSearch && !loading ? (
                    <Link
                        href={searchHref}
                        className={clsx(
                            styles.searchButton,
                            styles.searchButtonLink,
                            styles.searchButtonPrimary,
                            styles.searchButtonLg,
                            styles.searchButtonFullWidth
                        )}>
                        <Search className={styles.searchButtonIcon} />
                        Verbindungen suchen
                    </Link>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!canSearch || loading}
                        loading={loading}
                        className={styles.searchButton}>
                        <Search className={styles.searchButtonIcon} />
                        Verbindungen suchen
                    </Button>
                )}
            </div>
        );
    }
);
