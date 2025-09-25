"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useState } from "react";

import Link from "next/link";

import {
  TABLES_PRESET,
  TABLE_IMAGE_URL,
  type TableRecord,
  type TableStatus,
  type TableZone,
} from "./data/tables";

const VALID_USERNAME = "abx";
const VALID_PASSWORD = "1234";

const ZONE_FILTERS: { id: TableZone | "all"; label: string }[] = [
  { id: "all", label: "All areas" },
  { id: "garden", label: "Garden" },
  { id: "family-hall", label: "Family hall" },
  { id: "roof", label: "Roof" },
  { id: "floor-1", label: "Floor 1" },
];

const LAST_ZONE_STORAGE_KEY = "rural-bites-last-zone";

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

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const isFormComplete = username.trim().length > 0 && password.trim().length > 0;
  const currentYear = new Date().getFullYear();

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (
      normalizedUsername === VALID_USERNAME &&
      normalizedPassword === VALID_PASSWORD
    ) {
      setStatus("success");
      setMessage("");
      setIsAuthenticated(true);
      setActiveStaff(normalizedUsername);
      setPassword("");
      return;
    }

    setStatus("error");
    setMessage(
      "The username or password does not match our records. Please try again."
    );
  };

  const handleZoneChange = (zone: TableZone | "all") => {
    setActiveZone(zone);

    try {
      window.localStorage.setItem(LAST_ZONE_STORAGE_KEY, zone);
    } catch (error) {
      console.error("Failed to persist zone filter", error);
    }
  };

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

      <div
        className={`relative z-10 w-full space-y-8 ${
          isAuthenticated ? "max-w-6xl" : "max-w-sm"
        }`}
      >
        {!isAuthenticated ? (
          <>
            <header className="text-center">
              <span className="inline-block rounded-full bg-[#ebf4ef] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
                Waiter Login
              </span>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Rural Bites Service Desk
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#4f5d63]">
                Check in to manage tables, run KOT tickets, and keep the rural
                dining floor moving smoothly.
              </p>
            </header>

            <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-[#c0d8cc]/60 backdrop-blur">
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-[#2f6b4f]"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                    className="w-full rounded-2xl border border-[#cddbd1] bg-white/90 px-4 py-3 text-sm shadow-inner outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#8dc69b] sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-[#2f6b4f]"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-2xl border border-[#cddbd1] bg-white/90 px-4 py-3 text-sm shadow-inner outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#8dc69b] sm:text-base"
                  />
        </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#3d8c66] via-[#2f6b4f] to-[#246048] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8dc69b]/50 transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b4f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!isFormComplete}
                >
                  Sign in
                </button>

                <div className="rounded-2xl bg-[#f7f1e7]/80 p-4 text-xs text-[#4f5d63]">
                  <p className="font-semibold text-[#2f6b4f]">Demo access</p>
                  <p className="mt-1">
                    Username: <span className="font-mono text-[#2f6b4f]">abx</span>
                  </p>
                  <p>
                    Password: <span className="font-mono text-[#2f6b4f]">1234</span>
                  </p>
                </div>

                <div aria-live="polite" className="min-h-[1.25rem] text-xs">
                  {status === "success" && (
                    <p className="text-[#2f6b4f]">{message}</p>
                  )}
                  {status === "error" && (
                    <p className="text-[#c05b43]">{message}</p>
                  )}
                </div>
              </form>

              <p className="mt-6 text-center text-xs text-[#5d6b72]">
                Shift sync happens even on low bandwidth. Remember to log out at
                day end.
              </p>
            </section>

            <div className="text-center">
              <div className="mx-auto flex max-w-xs items-center justify-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-xs text-[#2f6b4f] shadow">
                <span
                  className="h-2 w-2 rounded-full bg-[#2f6b4f]"
                  aria-hidden="true"
                />
                <p>Optimized for village hotspots & low-bandwidth kiosks</p>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-[#d6e4d8] bg-white/40 p-4 text-xs text-[#4f5d63]">
              <strong className="font-semibold text-[#2f6b4f]">
                Floor readiness checklist
              </strong>
              <ul className="mt-2 list-disc space-y-2 pl-4">
                <li>Confirm sanitizer refill before opening each section.</li>
                <li>Mark tables online within 2 minutes after cleaning.</li>
                <li>
                  Need support? Email
                  <a
                    className="ml-1 text-[#2f6b4f] underline"
                    href="mailto:support@ruralbites.in"
                  >
                    support@ruralbites.in
                  </a>
                  .
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>

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

                    return (
                      <Link key={table.id} href={`/tables/${table.id}`} className="group">
                        <article
                          className={`relative overflow-hidden rounded-2xl border border-white/50 bg-white/80 shadow-lg shadow-[#c0d8cc]/40 transition-transform hover:-translate-y-1 ${
                            isHighlighted
                              ? "ring-2 ring-[#f3d3a1] shadow-[#f7dcb4]/60"
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
                                isOccupied
                                  ? "bg-black/60 text-white"
                                  : "bg-[#e8f5ec] text-[#2f6b4f]"
                              }`}
                            >
                              {isOccupied ? "Occupied" : "Free"}
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
                                  isOccupied ? "text-[#f3d3a1]" : "text-[#2f6b4f]"
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
                              <span className="rounded-full bg-white/80 px-2 py-1 font-medium text-[#2f6b4f]">
                                {getBadgeLabel(table)}
                              </span>
                              <span className="font-semibold text-[#aa4b2d]">
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
          </>
        )}
      </div>

      <footer className="relative z-10 mt-12 text-center text-xs text-[#5d6b72]">
        &copy; {currentYear} Rural Bites Cooperative. All rights reserved.
      </footer>
    </div>
  );
}
