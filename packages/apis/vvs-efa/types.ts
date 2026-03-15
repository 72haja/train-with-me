/**
 * VVS EFA API response types
 */

// --- Station search ---

export interface EfaStopFinderPoint {
    usage: string;
    type: string;
    name: string;
    stateless: string;
    anyType: string;
    quality: string;
    best: string;
    object: string;
    ref: {
        id: string;
        gid: string;
        omc: string;
        placeID: string;
        place: string;
        coords?: string;
    };
}

export interface EfaStopFinderResponse {
    stopFinder: {
        input: { input: string };
        points: EfaStopFinderPoint[] | { point: EfaStopFinderPoint };
    };
}

// --- Departures ---

export interface EfaDateTime {
    year: string;
    month: string;
    day: string;
    weekday: string;
    hour: string;
    minute: string;
}

export interface EfaServingLine {
    key: string;
    number: string;
    symbol: string;
    motType: string;
    direction: string;
    directionFrom: string;
    name: string;
    delay: string;
    realtime: string;
    destID: string;
    stateless: string;
}

export interface EfaDeparture {
    stopID: string;
    stopName: string;
    nameWO: string;
    platform: string;
    platformName: string;
    pointType: string;
    countdown: string;
    dateTime: EfaDateTime;
    realDateTime?: EfaDateTime;
    realtimeTripStatus?: string;
    servingLine: EfaServingLine;
    operator?: {
        code: string;
        name: string;
        publicCode: string;
    };
}

export interface EfaDepartureResponse {
    departureList: EfaDeparture[] | null;
}

// --- Trip request ---

export interface EfaTripPoint {
    name: string;
    nameWO: string;
    place: string;
    nameWithPlace: string;
    platformName: string;
    plannedPlatformName: string;
    usage: "departure" | "arrival";
    pointType: string;
    dateTime: {
        date: string;
        time: string;
        rtDate?: string;
        rtTime?: string;
    };
    stamp: {
        date: string;
        time: string;
        rtDate?: string;
        rtTime?: string;
    };
    ref: {
        id: string;
        gid: string;
        area: string;
        platform: string;
        coords?: string;
    };
}

export interface EfaStopSeqItem {
    name: string;
    nameWO: string;
    place: string;
    platformName: string;
    ref: {
        id: string;
        gid: string;
        coords?: string;
        arrDateTime?: string;
        depDateTime?: string;
        arrDelay?: string;
        depDelay?: string;
    };
}

export interface EfaTripLegMode {
    name: string;
    number: string;
    symbol: string;
    product: string;
    productId: string;
    type: string;
    destination: string;
    destID: string;
    desc: string;
    diva?: {
        line: string;
        operator: string;
        opPublicCode: string;
        stateless: string;
    };
}

export interface EfaTripLeg {
    timeMinute: string;
    points: EfaTripPoint[];
    mode: EfaTripLegMode;
    stopSeq?: EfaStopSeqItem[];
}

export interface EfaTrip {
    duration: string;
    legs: EfaTripLeg[];
}

export interface EfaTripResponse {
    trips: EfaTrip[];
}
