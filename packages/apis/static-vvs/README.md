# Static VVS API – Model structure

When the live VVS/MobiData API is not available, you can serve connections from **static data** (e.g. from PDF timetables). Times won’t update in real time; if a connection isn’t in the data, it won’t be returned.

## Test API routes (mock data)

Use these routes to test the model before implementing in Supabase:

| Method | Route | Description |
|--------|--------|-------------|
| POST | `/api/static-vvs/connections/search` | Same body as `/api/connections/search` (`originId`, `destinationId`, `date`, `time`). Returns `{ journeys }`. |
| GET | `/api/static-vvs/lines` | List all lines (S1, S2, …) with directions and station IDs. |
| GET | `/api/static-vvs/lines/[lineId]` | One line with directions and station names (e.g. `/api/static-vvs/lines/s1`). |
| GET | `/api/static-vvs/stations` | List stations. Optional `?q=...` to filter by name. |

**To test the connections page with static data:** point the frontend to `POST /api/static-vvs/connections/search` instead of `/api/connections/search` (e.g. in `app/connections/page.tsx`). Mock data includes S1 (Hbf ↔ Herrenberg) and S2 (Hbf ↔ Flughafen) with several trips.

## Model overview

1. **Lines** (S1, S2, S3, …) – line id, number, type, color, and **directions**.
2. **Directions** – for each line direction (e.g. S1 → Herrenberg, S1 → Kirchheim): ordered list of **station IDs**.
3. **Times** – either **explicit trips** (one row per run with times at each stop) or **interval schedules** (first departure + interval + running times).

## Types

- **`StaticLine`** – One line (e.g. S1) with one or two `StaticLineDirection`s.
- **`StaticLineDirection`** – `headsign` (e.g. "Herrenberg") and ordered `stationIds`.
- **`StaticStationRef`** – Optional id + name for stations used in static data (can reuse your existing `Station` list).
- **`StaticTrip`** – One run of a line: `lineId`, `directionIndex`, and `stopTimes` (stationId + arrival + departure per stop).
- **`StaticIntervalSchedule`** – For regular intervals: `firstDeparture`, `intervalMinutes`, and `runningTimesMinutes` from the first station to each stop.

## Example: S1 with explicit trips

```ts
const staticData: StaticVvsData = {
  lines: [
    {
      id: "s1",
      number: "S1",
      type: "S-Bahn",
      color: "#00985f",
      directions: [
        { headsign: "Herrenberg",   stationIds: ["de:08115:4512", "de:08111:6056", /* ... */] },
        { headsign: "Kirchheim (Teck)", stationIds: [/* reverse order */] },
      ],
    },
  ],
  stations: [
    { id: "de:08115:4512", name: "Herrenberg" },
    { id: "de:08111:6056", name: "Stuttgart Hbf" },
    // ...
  ],
  trips: [
    {
      tripId: "s1-h-0530",
      lineId: "s1",
      directionIndex: 0,
      stopTimes: [
        { stationId: "de:08115:4512", arrival: "05:30", departure: "05:30" },
        { stationId: "de:08115:4xxx", arrival: "05:35", departure: "05:36" },
        // ... one entry per station in order
      ],
    },
    // more trips for 05:50, 06:10, ...
  ],
};
```

## Example: S1 with interval schedule

When trains run every 15 minutes from 05:00 with the same running times:

```ts
intervalSchedules: [
  {
    lineId: "s1",
    directionIndex: 0,
    firstDeparture: "05:00",
    lastDeparture: "23:45",
    intervalMinutes: 15,
    runningTimesMinutes: [0, 5, 11, 18, 25, 32, 40, 48, 55], // from first to each station
  },
],
```

Then you can derive trips by generating departures at `firstDeparture + n * intervalMinutes` and adding `runningTimesMinutes[i]` to get the time at each station.

## Suggested file layout

- **`data/lines.ts`** – Array of `StaticLine` (and optionally `stations`).
- **`data/trips.ts`** or **`data/interval-schedules.ts`** – Trips or interval schedules per line/direction.
- **`data/index.ts`** – Combine into one `StaticVvsData` and export.

Use the same station `id`s as in your app (e.g. `de:08111:6056` for Stuttgart Hbf) so you can resolve names from your existing station list or from `stations` in the static set.

## Using the static data in the app

- **“Which lines serve station X?”** – Filter `lines` where any `direction.stationIds` includes the station id.
- **“Stations on line L in order”** – `lines.find(l => l.id === L).directions[directionIndex].stationIds`.
- **“Departures from station X on line L”** – From `trips` (or generated from `intervalSchedules`): filter trips for L and direction, then find the `StaticStopTime` for station X and use its `departure` (and optionally combine with current date for ISO timestamps).

You can then build a small **static connection search**: same-line journeys by matching line + direction and picking trips where origin comes before destination in `stationIds`, and filling times from that trip’s `stopTimes`.
