"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  TABLES_PRESET,
  TABLE_IMAGE_URL,
  type TableRecord,
  type TableStatus,
  type TableZone,
} from "../data/tables";

const AUTH_STORAGE_KEY = "rural-bites-auth";
const AUTH_EXPIRY_DAYS = 1;
const LAST_ZONE_STORAGE_KEY = "rural-bites-last-zone";

const ZONE_FILTERS: { id: TableZone | "all"; label: string }[] = [
  { id: "all", label: "All areas" },
  { id: "garden", label: "Garden" },
  { id: "family-hall", label: "Family hall" },
  { id: "roof", label: "Roof" },
  { id: "floor-1", label: "Floor 1" },
  { id: "gran", label: "Gran (1-10)" },
  { id: "hall", label: "Hall (1-100)" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRelativeTimeLabel(isoDate: string) {
  const target = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (!Number.isFinite(diffMinutes)) {
    return "just now";
  }

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getLatestTableId(tables: TableRecord[]): number | null {
  if (tables.length === 0) {
    return null;
  }

  let latestId = tables[0].id;
  let latestTimestamp = Date.parse(tables[0].lastUpdated);

  for (const table of tables) {
    const timestamp = Date.parse(table.lastUpdated);
    if (timestamp > latestTimestamp) {
      latestId = table.id;
      latestTimestamp = timestamp;
    }
  }

  return latestId;
}

function getActionLabel(table: TableRecord) {
  if (table.status === "free") {
    return "Seat next guest";
  }

  if (table.pendingItems === 0) {
    return "Collect payment";
  }

  if (table.pendingItems === 1) {
    return "Serve final item";
  }

  return "Serve pending items";
}

function getBadgeLabel(table: TableRecord) {
  if (table.status === "free") {
    return "Sanitized";
  }

  if (table.pendingItems === 0) {
    return "Awaiting bill";
  }

  return `${table.pendingItems} pending`;
}

export default function HomePage() {
  const [activeStaff, setActiveStaff] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<TableZone | "all">(() => {
    if (typeof window === "undefined") {
      return "all";
    }

    const stored = window.localStorage.getItem(LAST_ZONE_STORAGE_KEY) as
      | TableZone
      | "all"
      | null;

    return stored ?? "all";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const parsed = JSON.parse(authData);
        const now = new Date().getTime();
        const expiryTime = parsed.timestamp + (AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        if (now < expiryTime) {
          setIsAuthenticated(true);
          setActiveStaff(parsed.username);
        } else {
          // Expired, clear storage and redirect to login
          localStorage.removeItem(AUTH_STORAGE_KEY);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to check authentication", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/login");
  };

  const handleZoneChange = (zone: TableZone | "all") => {
    setActiveZone(zone);

    try {
      window.localStorage.setItem(LAST_ZONE_STORAGE_KEY, zone);
    } catch (error) {
      console.error("Failed to persist zone filter", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f6b4f] border-t-transparent"></div>
          <p className="mt-4 text-sm text-[#4f5d63]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const tables = TABLES_PRESET;
  const filteredTables =
    activeZone === "all"
      ? tables
      : tables.filter((table) => table.zone === activeZone);
  const highlightedTableId = getLatestTableId(tables);
  const totalBilled = tables.reduce((sum, table) => sum + table.total, 0);
  const occupiedTables = tables.filter((table) => table.status === "occupied");
  const freeTables = tables.filter((table) => table.status === "free");
  const totalPendingItems = tables.reduce(
    (sum, table) => sum + (table.status === "occupied" ? table.pendingItems : 0),
    0
  );
  const averageTicket =
    occupiedTables.length > 0
      ? Math.round(totalBilled / occupiedTables.length)
      : 0;
  const occupancyRate =
    filteredTables.length > 0
      ? Math.round((occupiedTables.length / tables.length) * 100)
      : 0;
  const lastTouchedTable = tables.find(
    (table) => table.id === highlightedTableId
  );
  const staffNameLabel = activeStaff ? activeStaff.toUpperCase() : "WAITER";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#fef9f3] via-[#f5efe0] to-[#e7f2ea] px-1 py-12 text-[#273036]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#f3d3a1] to-[#8dc69b] opacity-70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-16 bottom-20 h-72 w-72 rounded-full bg-gradient-to-br from-[#8dc69b] to-[#f8e4c6] opacity-60 blur-3xl"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl space-y-8">
        {/* Header with logout */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#273036] sm:text-4xl">
              Rural Bites Service Desk
            </h1>
            <p className="mt-2 text-sm text-[#4f5d63]">
              Welcome back, {staffNameLabel}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-[#d6e4d8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2f6b4f] shadow transition hover:bg-[#f1f4f2]"
          >
            Logout
          </button>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/75 py-6 shadow-xl shadow-[#c0d8cc]/40 backdrop-blur">
          <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 py-1">
            {ZONE_FILTERS.map((zoneOption) => {
              const isActive = activeZone === zoneOption.id;

              return (
                <button
                  key={zoneOption.id}
                  type="button"
                  onClick={() => handleZoneChange(zoneOption.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b4f] sm:text-sm ${
                    isActive
                      ? "bg-[#2f6b4f] text-white shadow-lg shadow-[#8dc69b]/40"
                      : "bg-white/80 text-[#2f6b4f] shadow"
                  }`}
                >
                  {zoneOption.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#273036]">
                  Live tables overview
                </h2>
                <p className="text-sm text-[#4f5d63]">
                  Two-up mobile grid keeps quick access to filtered tables.
                </p>
              </div>
              {lastTouchedTable && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#d6e4d8] bg-[#f1f8f3] px-3 py-2 text-xs text-[#2f6b4f] shadow-sm">
                  <span
                    className="h-2 w-2 rounded-full bg-[#2f6b4f]"
                    aria-hidden="true"
                  />
                  <p>
                    Latest update:
                    <span className="ml-1 font-semibold">
                      {lastTouchedTable.name}
                    </span>
                    <span className="ml-1 text-[#4f5d63]">
                      ({getRelativeTimeLabel(lastTouchedTable.lastUpdated)})
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filteredTables.map((table) => {
                const isHighlighted = table.id === highlightedTableId;
                const isOccupied = table.status === "occupied";
                const hasOrder = table.total > 0;

                return (
                  <Link key={table.id} href={`/tables/${table.id}`} className="group">
                    <article
                      className={`relative overflow-hidden rounded-2xl border border-white/50 bg-white/80 shadow-lg shadow-[#c0d8cc]/40 transition-transform hover:-translate-y-1 ${
                        isHighlighted
                          ? "ring-2 ring-[#f3d3a1] shadow-[#f7dcb4]/60"
                          : ""
                      } ${
                        isOccupied && hasOrder
                          ? "bg-gradient-to-br from-[#fff3e0] to-[#ffe0b2] border-[#ff9800]"
                          : isOccupied
                          ? "bg-gradient-to-br from-[#f3e5f5] to-[#e1bee7] border-[#9c27b0]"
                          : ""
                      }`}
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={TABLE_IMAGE_URL}
                          alt={`Top view of ${table.name}`}
                          fill
                          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 20vw, 260px"
                          className={`object-cover transition duration-300 ${
                            isOccupied ? "grayscale brightness-[0.68]" : ""
                          } group-hover:scale-[1.02]`}
                          priority
                        />
                        <div
                          className={`absolute inset-0 ${
                            isOccupied
                              ? "bg-gradient-to-t from-black/65 via-black/25 to-transparent"
                              : "bg-gradient-to-br from-[#d9f2e1]/70 via-transparent to-transparent"
                          }`}
                        />
                        {isHighlighted && (
                          <span className="absolute left-3 top-3 rounded-full bg-[#f3d3a1] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b3f15] shadow-lg shadow-[#f7dcb4]/60">
                            Latest update
                          </span>
                        )}
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            isOccupied && hasOrder
                              ? "bg-[#ff9800] text-white"
                              : isOccupied
                              ? "bg-[#9c27b0] text-white"
                              : "bg-[#e8f5ec] text-[#2f6b4f]"
                          }`}
                        >
                          {isOccupied && hasOrder ? "Active Order" : isOccupied ? "Occupied" : "Free"}
                        </span>
                      </div>

                      <div className="space-y-3 px-4 pb-4 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#1f2b31] sm:text-base">
                            {table.name}
                          </p>
                          <span className="text-xs text-[#5d6b72]">
                            {table.seats} seats
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <p
                            className={`font-semibold ${
                              isOccupied && hasOrder
                                ? "text-[#ff9800]"
                                : isOccupied
                                ? "text-[#9c27b0]"
                                : "text-[#2f6b4f]"
                            }`}
                          >
                            {isOccupied
                              ? formatCurrency(table.total)
                              : "Ready for seating"}
                          </p>
                          <span className="text-[11px] text-[#6a787f]">
                            {getRelativeTimeLabel(table.lastUpdated)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#48565d]">
                          <span className={`rounded-full px-2 py-1 font-medium ${
                            isOccupied && hasOrder
                              ? "bg-[#fff3e0] text-[#ff9800]"
                              : isOccupied
                              ? "bg-[#f3e5f5] text-[#9c27b0]"
                              : "bg-white/80 text-[#2f6b4f]"
                          }`}>
                            {getBadgeLabel(table)}
                          </span>
                          <span className={`font-semibold ${
                            isOccupied && hasOrder
                              ? "text-[#ff9800]"
                              : isOccupied
                              ? "text-[#9c27b0]"
                              : "text-[#aa4b2d]"
                          }`}>
                            {getActionLabel(table)}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-[#c0d8cc]/40 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-[#273036]">
                Billing snapshot
              </h2>
              <span className="rounded-full bg-[#f1f8f3] px-3 py-1 text-xs font-semibold text-[#2f6b4f]">
                {filteredTables.length} tables · {freeTables.length} free
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-[#f7efe2] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#84602f]">
                  Total billed
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2f6b4f]">
                  {formatCurrency(totalBilled)}
                </p>
                <p className="mt-1 text-xs text-[#5d6b72]">
                  Since shift start
                </p>
              </div>

              <div className="rounded-2xl bg-[#e9f4ee] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
                  Avg ticket
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2f6b4f]">
                  {formatCurrency(averageTicket)}
                </p>
                <p className="mt-1 text-xs text-[#5d6b72]">
                  Across active tables
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8e4c6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7f5224]">
                  Pending items
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#7f5224]">
                  {totalPendingItems}
                </p>
                <p className="mt-1 text-xs text-[#7f5224]/80">
                  Across open KOTs
                </p>
              </div>

              <div className="rounded-2xl bg-[#ebf4ef] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
                  Free tables
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2f6b4f]">
                  {freeTables.length}
                </p>
                <p className="mt-1 text-xs text-[#5d6b72]">
                  Ready for next guests
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 mt-12 text-center text-xs text-[#5d6b72]">
        &copy; {new Date().getFullYear()} Rural Bites Cooperative. All rights reserved.
      </footer>
    </div>
  );
}
