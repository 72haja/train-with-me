/**
 * Example static data for S1 (simplified).
 * Copy and extend this pattern for other lines and more trips.
 */
import type { StaticVvsData } from "../types";

// Station IDs aligned with mockStations / real VVS (de:region:stop)
const HERRENBERG = "de:08115:4512";
const BOEBLINGEN = "de:08115:4510";
const VAIHINGEN = "de:08111:6088";
const UNIVERSITAET = "de:08111:6118";
const HBF = "de:08111:6056";

export const exampleStaticS1: StaticVvsData = {
    lines: [
        {
            id: "s1",
            number: "S1",
            type: "S-Bahn",
            color: "#00985f",
            directions: [
                {
                    headsign: "Herrenberg",
                    stationIds: [HBF, UNIVERSITAET, VAIHINGEN, BOEBLINGEN, HERRENBERG],
                },
                {
                    headsign: "Kirchheim (Teck)",
                    stationIds: [HERRENBERG, BOEBLINGEN, VAIHINGEN, UNIVERSITAET, HBF],
                },
            ],
        },
    ],
    stations: [
        { id: HERRENBERG, name: "Herrenberg" },
        { id: BOEBLINGEN, name: "Böblingen" },
        { id: VAIHINGEN, name: "Vaihingen" },
        { id: UNIVERSITAET, name: "Universität" },
        { id: HBF, name: "Stuttgart Hbf" },
    ],
    trips: [
        {
            tripId: "s1-herrenberg-0530",
            lineId: "s1",
            directionIndex: 0, // toward Herrenberg (first station = Hbf)
            stopTimes: [
                { stationId: HBF, arrival: "05:30", departure: "05:30" },
                { stationId: UNIVERSITAET, arrival: "05:38", departure: "05:38" },
                { stationId: VAIHINGEN, arrival: "05:42", departure: "05:43" },
                { stationId: BOEBLINGEN, arrival: "05:52", departure: "05:53" },
                { stationId: HERRENBERG, arrival: "06:02", departure: "06:02" },
            ],
        },
        {
            tripId: "s1-herrenberg-0600",
            lineId: "s1",
            directionIndex: 0,
            stopTimes: [
                { stationId: HBF, arrival: "06:00", departure: "06:00" },
                { stationId: UNIVERSITAET, arrival: "06:08", departure: "06:08" },
                { stationId: VAIHINGEN, arrival: "06:12", departure: "06:13" },
                { stationId: BOEBLINGEN, arrival: "06:22", departure: "06:23" },
                { stationId: HERRENBERG, arrival: "06:32", departure: "06:32" },
            ],
        },
    ],
};
