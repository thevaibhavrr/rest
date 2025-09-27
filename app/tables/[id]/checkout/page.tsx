"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { TABLES_PRESET, type TableRecord } from "../../../data/tables";
import {
  MENU_ITEMS,
  CATEGORY_PRESETS,
  type MenuItem,
} from "../../../data/menu";

const STORAGE_KEY_PREFIX = "rural-bites-table-";
const HISTORY_STORAGE_KEY = "rural-bites-history";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTableData(id: number): TableRecord | null {
  return TABLES_PRESET.find((table) => table.id === id) ?? null;
}

function useParamsNumber(params: Promise<{ id: string }>) {
  const resolved = use(params);
  return Number.parseInt(resolved.id, 10);
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tableId = useParamsNumber(params);
  const table = getTableData(tableId);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isHistoryOnly, setIsHistoryOnly] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(tableId)) {
      return;
    }

    try {
      const draftRaw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`);
      const historyRaw = window.localStorage.getItem(HISTORY_STORAGE_KEY);

      if (draftRaw) {
        const parsed = JSON.parse(draftRaw) as
          | Record<string, number>
          | { items: Record<string, number>; order?: string[] };

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          if ("items" in parsed && parsed.items && typeof parsed.items === "object") {
            setSelectedItems(parsed.items);
          } else {
            setSelectedItems(parsed as Record<string, number>);
          }
        }
      } else if (historyRaw) {
        const history = JSON.parse(historyRaw) as Array<{
          tableId: number;
          items: Record<string, number>;
          totals: {
            subtotal: number;
            tax: number;
            grandTotal: number;
          };
          timestamp: number;
          customerName?: string;
          customerPhone?: string;
          discount?: number;
        }>;

        const latestForTable = history.find((entry) => entry.tableId === tableId);
        if (latestForTable) {
          setSelectedItems(latestForTable.items);
          setDiscount(latestForTable.discount ?? 0);
          setCustomerName(latestForTable.customerName ?? "");
          setCustomerPhone(latestForTable.customerPhone ?? "");
          setIsHistoryOnly(true);
        }
      }
    } catch (error) {
      console.error("Failed to load checkout data", error);
    }
  }, [tableId]);

  const totals = useMemo(() => {
    const subtotal = Object.entries(selectedItems).reduce((sum, [itemId, quantity]) => {
      const menuItem = MENU_ITEMS.find((item) => item.id === itemId);
      if (!menuItem) {
        return sum;
      }
      return sum + menuItem.price * quantity;
    }, 0);

    const tax = Math.round(subtotal * 0.05);
    const finalDiscount = Math.min(Math.max(discount, 0), subtotal);
    const grandTotal = subtotal + tax - finalDiscount;

    return {
      subtotal,
      tax,
      grandTotal,
      discountApplied: finalDiscount,
    };
  }, [selectedItems, discount]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    if (isHistoryOnly) {
      return;
    }

    setSelectedItems((current) => {
      const nextCount = Math.max(0, (current[itemId] ?? 0) + delta);

      if (nextCount === 0) {
        const { [itemId]: _unused, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [itemId]: nextCount,
      };
    });
  };

  const handleAddItem = (item: MenuItem) => {
    if (isHistoryOnly) {
      return;
    }

    setSelectedItems((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + 1,
    }));
  };

  const handleSaveBill = () => {
    try {
      const historyRaw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      const history: Array<{
        tableId: number;
        items: Record<string, number>;
        totals: {
          subtotal: number;
          tax: number;
          grandTotal: number;
          discountApplied: number;
        };
        timestamp: number;
        customerName?: string;
        customerPhone?: string;
      }> = historyRaw ? JSON.parse(historyRaw) : [];

      history.unshift({
        tableId,
        items: selectedItems,
        totals,
        timestamp: Date.now(),
        customerName,
        customerPhone,
      });

      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tableId}`);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to store bill history", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const itemCount = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, count) => sum + count, 0);
  }, [selectedItems]);

  if (!Number.isFinite(tableId) || !table) {
    throw new Error("Invalid table");
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-[#fef9f3] via-[#f5efe0] to-[#e7f2ea]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-24 top-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#f3d3a1] to-[#8dc69b] opacity-60 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-16 bottom-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#8dc69b] to-[#f8e4c6] opacity-50 blur-3xl"
          aria-hidden="true"
        />
      </div>

      <header className="relative z-10 border-b border-white/40 bg-white/60 px-4 py-6 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
              Bill Checkout · Rural Bites
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#273036] sm:text-3xl">
              {table.name}
            </h1>
            <p className="mt-1 text-sm text-[#4f5d63]">
              Seats {table.seats}. Use this screen to finalize the bill, add discounts,
              and capture guest details before printing.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#4f5d63]">
            <div className="rounded-2xl border border-[#d6e4d8] bg-white/80 px-4 py-2">
              <p className="font-semibold text-[#273036]">Items in bill</p>
              <p className="text-[#2f6b4f]">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
            </div>
            <Link
              href={`/tables/${tableId}`}
              className="rounded-2xl border border-transparent bg-[#2f6b4f] px-4 py-2 font-semibold text-white shadow-lg shadow-[#8dc69b]/40 transition hover:bg-[#255842]"
            >
              ← Back to table order
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:flex-row sm:items-start sm:pb-10">
        <section className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-[#c0d8cc]/40 backdrop-blur">
            <h2 className="text-lg font-semibold text-[#273036]">
              Bill items
            </h2>
            <p className="mt-1 text-xs text-[#4f5d63]">
              Adjust quantities or remove dishes before finalizing the bill.
            </p>

            <div className="mt-4 space-y-4">
              {Object.entries(selectedItems).map(([itemId, quantity]) => {
                const menuItem = MENU_ITEMS.find((item) => item.id === itemId);
                if (!menuItem) {
                  return null;
                }

                return (
                  <article
                    key={itemId}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/70 p-3 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                        <Image
                          src={menuItem.image}
                          alt={menuItem.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#273036]">
                          {menuItem.name}
                        </p>
                        <p className="text-xs text-[#4f5d63]">
                          {formatCurrency(menuItem.price)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isHistoryOnly && (
                        <div className="flex items-center gap-2 rounded-full bg-[#f1f4f2] px-3 py-1 text-sm font-semibold text-[#2f6b4f]">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(menuItem.id, -1)}
                            className="text-lg leading-none"
                            aria-label={`Reduce quantity of ${menuItem.name}`}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(menuItem.id, 1)}
                            className="text-lg leading-none"
                            aria-label={`Increase quantity of ${menuItem.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                      <p className="w-20 text-right text-sm font-semibold text-[#273036]">
                        {formatCurrency(menuItem.price * quantity)}
                      </p>
                    </div>
                  </article>
                );
              })}

              {Object.keys(selectedItems).length === 0 && (
                <p className="rounded-3xl border border-dashed border-[#d6e4d8] bg-white/70 px-4 py-6 text-center text-sm text-[#4f5d63]">
                  Nothing selected yet. Add dishes from the recommended list below.
                </p>
              )}
            </div>
          </div>

          {!isHistoryOnly && (
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-[#c0d8cc]/40 backdrop-blur">
              <h2 className="text-lg font-semibold text-[#273036]">
                Add more items
              </h2>
              <p className="mt-1 text-xs text-[#4f5d63]">
                Quick shortcuts from popular categories.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                {MENU_ITEMS.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-3 text-left text-sm text-[#273036] shadow transition hover:-translate-y-0.5"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-[#4f5d63]">
                        {formatCurrency(item.price)} • {item.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4 self-stretch rounded-3xl border border-white/60 bg-white/85 px-4 py-5 text-sm text-[#273036] shadow-lg shadow-[#c0d8cc]/30 backdrop-blur sm:min-w-[260px] sm:max-w-[280px]">
          <h2 className="text-lg font-semibold">Guest details</h2>
          <div className="space-y-3 text-xs text-[#4f5d63]">
            <label className="block space-y-1">
              <span className="font-semibold text-[#273036]">Customer name (optional)</span>
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                disabled={isHistoryOnly}
                placeholder="Enter name"
                className="w-full rounded-2xl border border-[#d6e4d8] bg-white/80 px-3 py-2 text-sm text-[#273036] outline-none"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-[#273036]">Contact number (optional)</span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                disabled={isHistoryOnly}
                placeholder="Enter phone"
                className="w-full rounded-2xl border border-[#d6e4d8] bg-white/80 px-3 py-2 text-sm text-[#273036] outline-none"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-[#273036]">Discount (₹)</span>
              <input
                type="number"
                min={0}
                max={totals.subtotal}
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value))}
                disabled={isHistoryOnly}
                className="w-full rounded-2xl border border-[#d6e4d8] bg-white/80 px-3 py-2 text-sm text-[#273036] outline-none"
              />
            </label>
          </div>

          <div className="space-y-2 rounded-3xl bg-[#f7efe2] px-3 py-3 text-xs text-[#47371d]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#2f6b4f]">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Service & tax (5%)</span>
              <span className="font-semibold text-[#2f6b4f]">
                {formatCurrency(totals.tax)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span className="font-semibold text-[#2f6b4f]">
                −{formatCurrency(totals.discountApplied)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-[#273036]">
              <span>Total due</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBill}
            className="w-full rounded-2xl bg-gradient-to-r from-[#3d8c66] via-[#2f6b4f] to-[#246048] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8dc69b]/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Object.keys(selectedItems).length === 0}
          >
            Save bill history & print
          </button>
          {status === "saved" && (
            <p className="text-xs font-semibold text-[#2f6b4f]">
              Bill saved to history. Send to printer.
            </p>
          )}
          {status === "error" && (
            <p className="text-xs font-semibold text-[#aa4b2d]">
              Could not save bill. Try again.
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
