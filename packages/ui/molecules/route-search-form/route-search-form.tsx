"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { ArrowUpDown, MapPin, Search } from "lucide-react";
import { mockStations, stationsToOptions } from "@apis/mockStations";
import { Autocomplete, type AutocompleteOption } from "@ui/atoms/autocomplete";
import { Button } from "@ui/atoms/button";
import { DatePicker } from "@ui/molecules/date-picker";
import { TimePicker } from "@ui/molecules/time-picker";
import styles from "./route-search-form.module.scss";

interface RouteSearchFormProps {
    onSearch: (originId: string, destinationId: string, departureTime: string) => void;
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
        { onSearch, loading = false, className = "", initialOriginId, initialDestinationId },
        ref
    ) {
        const [origin, setOrigin] = useState<AutocompleteOption | null>(null);
        const [destination, setDestination] = useState<AutocompleteOption | null>(null);

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

        // Set initial values from props
        useEffect(() => {
            if (initialOriginId) {
                const station = mockStations.find(s => s.id === initialOriginId);
                if (station) {
                    setOrigin({ id: station.id, label: station.name, subtitle: station.city });
                }
            }
        }, [initialOriginId]);

        useEffect(() => {
            if (initialDestinationId) {
                const station = mockStations.find(s => s.id === initialDestinationId);
                if (station) {
                    setDestination({
                        id: station.id,
                        label: station.name,
                        subtitle: station.city,
                    });
                }
            }
        }, [initialDestinationId]);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            setOrigin: (originId: string) => {
                const station = mockStations.find(s => s.id === originId);
                if (station) {
                    setOrigin({ id: station.id, label: station.name, subtitle: station.city });
                }
            },
            setDestination: (destinationId: string) => {
                const station = mockStations.find(s => s.id === destinationId);
                if (station) {
                    setDestination({
                        id: station.id,
                        label: station.name,
                        subtitle: station.city,
                    });
                }
            },
            setRoute: (originId: string, destinationId: string) => {
                const originStation = mockStations.find(s => s.id === originId);
                const destinationStation = mockStations.find(s => s.id === destinationId);
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

        const stationOptionsStart = stationsToOptions(mockStations, destination?.id);
        const stationOptionsDestination = stationsToOptions(mockStations, origin?.id);

        const handleSearch = () => {
            if (origin && destination && date) {
                // Combine date and time into ISO 8601 format
                const dateStr = format(date, "yyyy-MM-dd");
                const departureTime = new Date(`${dateStr}T${time}`).toISOString();
                onSearch(origin.id, destination.id, departureTime);
            }
        };

        const handleSwap = () => {
            const temp = origin;
            setOrigin(destination);
            setDestination(temp);
        };

        const canSearch = origin && destination && origin.id !== destination.id;

        return (
            <div className={clsx(styles.form, className)}>
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <MapPin className={styles.locationIcon} />
                        <label className={styles.fieldLabel}>Start</label>
                        <div className={styles.autocompleteWrapper}>
                            <Autocomplete
                                options={stationOptionsStart}
                                value={origin}
                                onChange={setOrigin}
                                placeholder="Von..."
                            />
                        </div>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.field}>
                        <MapPin className={styles.locationIcon} />
                        <label className={styles.fieldLabel}>Ziel</label>
                        <div className={styles.autocompleteWrapper}>
                            <Autocomplete
                                options={stationOptionsDestination}
                                value={destination}
                                onChange={setDestination}
                                placeholder="Nach..."
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
);
