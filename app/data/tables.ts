export type TableStatus = "free" | "occupied";
export type TableZone = "garden" | "family-hall" | "roof" | "floor-1";

export type TableRecord = {
  id: number;
  name: string;
  seats: number;
  status: TableStatus;
  total: number;
  lastUpdated: string;
  pendingItems: number;
  zone: TableZone;
};

export const TABLE_IMAGE_URL =
  "https://vista-host.lovable.app/assets/table-occupied-DlLD5fct.jpg";

export const TABLES_PRESET: TableRecord[] = [
  {
    id: 1,
    name: "Table 1",
    seats: 4,
    status: "free",
    total: 0,
    lastUpdated: "2025-09-24T09:05:00+05:30",
    pendingItems: 0,
    zone: "garden",
  },
  {
    id: 2,
    name: "Table 2",
    seats: 6,
    status: "occupied",
    total: 1480,
    lastUpdated: "2025-09-24T11:02:00+05:30",
    pendingItems: 2,
    zone: "garden",
  },
  {
    id: 3,
    name: "Table 3",
    seats: 2,
    status: "free",
    total: 0,
    lastUpdated: "2025-09-24T09:45:00+05:30",
    pendingItems: 0,
    zone: "family-hall",
  },
  {
    id: 4,
    name: "Table 4",
    seats: 4,
    status: "occupied",
    total: 920,
    lastUpdated: "2025-09-24T10:58:00+05:30",
    pendingItems: 1,
    zone: "family-hall",
  },
  {
    id: 5,
    name: "Table 5",
    seats: 8,
    status: "occupied",
    total: 2120,
    lastUpdated: "2025-09-24T11:14:00+05:30",
    pendingItems: 3,
    zone: "roof",
  },
  {
    id: 6,
    name: "Table 6",
    seats: 6,
    status: "occupied",
    total: 1840,
    lastUpdated: "2025-09-24T11:22:00+05:30",
    pendingItems: 0,
    zone: "roof",
  },
  {
    id: 7,
    name: "Table 7",
    seats: 4,
    status: "free",
    total: 0,
    lastUpdated: "2025-09-24T11:30:00+05:30",
    pendingItems: 0,
    zone: "floor-1",
  },
  {
    id: 8,
    name: "Table 8",
    seats: 4,
    status: "occupied",
    total: 1340,
    lastUpdated: "2025-09-24T11:28:00+05:30",
    pendingItems: 1,
    zone: "floor-1",
  },
];

