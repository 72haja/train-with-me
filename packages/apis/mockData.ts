/**
 * Mock VVS/Deutsche Bahn Data
 * This data structure matches what we'd receive from the real VVS API
 */

import type { Connection, Friend, Station, Stop, Line } from '@/types/vvs';

// Mock Friends Data (would come from Supabase in production)
export const mockFriends: Friend[] = [
  {
    id: 'user_001',
    name: 'Anna Schmidt',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    id: 'user_002',
    name: 'Max Müller',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    id: 'user_003',
    name: 'Sophie Weber',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    id: 'user_004',
    name: 'Lukas Fischer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    isOnline: false,
  },
  {
    id: 'user_005',
    name: 'Emma Wagner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    isOnline: true,
  },
];

// Common Stuttgart Stations
const stations: Record<string, Station> = {
  hauptbahnhof: {
    id: 'de:08111:6056',
    name: 'Hauptbahnhof',
    city: 'Stuttgart',
    vvsId: '5006056',
    coordinates: { latitude: 48.7838, longitude: 9.1816 },
  },
  universitaet: {
    id: 'de:08111:6118',
    name: 'Universität',
    city: 'Stuttgart',
    vvsId: '5006118',
    coordinates: { latitude: 48.7462, longitude: 9.1058 },
  },
  vaihingen: {
    id: 'de:08111:6088',
    name: 'Vaihingen',
    city: 'Stuttgart',
    vvsId: '5006088',
    coordinates: { latitude: 48.7254, longitude: 9.1078 },
  },
  herrenberg: {
    id: 'de:08115:4512',
    name: 'Herrenberg',
    city: 'Herrenberg',
    vvsId: '5004512',
    coordinates: { latitude: 48.5947, longitude: 8.8675 },
  },
  flughafen: {
    id: 'de:08111:6553',
    name: 'Flughafen/Messe',
    city: 'Stuttgart',
    vvsId: '5006553',
    coordinates: { latitude: 48.6908, longitude: 9.1966 },
  },
  badcannstatt: {
    id: 'de:08111:6057',
    name: 'Bad Cannstatt',
    city: 'Stuttgart',
    vvsId: '5006057',
    coordinates: { latitude: 48.8069, longitude: 9.2176 },
  },
  rotebuehlplatz: {
    id: 'de:08111:6071',
    name: 'Rotebühlplatz',
    city: 'Stuttgart',
    vvsId: '5006071',
  },
  charlottenplatz: {
    id: 'de:08111:6075',
    name: 'Charlottenplatz',
    city: 'Stuttgart',
    vvsId: '5006075',
  },
  oesterfeld: {
    id: 'de:08111:6117',
    name: 'Österfeld',
    city: 'Stuttgart',
    vvsId: '5006117',
  },
  boeblingen: {
    id: 'de:08115:4510',
    name: 'Böblingen',
    city: 'Böblingen',
    vvsId: '5004510',
  },
  leinfelden: {
    id: 'de:08116:3720',
    name: 'Leinfelden',
    city: 'Leinfelden-Echterdingen',
    vvsId: '5003720',
  },
  backnang: {
    id: 'de:08119:5070',
    name: 'Backnang',
    city: 'Backnang',
    vvsId: '5005070',
  },
  gerlingen: {
    id: 'de:08118:7418',
    name: 'Gerlingen',
    city: 'Gerlingen',
    vvsId: '5007418',
  },
};

// Helper to create stop with current time offset
const createStop = (
  station: Station,
  minutesFromNow: number,
  platform?: string,
  delay?: number
): Stop => {
  const scheduledTime = new Date();
  scheduledTime.setMinutes(scheduledTime.getMinutes() + minutesFromNow);
  
  let actualTime: Date | undefined;
  if (delay !== undefined && delay !== 0) {
    actualTime = new Date(scheduledTime);
    actualTime.setMinutes(actualTime.getMinutes() + delay);
  }

  return {
    station,
    scheduledDeparture: scheduledTime.toISOString(),
    actualDeparture: actualTime?.toISOString(),
    delay,
    platform,
    platformChange: false,
  };
};

// Mock Connections (simulating VVS API response)
export const mockConnections: Connection[] = [
  {
    id: 'conn_001',
    tripId: 'vvs:11001:S:H:j24:1',
    line: {
      id: 's1',
      number: 'S1',
      type: 'S-Bahn',
      color: '#00985f',
      direction: 'Herrenberg',
      operator: 'DB Regio',
    },
    departure: createStop(stations.hauptbahnhof, 5, '101'),
    arrival: createStop(stations.herrenberg, 42, '2'),
    stops: [
      createStop(stations.hauptbahnhof, 5, '101'),
      createStop(stations.universitaet, 10, '1'),
      createStop(stations.oesterfeld, 15, '1'),
      createStop(stations.vaihingen, 20, '1'),
      createStop(stations.boeblingen, 32, '3'),
      createStop(stations.herrenberg, 42, '2'),
    ],
    friends: [mockFriends[0], mockFriends[1]],
    status: 'on-time',
    hasRealTimeData: true,
  },
  {
    id: 'conn_002',
    tripId: 'vvs:10006:U:H:j24:2',
    line: {
      id: 'u6',
      number: 'U6',
      type: 'U-Bahn',
      color: '#6e2585',
      direction: 'Gerlingen',
      operator: 'SSB',
    },
    departure: createStop(stations.hauptbahnhof, 9, '3'),
    arrival: createStop(stations.gerlingen, 25, '1'),
    stops: [
      createStop(stations.hauptbahnhof, 9, '3'),
      createStop(stations.rotebuehlplatz, 12, '1'),
      createStop(stations.gerlingen, 25, '1'),
    ],
    friends: [],
    status: 'on-time',
    hasRealTimeData: true,
  },
  {
    id: 'conn_003',
    tripId: 'vvs:11002:S:H:j24:3',
    line: {
      id: 's2',
      number: 'S2',
      type: 'S-Bahn',
      color: '#dc281e',
      direction: 'Flughafen/Messe',
      operator: 'DB Regio',
    },
    departure: createStop(stations.hauptbahnhof, 17, '102', 3),
    arrival: createStop(stations.flughafen, 35, '1'),
    stops: [
      createStop(stations.hauptbahnhof, 17, '102', 3),
      createStop(stations.universitaet, 22, '2'),
      createStop(stations.vaihingen, 27, '2'),
      createStop(stations.flughafen, 35, '1'),
    ],
    friends: [mockFriends[2]],
    status: 'delayed',
    hasRealTimeData: true,
  },
  {
    id: 'conn_004',
    tripId: 'vvs:10005:U:H:j24:4',
    line: {
      id: 'u5',
      number: 'U5',
      type: 'U-Bahn',
      color: '#00549f',
      direction: 'Leinfelden',
      operator: 'SSB',
    },
    departure: createStop(stations.hauptbahnhof, 23, '2'),
    arrival: createStop(stations.leinfelden, 42, '1'),
    stops: [
      createStop(stations.hauptbahnhof, 23, '2'),
      createStop(stations.charlottenplatz, 27, '1'),
      createStop(stations.leinfelden, 42, '1'),
    ],
    friends: [mockFriends[0], mockFriends[2], mockFriends[4]],
    status: 'on-time',
    hasRealTimeData: true,
  },
  {
    id: 'conn_005',
    tripId: 'vvs:11003:S:H:j24:5',
    line: {
      id: 's3',
      number: 'S3',
      type: 'S-Bahn',
      color: '#ffd500',
      direction: 'Backnang',
      operator: 'DB Regio',
    },
    departure: createStop(stations.hauptbahnhof, 29, '103'),
    arrival: createStop(stations.backnang, 58, '2'),
    stops: [
      createStop(stations.hauptbahnhof, 29, '103'),
      createStop(stations.badcannstatt, 35, '4'),
      createStop(stations.backnang, 58, '2'),
    ],
    friends: [mockFriends[1]],
    status: 'on-time',
    hasRealTimeData: true,
  },
];

