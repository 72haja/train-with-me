/**
 * Line-based connection search
 *
 * Simpler approach: Check which S-Bahn lines serve origin and destination,
 * then find direct connections (same line) or transfer connections (different lines).
 */
import { format } from "date-fns";
import { getConnections } from "./api/connections";
import { PostgrestFilters } from "./postgrest";
import type { JourneyPath, PathSegment, TripSegment } from "./trip-graph";

/**
 * Get all S-Bahn lines (S1-S60) that serve a station
 */
export async function getLinesForStation(stationId: string): Promise<Set<string>> {
    const lines = new Set<string>();

    try {
        // Get connections from this station to see which lines serve it
        const connections = await getConnections({
            from_station_id: PostgrestFilters.eq(stationId),
            limit: 5, // Get enough to find all lines
        });

        for (const conn of connections) {
            // Check if it's an S-Bahn line (S1-S60)
            const routeShortName = conn.route_short_name;
            if (routeShortName && /^S\d+$/.test(routeShortName)) {
                lines.add(routeShortName);
            }
        }
    } catch (error) {
        console.error(`Error getting lines for station ${stationId}:`, error);
    }
    console.log("lines", lines);

    return lines;
}

/**
 * Find transfer stations where two lines meet
 * Supports both route_short_name and route_id
 */
export async function findTransferStations(line1: string, line2: string): Promise<string[]> {
    const transferStations = new Set<string>();

    try {
        // Determine if line1 is a route_short_name or route_id
        const isLine1ShortName = /^[SU]\d+$/.test(line1);
        const line1Param = isLine1ShortName
            ? { route_short_name: PostgrestFilters.eq(line1) }
            : { route_id: PostgrestFilters.eq(line1) };

        // Get stations on line1
        const line1Connections = await getConnections({
            ...line1Param,
            limit: 100,
        });

        const line1Stations = new Set<string>();
        for (const conn of line1Connections) {
            if (conn.from_station_id) line1Stations.add(conn.from_station_id);
            if (conn.to_station_id) line1Stations.add(conn.to_station_id);
        }

        // Determine if line2 is a route_short_name or route_id
        const isLine2ShortName = /^[SU]\d+$/.test(line2);
        const line2Param = isLine2ShortName
            ? { route_short_name: PostgrestFilters.eq(line2) }
            : { route_id: PostgrestFilters.eq(line2) };

        // Get stations on line2
        const line2Connections = await getConnections({
            ...line2Param,
            limit: 100,
        });

        const line2Stations = new Set<string>();
        for (const conn of line2Connections) {
            if (conn.from_station_id) line2Stations.add(conn.from_station_id);
            if (conn.to_station_id) line2Stations.add(conn.to_station_id);
        }

        // Find intersection (stations on both lines)
        for (const station of line1Stations) {
            if (line2Stations.has(station)) {
                transferStations.add(station);
            }
        }
    } catch (error) {
        console.error(`Error finding transfer stations between ${line1} and ${line2}:`, error);
    }

    return Array.from(transferStations);
}

/**
 * Find direct connections on the same line
 */
async function findDirectConnections(
    originId: string,
    destinationId: string,
    line: string,
    targetDate?: string,
    targetTime?: string
): Promise<JourneyPath[]> {
    const paths: JourneyPath[] = [];

    try {
        // Get connections from origin on this line
        // Support both route_short_name and route_id
        const isShortName = /^[SU]\d+$/.test(line);
        const lineParam = isShortName
            ? { route_short_name: PostgrestFilters.eq(line) }
            : { route_id: PostgrestFilters.eq(line) };

        const connections = await getConnections({
            from_station_id: PostgrestFilters.eq(originId),
            ...lineParam,
            limit: 50,
        });

        // Filter by date if provided
        let filteredConnections = connections;
        if (targetDate) {
            filteredConnections = connections.filter(conn => {
                const connDate = conn.date.split("T")[0];
                return connDate === targetDate;
            });
        }

        // Filter by time if provided
        if (targetTime && filteredConnections.length > 0) {
            filteredConnections = filteredConnections.filter(conn => {
                const timeParts = new Date(conn.t_departure).toISOString().split("T");
                if (timeParts.length > 1) {
                    const timePart = timeParts[1];
                    const connTime = timePart ? timePart.split(".")[0] : undefined;
                    return connTime ? connTime >= targetTime : false;
                }
                return false;
            });
        }

        // For each connection, check if the trip goes to destination
        for (const conn of filteredConnections) {
            // Get full trip to check if destination is on it
            const tripConnections = await getConnections({
                trip_id: PostgrestFilters.eq(conn.trip_id),
                limit: 200,
            });

            // Sort by stop sequence
            tripConnections.sort((a, b) => a.from_stop_sequence - b.from_stop_sequence);

            // Find origin connection in trip
            const originConn = tripConnections.find(
                c => c.from_station_id === originId || c.from_stop_id === originId
            );

            if (!originConn) {
                continue;
            }

            // Find destination connection in trip (must be after origin)
            const destConn = tripConnections.find(
                c =>
                    (c.to_station_id === destinationId || c.to_stop_id === destinationId) &&
                    c.from_stop_sequence >= originConn.from_stop_sequence
            );

            if (destConn && conn.route_short_name) {
                const tripSegment: TripSegment = {
                    tripId: conn.trip_id,
                    fromStationId: originId,
                    toStationId: destinationId,
                    departureTime: originConn.t_departure,
                    arrivalTime: destConn.t_arrival,
                    routeInfo: {
                        routeId: conn.route_id,
                        routeShortName: conn.route_short_name,
                        tripHeadsign: conn.trip_headsign,
                        routeType: conn.route_type,
                    },
                    connectionId: destConn.connection_id,
                    fromStopSequence: originConn.from_stop_sequence,
                    toStopSequence: destConn.to_stop_sequence,
                };

                const pathSegment: PathSegment = {
                    segment: tripSegment,
                    isTransfer: false,
                };

                paths.push({
                    segments: [pathSegment],
                    departureTime: originConn.t_departure,
                    arrivalTime: destConn.t_arrival,
                    transferCount: 0,
                });
            }
        }
    } catch (error) {
        console.error(`Error finding direct connections on ${line}:`, error);
    }

    return paths;
}

/**
 * Find transfer connections (origin -> transfer station -> destination)
 */
async function findTransferConnections(
    originId: string,
    destinationId: string,
    originLine: string,
    destinationLine: string,
    transferStationId: string,
    targetDate?: string,
    targetTime?: string
): Promise<JourneyPath[]> {
    const paths: JourneyPath[] = [];

    try {
        // Step 1: Find connections from origin to transfer station on originLine
        const isOriginShortName = /^[SU]\d+$/.test(originLine);
        const originLineParam = isOriginShortName
            ? { route_short_name: PostgrestFilters.eq(originLine) }
            : { route_id: PostgrestFilters.eq(originLine) };

        const originToTransfer = await getConnections({
            from_station_id: PostgrestFilters.eq(originId),
            to_station_id: PostgrestFilters.eq(transferStationId),
            ...originLineParam,
            limit: 20,
        });

        // Step 2: Find connections from transfer station to destination on destinationLine
        const isDestShortName = /^[SU]\d+$/.test(destinationLine);
        const destLineParam = isDestShortName
            ? { route_short_name: PostgrestFilters.eq(destinationLine) }
            : { route_id: PostgrestFilters.eq(destinationLine) };

        const transferToDestination = await getConnections({
            from_station_id: PostgrestFilters.eq(transferStationId),
            to_station_id: PostgrestFilters.eq(destinationId),
            ...destLineParam,
            limit: 20,
        });

        // Filter by date
        let filteredOrigin = originToTransfer;
        let filteredDestination = transferToDestination;

        if (targetDate) {
            filteredOrigin = originToTransfer.filter(c => c.date.split("T")[0] === targetDate);
            filteredDestination = transferToDestination.filter(
                c => c.date.split("T")[0] === targetDate
            );
        }

        // Filter by time (only for first segment)
        if (targetTime && filteredOrigin.length > 0) {
            filteredOrigin = filteredOrigin.filter(c => {
                const timeParts = new Date(c.t_departure).toISOString().split("T");
                if (timeParts.length > 1) {
                    const timePart = timeParts[1];
                    const connTime = timePart ? timePart.split(".")[0] : undefined;
                    return connTime ? connTime >= targetTime : false;
                }
                return false;
            });
        }

        // Match connections: find transfer pairs with 2+ minute gap
        for (const originConn of filteredOrigin) {
            const arrivalTime = new Date(originConn.t_arrival);
            const minDepartureTime = new Date(arrivalTime.getTime() + 2 * 60 * 1000); // 2 minutes

            for (const destConn of filteredDestination) {
                const departureTime = new Date(destConn.t_departure);

                if (
                    departureTime >= minDepartureTime &&
                    originConn.route_short_name &&
                    destConn.route_short_name
                ) {
                    const tripSegment1: TripSegment = {
                        tripId: originConn.trip_id,
                        fromStationId: originId,
                        toStationId: transferStationId,
                        departureTime: originConn.t_departure,
                        arrivalTime: originConn.t_arrival,
                        routeInfo: {
                            routeId: originConn.route_id,
                            routeShortName: originConn.route_short_name,
                            tripHeadsign: originConn.trip_headsign,
                            routeType: originConn.route_type,
                        },
                        connectionId: originConn.connection_id,
                        fromStopSequence: originConn.from_stop_sequence,
                        toStopSequence: originConn.to_stop_sequence,
                    };

                    const tripSegment2: TripSegment = {
                        tripId: destConn.trip_id,
                        fromStationId: transferStationId,
                        toStationId: destinationId,
                        departureTime: destConn.t_departure,
                        arrivalTime: destConn.t_arrival,
                        routeInfo: {
                            routeId: destConn.route_id,
                            routeShortName: destConn.route_short_name,
                            tripHeadsign: destConn.trip_headsign,
                            routeType: destConn.route_type,
                        },
                        connectionId: destConn.connection_id,
                        fromStopSequence: destConn.from_stop_sequence,
                        toStopSequence: destConn.to_stop_sequence,
                    };

                    const pathSegment1: PathSegment = {
                        segment: tripSegment1,
                        isTransfer: false,
                    };

                    const pathSegment2: PathSegment = {
                        segment: tripSegment2,
                        isTransfer: true,
                    };

                    paths.push({
                        segments: [pathSegment1, pathSegment2],
                        departureTime: originConn.t_departure,
                        arrivalTime: destConn.t_arrival,
                        transferCount: 1,
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error finding transfer connections:`, error);
    }

    return paths;
}

/**
 * Line-based connection search
 */
export async function searchConnectionsByLine(
    originId: string,
    destinationId: string,
    date?: string
): Promise<JourneyPath[]> {
    console.log("=============== searchConnectionsByLine ===============");
    try {
        // Step 1: Get lines serving origin and destination
        const originLines = await getLinesForStation(originId);
        console.log("originLines", originLines);
        const destinationLines = await getLinesForStation(destinationId);
        console.log("destinationLines", destinationLines);

        if (originLines.size === 0 || destinationLines.size === 0) {
            return [];
        }

        // Extract date and time
        let targetDate: string | undefined;
        let targetTime: string | undefined;

        if (date) {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
                targetDate = format(dateObj, "yyyy-MM-dd");
                const hours = String(dateObj.getHours()).padStart(2, "0");
                const minutes = String(dateObj.getMinutes()).padStart(2, "0");
                const seconds = String(dateObj.getSeconds()).padStart(2, "0");
                targetTime = `${hours}:${minutes}:${seconds}`;
            }
        }

        const allPaths: JourneyPath[] = [];

        // Step 2: Check for direct connections (same line)
        const commonLines = Array.from(originLines).filter(line => destinationLines.has(line));

        for (const line of commonLines) {
            const directPaths = await findDirectConnections(
                originId,
                destinationId,
                line,
                targetDate,
                targetTime
            );
            allPaths.push(...directPaths);
        }

        // Step 2b: Also check for direct connections regardless of line matching
        // (in case stations are on different lines but there's a direct connection)
        if (allPaths.length === 0) {
            // Try finding any direct connection
            try {
                const directConnections = await getConnections({
                    from_station_id: PostgrestFilters.eq(originId),
                    to_station_id: PostgrestFilters.eq(destinationId),
                    limit: 20,
                });

                // Filter by date/time
                let filtered = directConnections;
                if (targetDate) {
                    filtered = filtered.filter(c => c.date.split("T")[0] === targetDate);
                }
                if (targetTime && filtered.length > 0) {
                    filtered = filtered.filter(c => {
                        const timeParts = new Date(c.t_departure).toISOString().split("T");
                        if (timeParts.length > 1) {
                            const timePart = timeParts[1];
                            const connTime = timePart ? timePart.split(".")[0] : undefined;
                            return connTime ? connTime >= targetTime : false;
                        }
                        return false;
                    });
                }

                // Convert to JourneyPath
                for (const conn of filtered) {
                    if (conn.route_short_name) {
                        const tripSegment: TripSegment = {
                            tripId: conn.trip_id,
                            fromStationId: originId,
                            toStationId: destinationId,
                            departureTime: conn.t_departure,
                            arrivalTime: conn.t_arrival,
                            routeInfo: {
                                routeId: conn.route_id,
                                routeShortName: conn.route_short_name,
                                tripHeadsign: conn.trip_headsign,
                                routeType: conn.route_type,
                            },
                            connectionId: conn.connection_id,
                            fromStopSequence: conn.from_stop_sequence,
                            toStopSequence: conn.to_stop_sequence,
                        };

                        const pathSegment: PathSegment = {
                            segment: tripSegment,
                            isTransfer: false,
                        };

                        allPaths.push({
                            segments: [pathSegment],
                            departureTime: conn.t_departure,
                            arrivalTime: conn.t_arrival,
                            transferCount: 0,
                        });
                    }
                }
            } catch (error) {
                console.error("Error finding direct connections:", error);
            }
        }

        // Step 3: Check for transfer connections (different lines)
        const originLinesArray = Array.from(originLines);
        const destinationLinesArray = Array.from(destinationLines);

        for (const originLine of originLinesArray) {
            for (const destinationLine of destinationLinesArray) {
                if (originLine === destinationLine) {
                    continue; // Already handled above
                }

                // Find transfer stations
                const transferStations = await findTransferStations(originLine, destinationLine);

                for (const transferStation of transferStations.slice(0, 3)) {
                    // Limit to 3 transfer stations to avoid too many API calls
                    const transferPaths = await findTransferConnections(
                        originId,
                        destinationId,
                        originLine,
                        destinationLine,
                        transferStation,
                        targetDate,
                        targetTime
                    );
                    allPaths.push(...transferPaths);
                }
            }
        }

        // Sort by departure time
        allPaths.sort(
            (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );

        return allPaths.slice(0, 10); // Limit to 10 results
    } catch (error) {
        console.error("Error in line-based search:", error);
        return [];
    }
}
