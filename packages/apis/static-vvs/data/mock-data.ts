/**
 * Mock static VVS data for testing the static API model.
 * S1–S6 with trips every 30 minutes throughout the day.
 */
import type { StaticTrip, StaticVvsData } from "@apis/static-vvs/types";

// Station IDs (match mockStations / real VVS)
const HBF = "de:08111:6056";
const BAD_CANNSTATT = "de:08111:6057";
const UNIVERSITAET = "de:08111:6118";
const VAIHINGEN = "de:08111:6088";
const BOEBLINGEN = "de:08115:4510";
const HERRENBERG = "de:08115:4512";
const FLUGHAFEN = "de:08111:6553";
const LEINFELDEN = "de:08116:3720";
const BACKNANG = "de:08119:5070";
const GERLINGEN = "de:08118:7418";

/** S1 direction 0: Hbf → Herrenberg. Direction 1: Herrenberg → Hbf. */
const s1ToHerrenberg = [HBF, UNIVERSITAET, VAIHINGEN, BOEBLINGEN, HERRENBERG];
const s1ToHbf = [...s1ToHerrenberg].reverse();

/** S2 direction 0: Hbf → Flughafen. Direction 1: Flughafen → Hbf. */
const s2ToFlughafen = [HBF, BAD_CANNSTATT, LEINFELDEN, FLUGHAFEN];
const s2ToHbf = [...s2ToFlughafen].reverse();

/** S3 direction 0: Hbf → Backnang. Direction 1: Backnang → Hbf. */
const s3ToBacknang = [HBF, BAD_CANNSTATT, BACKNANG];
const s3ToHbf = [...s3ToBacknang].reverse();

/** S4 direction 0: Hbf → Flughafen via Süd. Direction 1: Flughafen → Hbf. */
const s4ToFlughafen = [HBF, UNIVERSITAET, VAIHINGEN, LEINFELDEN, FLUGHAFEN];
const s4ToHbf = [...s4ToFlughafen].reverse();

/** S5 direction 0: Hbf → Herrenberg (via Böblingen). Direction 1: Herrenberg → Hbf. */
const s5ToHerrenberg = [HBF, BOEBLINGEN, HERRENBERG];
const s5ToHbf = [...s5ToHerrenberg].reverse();

/** S6 direction 0: Hbf → Gerlingen. Direction 1: Gerlingen → Hbf. */
const s6ToGerlingen = [HBF, GERLINGEN];
const s6ToHbf = [...s6ToGerlingen].reverse();

/** Running times in minutes from first station to each stop (first = 0). */
const s1RunningMinutes = [0, 8, 13, 23, 32];
const s2RunningMinutes = [0, 6, 18, 28];
const s3RunningMinutes = [0, 8, 25];
const s4RunningMinutes = [0, 8, 15, 28, 38];
const s5RunningMinutes = [0, 22, 32];
const s6RunningMinutes = [0, 18];

const TRIP_INTERVAL_MINUTES = 30;

function addMinutes(h: number, m: number, add: number): string {
    const total = h * 60 + m + add;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Default platform by stop index (1-based for display). */
function defaultPlatforms(length: number): string[] {
    return Array.from({ length }, (_, i) => String(i + 1));
}

/** Generate trips for one direction with given running times and station list. */
function buildTrips(
    lineId: string,
    directionIndex: number,
    stationIds: string[],
    runningMinutes: number[],
    startTime: string,
    endTime: string,
    directionLabel: string,
    platforms?: string[]
): StaticTrip[] {
    const platformList = platforms ?? defaultPlatforms(stationIds.length);
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startTotal = startH! * 60 + startM!;
    const endTotal = endH! * 60 + endM!;
    const trips: StaticTrip[] = [];
    for (let t = startTotal; t <= endTotal; t += TRIP_INTERVAL_MINUTES) {
        const h = Math.floor(t / 60) % 24;
        const m = t % 60;
        const dep = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const times = runningMinutes.map(add => addMinutes(h, m, add));
        const suffix = dep.replace(":", "");
        trips.push({
            tripId: `${lineId}-${directionLabel}-${suffix}`,
            lineId,
            directionIndex,
            stopTimes: stationIds.map((stationId, i) => ({
                stationId,
                arrival: times[i]!,
                departure: times[i]!,
                platform: platformList[i],
            })),
        });
    }
    return trips;
}

export const staticVvsMockData: StaticVvsData = {
    lines: [
        {
            id: "s1",
            number: "S1",
            type: "S-Bahn",
            color: "#00985f",
            directions: [
                { headsign: "Herrenberg", stationIds: s1ToHerrenberg },
                { headsign: "Kirchheim (Teck)", stationIds: s1ToHbf },
            ],
        },
        {
            id: "s2",
            number: "S2",
            type: "S-Bahn",
            color: "#dc281e",
            directions: [
                { headsign: "Flughafen/Messe", stationIds: s2ToFlughafen },
                { headsign: "Schorndorf", stationIds: s2ToHbf },
            ],
        },
        {
            id: "s3",
            number: "S3",
            type: "S-Bahn",
            color: "#ffd500",
            directions: [
                { headsign: "Backnang", stationIds: s3ToBacknang },
                { headsign: "Hbf", stationIds: s3ToHbf },
            ],
        },
        {
            id: "s4",
            number: "S4",
            type: "S-Bahn",
            color: "#00a5e3",
            directions: [
                { headsign: "Flughafen/Messe", stationIds: s4ToFlughafen },
                { headsign: "Hbf", stationIds: s4ToHbf },
            ],
        },
        {
            id: "s5",
            number: "S5",
            type: "S-Bahn",
            color: "#f18700",
            directions: [
                { headsign: "Herrenberg", stationIds: s5ToHerrenberg },
                { headsign: "Hbf", stationIds: s5ToHbf },
            ],
        },
        {
            id: "s6",
            number: "S6",
            type: "S-Bahn",
            color: "#00543c",
            directions: [
                { headsign: "Gerlingen", stationIds: s6ToGerlingen },
                { headsign: "Hbf", stationIds: s6ToHbf },
            ],
        },
    ],
    stations: [
        { id: HBF, name: "Stuttgart Hbf" },
        { id: BAD_CANNSTATT, name: "Bad Cannstatt" },
        { id: UNIVERSITAET, name: "Universität" },
        { id: VAIHINGEN, name: "Vaihingen" },
        { id: BOEBLINGEN, name: "Böblingen" },
        { id: HERRENBERG, name: "Herrenberg" },
        { id: FLUGHAFEN, name: "Flughafen/Messe" },
        { id: LEINFELDEN, name: "Leinfelden" },
        { id: BACKNANG, name: "Backnang" },
        { id: GERLINGEN, name: "Gerlingen" },
    ],
    trips: [
        // S1: every 30 min
        ...buildTrips(
            "s1",
            0,
            s1ToHerrenberg,
            s1RunningMinutes,
            "05:30",
            "23:30",
            "herrenberg"
        ),
        ...buildTrips("s1", 1, s1ToHbf, s1RunningMinutes, "06:00", "23:30", "hbf"),
        // S2: every 30 min
        ...buildTrips(
            "s2",
            0,
            s2ToFlughafen,
            s2RunningMinutes,
            "06:00",
            "23:30",
            "flughafen"
        ),
        ...buildTrips("s2", 1, s2ToHbf, s2RunningMinutes, "06:30", "23:30", "hbf"),
        // S3: every 30 min
        ...buildTrips("s3", 0, s3ToBacknang, s3RunningMinutes, "05:30", "23:30", "backnang"),
        ...buildTrips("s3", 1, s3ToHbf, s3RunningMinutes, "06:00", "23:30", "hbf"),
        // S4: every 30 min
        ...buildTrips("s4", 0, s4ToFlughafen, s4RunningMinutes, "06:00", "23:30", "flughafen"),
        ...buildTrips("s4", 1, s4ToHbf, s4RunningMinutes, "06:30", "23:30", "hbf"),
        // S5: every 30 min
        ...buildTrips("s5", 0, s5ToHerrenberg, s5RunningMinutes, "05:30", "23:30", "herrenberg"),
        ...buildTrips("s5", 1, s5ToHbf, s5RunningMinutes, "06:00", "23:30", "hbf"),
        // S6: every 30 min
        ...buildTrips("s6", 0, s6ToGerlingen, s6RunningMinutes, "05:30", "23:30", "gerlingen"),
        ...buildTrips("s6", 1, s6ToHbf, s6RunningMinutes, "06:00", "23:30", "hbf"),
    ],
};
