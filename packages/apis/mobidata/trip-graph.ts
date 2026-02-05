/**
 * Trip Graph Builder and Path Finding
 *
 * Builds a graph structure from GTFS connections and finds paths
 * between stations, including multi-hop journeys with transfers.
 */
import type { Connection as MobidataConnection } from "./types";

/**
 * Represents a segment of a trip between two stations
 */
export interface TripSegment {
    tripId: string;
    fromStationId: string;
    toStationId: string;
    departureTime: string; // ISO timestamp
    arrivalTime: string; // ISO timestamp
    routeInfo: {
        routeId: string;
        routeShortName: string;
        tripHeadsign: string;
        routeType: string;
    };
    connectionId: string;
    fromStopSequence: number;
    toStopSequence: number;
}

/**
 * Node in the trip graph representing a station
 */
export interface StationNode {
    stationId: string;
    outgoingSegments: TripSegment[];
    incomingSegments: TripSegment[];
}

/**
 * Trip graph structure
 */
export interface TripGraph {
    stations: Map<string, StationNode>;
    trips: Map<string, MobidataConnection[]>; // trip_id -> ordered connections
}

/**
 * Represents a path through the graph
 */
export interface PathSegment {
    segment: TripSegment;
    isTransfer: boolean; // true if this segment starts after a transfer
}

export interface JourneyPath {
    segments: PathSegment[];
    departureTime: string;
    arrivalTime: string;
    transferCount: number;
}

/**
 * Build a trip graph from connections
 * Groups connections by trip and builds station nodes with edges
 */
export function buildTripGraph(connections: MobidataConnection[]): TripGraph {
    const stations = new Map<string, StationNode>();
    const trips = new Map<string, MobidataConnection[]>();

    // Group connections by trip_id
    for (const conn of connections) {
        if (!trips.has(conn.trip_id)) {
            trips.set(conn.trip_id, []);
        }
        trips.get(conn.trip_id)!.push(conn);
    }

    // Sort connections within each trip by stop sequence
    for (const tripId of Array.from(trips.keys())) {
        const tripConnections = trips.get(tripId);
        if (tripConnections) {
            tripConnections.sort((a, b) => a.from_stop_sequence - b.from_stop_sequence);
        }
    }

    // Build station nodes and edges
    for (const conn of connections) {
        const fromStationId = conn.from_station_id || conn.from_stop_id;
        const toStationId = conn.to_station_id || conn.to_stop_id;

        // Ensure station nodes exist
        if (!stations.has(fromStationId)) {
            stations.set(fromStationId, {
                stationId: fromStationId,
                outgoingSegments: [],
                incomingSegments: [],
            });
        }
        if (!stations.has(toStationId)) {
            stations.set(toStationId, {
                stationId: toStationId,
                outgoingSegments: [],
                incomingSegments: [],
            });
        }

        const fromNode = stations.get(fromStationId)!;
        const toNode = stations.get(toStationId)!;

        // Create trip segment
        const segment: TripSegment = {
            tripId: conn.trip_id,
            fromStationId,
            toStationId,
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

        // Add to graph
        fromNode.outgoingSegments.push(segment);
        toNode.incomingSegments.push(segment);
    }

    return { stations, trips };
}

/**
 * Get all stops for a trip in order
 */
export function getTripStops(
    tripId: string,
    connections: MobidataConnection[]
): Array<{
    stationId: string;
    stopSequence: number;
    arrivalTime?: string;
    departureTime?: string;
}> {
    const tripConnections = connections.filter(c => c.trip_id === tripId);
    tripConnections.sort((a, b) => a.from_stop_sequence - b.from_stop_sequence);

    const stops: Array<{
        stationId: string;
        stopSequence: number;
        arrivalTime?: string;
        departureTime?: string;
    }> = [];

    // Add first stop (departure)
    if (tripConnections.length > 0) {
        const first = tripConnections[0];
        if (first) {
            stops.push({
                stationId: first.from_station_id || first.from_stop_id,
                stopSequence: first.from_stop_sequence,
                departureTime: first.t_departure,
            });
        }
    }

    // Add all intermediate and final stops
    for (const conn of tripConnections) {
        const stationId = conn.to_station_id || conn.to_stop_id;
        stops.push({
            stationId,
            stopSequence: conn.to_stop_sequence,
            arrivalTime: conn.t_arrival,
            departureTime: conn.t_departure, // This is the departure from the previous stop
        });
    }

    // Remove duplicates while preserving order
    const uniqueStops = Array.from(
        new Map(stops.map(s => [s.stationId + s.stopSequence, s])).values()
    );

    return uniqueStops;
}

/**
 * Add minutes to an ISO timestamp string
 */
function addMinutes(isoString: string, minutes: number): string {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}

/**
 * Compare two ISO timestamp strings
 * Returns true if time1 <= time2
 */
function isBeforeOrEqual(time1: string, time2: string): boolean {
    return new Date(time1) <= new Date(time2);
}

/**
 * Find all paths from origin to destination using BFS
 *
 * @param originId Origin station ID
 * @param destinationId Destination station ID
 * @param graph Trip graph
 * @param maxTransfers Maximum number of transfers allowed (default: unlimited)
 * @param minTransferTime Minimum transfer time in minutes (default: 2)
 * @param targetDate Optional date filter (YYYY-MM-DD)
 * @param targetTime Optional time filter (HH:MM:SS) - minimum departure time
 */
export function findPaths(
    originId: string,
    destinationId: string,
    graph: TripGraph,
    maxTransfers: number = 10,
    minTransferTime: number = 2,
    targetDate?: string,
    targetTime?: string
): JourneyPath[] {
    const paths: JourneyPath[] = [];
    const originNode = graph.stations.get(originId);
    const destinationNode = graph.stations.get(destinationId);

    if (!originNode || !destinationNode) {
        return [];
    }

    // BFS queue: [currentStation, currentTripId, pathSegments, arrivalTime, transferCount]
    type QueueItem = {
        stationId: string;
        currentTripId: string | null;
        pathSegments: PathSegment[];
        arrivalTime: string | null; // null if at origin
        transferCount: number;
    };

    const queue: QueueItem[] = [
        {
            stationId: originId,
            currentTripId: null,
            pathSegments: [],
            arrivalTime: null,
            transferCount: 0,
        },
    ];

    const visited = new Set<string>(); // Track visited states to avoid cycles

    while (queue.length > 0) {
        const current = queue.shift()!;
        const { stationId, currentTripId, pathSegments, arrivalTime, transferCount } = current;

        // Check if we reached destination
        if (stationId === destinationId && pathSegments.length > 0) {
            const firstSegment = pathSegments[0];
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (firstSegment && lastSegment) {
                const journeyPath: JourneyPath = {
                    segments: pathSegments,
                    departureTime: firstSegment.segment.departureTime,
                    arrivalTime: lastSegment.segment.arrivalTime,
                    transferCount,
                };
                paths.push(journeyPath);
            }
            continue;
        }

        // Prevent infinite loops
        if (transferCount > maxTransfers) {
            continue;
        }

        const stationNode = graph.stations.get(stationId);
        if (!stationNode) {
            continue;
        }

        // Get all possible next segments from this station
        for (const segment of stationNode.outgoingSegments) {
            // Filter by date if provided
            if (targetDate) {
                const segmentDate = new Date(segment.departureTime).toISOString().split("T")[0];
                if (segmentDate !== targetDate) {
                    continue;
                }
            }

            // Filter by time if provided (only for first segment)
            if (targetTime && pathSegments.length === 0) {
                const segmentTimeParts = new Date(segment.departureTime).toISOString().split("T");
                if (segmentTimeParts.length > 1) {
                    const segmentTime = segmentTimeParts[1]?.split(".")[0];
                    if (segmentTime && segmentTime < targetTime) {
                        continue;
                    }
                }
            }

            // Check if we can use this segment
            const isSameTrip = segment.tripId === currentTripId;
            const isNewTrip = currentTripId === null || !isSameTrip;

            // If transferring, check minimum transfer time
            if (isNewTrip && arrivalTime !== null) {
                const minDepartureTime = addMinutes(arrivalTime, minTransferTime);
                if (!isBeforeOrEqual(minDepartureTime, segment.departureTime)) {
                    continue; // Not enough time for transfer
                }
            }

            // Check if we've already visited this state
            const stateKey = `${stationId}-${segment.tripId}-${segment.toStationId}-${transferCount}`;
            if (visited.has(stateKey)) {
                continue;
            }
            visited.add(stateKey);

            // Add to queue
            queue.push({
                stationId: segment.toStationId,
                currentTripId: segment.tripId,
                pathSegments: [
                    ...pathSegments,
                    {
                        segment,
                        isTransfer: isNewTrip && pathSegments.length > 0,
                    },
                ],
                arrivalTime: segment.arrivalTime,
                transferCount:
                    isNewTrip && pathSegments.length > 0 ? transferCount + 1 : transferCount,
            });
        }
    }

    // Sort by departure time
    paths.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    return paths;
}
