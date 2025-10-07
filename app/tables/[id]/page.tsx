"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import {
  TABLES_PRESET,
  type TableRecord,
} from "../../data/tables";
import {
  CATEGORY_PRESETS,
  MENU_ITEMS,
  type MenuItem,
} from "../../data/menu";

const STORAGE_KEY_PREFIX = "rural-bites-table-";

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

function ActiveFilters({
  category,
  searchTerm,
  onClearCategory,
  onClearSearch,
}: {
  category: (typeof CATEGORY_PRESETS)[number]["id"];
  searchTerm: string;
  onClearCategory: () => void;
  onClearSearch: () => void;
}) {
  const isCategoryActive = category !== "all";
  const isSearchActive = searchTerm.trim().length > 0;

  if (!isCategoryActive && !isSearchActive) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#2f6b4f]">
      <span className="font-semibold uppercase tracking-wide text-[#4f5d63]">
        Active filters:
      </span>
      {isCategoryActive && (
        <button
          type="button"
          onClick={onClearCategory}
          className="rounded-full bg-[#e9f4ee] px-3 py-1 font-semibold transition hover:bg-[#d6e9de]"
        >
          {CATEGORY_PRESETS.find((preset) => preset.id === category)?.label} ×
        </button>
      )}
      {isSearchActive && (
        <button
          type="button"
          onClick={onClearSearch}
          className="rounded-full bg-[#fdeacf] px-3 py-1 font-semibold text-[#6b3f15] transition hover:bg-[#fbdcb2]"
        >
          “{searchTerm}” ×
        </button>
      )}
    </div>
  );
}

type ParamsPromise = Promise<{ id: string }>;

export default function TableOrderingPage({
  params,
}: {
  params: ParamsPromise;
}) {
  const resolvedParams = use(params);
  const tableId = Number.parseInt(resolvedParams.id, 10);
  const table = getTableData(tableId);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_PRESETS)[number]["id"]>("all");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    if (!Number.isFinite(tableId)) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as
          | Record<string, number>
          | { items: Record<string, number>; order?: string[] };

        if (parsed && typeof parsed === "object" && "items" in parsed) {
          setSelectedItems(parsed.items as Record<string, number>);
          setItemOrder(parsed.order as string[] ?? Object.keys(parsed.items));
          setIsSummaryOpen(Object.keys(parsed.items).length > 0);
        } else {
          const draftItems = parsed as Record<string, number>;
          setSelectedItems(draftItems);
          setItemOrder(Object.keys(draftItems));
          setIsSummaryOpen(Object.keys(draftItems).length > 0);
        }
      }
    } catch (error) {
      console.error("Failed to restore table order from storage", error);
    }
  }, [tableId]);

  useEffect(() => {
    if (!Number.isFinite(tableId)) {
      return;
    }

    try {
      const payload = JSON.stringify({ items: selectedItems, order: itemOrder });
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${tableId}`, payload);
    } catch (error) {
      console.error("Failed to persist table order to storage", error);
    }
  }, [selectedItems, itemOrder, tableId]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return MENU_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const sortedSelectedEntries = useMemo(() => {
    const entries = Object.entries(selectedItems);
    if (entries.length === 0) {
      return entries;
    }

    return entries.sort((a, b) => {
      const indexA = itemOrder.indexOf(a[0]);
      const indexB = itemOrder.indexOf(b[0]);

      if (indexA === -1 && indexB === -1) {
        return 0;
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }

      return indexB - indexA;
    });
  }, [selectedItems, itemOrder]);

  const totals = useMemo(() => {
    const subtotal = Object.entries(selectedItems).reduce((sum, [itemId, count]) => {
      const menuItem = MENU_ITEMS.find((item) => item.id === itemId);
      if (!menuItem) {
        return sum;
      }

      return sum + menuItem.price * count;
    }, 0);

    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;

    return {
      subtotal,
      tax,
      grandTotal,
    };
  }, [selectedItems]);

  const itemCount = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, count) => sum + count, 0);
  }, [selectedItems]);

  if (!Number.isFinite(tableId) || !table) {
    notFound();
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    setSelectedItems((current) => {
      const currentCount = current[itemId] ?? 0;
      const nextCount = Math.max(0, currentCount + delta);
      const nextItems = { ...current };

      if (nextCount === 0) {
        delete nextItems[itemId];
      } else {
        nextItems[itemId] = nextCount;
      }

      setItemOrder((prev) => {
        const filtered = prev.filter((id) => id !== itemId && nextItems[id] !== undefined);

        if (nextCount > 0 && delta > 0) {
          return [itemId, ...filtered];
        }

        if (nextCount > 0 && !filtered.includes(itemId)) {
          return [itemId, ...filtered];
        }

        return filtered;
      });

      return nextItems;
    });
  };

  const persistDraft = (items: Record<string, number>) => {
    if (!Number.isFinite(tableId)) {
      return;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${tableId}`;
    const filteredOrder = itemOrder.filter((id) => items[id] !== undefined);

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ items, order: filteredOrder })
      );
    } catch (error) {
      console.error("Failed to persist table order to storage", error);
    }
  };

  const handleSaveDraft = () => {
    try {
      persistDraft(selectedItems);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to explicitly save draft", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleGoToCheckout = () => {
    if (Object.keys(selectedItems).length === 0) {
      return;
    }

    router.push(`/tables/${tableId}/checkout`);
  };

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

      <header className="relative z-10 border-b border-white/40 bg-white/60 px-4 py-4 backdrop-blur sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
              Table Service · Rural Bites
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#273036] sm:text-2xl lg:text-3xl">
              {table.name}
            </h1>
            <p className="mt-1 text-xs text-[#4f5d63] sm:text-sm">
              Seats {table.seats}. Last billed {formatCurrency(table.total)}. {table.status === "occupied" ? "Guests on table." : "Ready to seat new guests."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="rounded-2xl border border-[#d6e4d8] bg-white/80 px-3 py-2 text-center sm:text-left">
              <p className="text-xs font-semibold text-[#273036] sm:text-sm">Order tally</p>
              <p className="text-xs text-[#2f6b4f] sm:text-sm">{itemCount} item{itemCount === 1 ? "" : "s"} selected</p>
            </div>
            <Link
              href="/home"
              className="rounded-2xl border border-transparent bg-[#2f6b4f] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#8dc69b]/40 transition hover:bg-[#255842] sm:px-4 sm:text-sm"
            >
              ← Back to tables
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 pb-28 sm:flex-row sm:items-start sm:gap-6 sm:py-6 sm:pb-10">
        <div className="flex-1 space-y-4 sm:space-y-6">
          <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_PRESETS.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b4f] sm:px-4 sm:py-2 sm:text-sm ${
                    isActive
                      ? "bg-[#2f6b4f] text-white shadow-lg shadow-[#8dc69b]/40"
                      : "bg-white/80 text-[#2f6b4f] shadow"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </nav>

          <div className="rounded-3xl border border-white/60 bg-white/80 p-3 shadow-lg shadow-[#c0d8cc]/40 backdrop-blur sm:p-4">
            <label className="flex items-center gap-2 rounded-2xl border border-[#d6e4d8] bg-white/70 px-3 py-2 text-sm text-[#4f5d63] sm:gap-3">
              <span className="text-[#2f6b4f]">🔍</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for dishes or keywords"
                className="w-full bg-transparent text-xs text-[#273036] outline-none placeholder:text-[#8fa2a9] sm:text-sm"
              />
              {searchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="rounded-full bg-[#f1f4f2] px-2 py-1 text-xs font-semibold text-[#2f6b4f]"
                >
                  Clear
                </button>
              )}
            </label>

            <ActiveFilters
              category={activeCategory}
              searchTerm={searchTerm}
              onClearCategory={() => setActiveCategory("all")}
              onClearSearch={() => setSearchTerm("")}
            />
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-[#273036] sm:text-lg lg:text-xl">
                {activeCategory === "all"
                  ? "Recommended for the table"
                  : CATEGORY_PRESETS.find((category) => category.id === activeCategory)?.label}
              </h2>
              <p className="text-xs text-[#4f5d63] sm:text-sm">
                {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"} available.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const quantity = selectedItems[item.id] ?? 0;
                const hasQuantity = quantity > 0;

                return (
                  <article
                    key={item.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-[#c0d8cc]/40 backdrop-blur transition-transform hover:-translate-y-1"
                  >
                    <div className="relative h-40 w-full overflow-hidden sm:h-48">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 90vw, 420px"
                        className="object-cover transition duration-300 group-hover:scale-[1.05]"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2 text-xs text-white">
                        {item.isSignature && (
                          <span className="rounded-full bg-[#f3d3a1] px-2 py-1 font-semibold text-[#6b3f15] shadow">
                            Signature
                          </span>
                        )}
                        {item.isChefSpecial && (
                          <span className="rounded-full bg-[#2f6b4f] px-2 py-1 font-semibold text-white shadow">
                            Chef special
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 px-3 py-3 sm:space-y-3 sm:px-4 sm:py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#273036] sm:text-base">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs text-[#4f5d63] sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs font-semibold text-[#2f6b4f] sm:text-sm">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <span className="rounded-full bg-[#f1f4f2] px-2 py-1 text-xs text-[#2f6b4f]">
                            {item.category}
                          </span>
                          <span className="text-xs text-[#6a787f]">Prep {item.category === "mains" ? "20" : "12"} min</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasQuantity ? (
                            <div className="flex items-center gap-1 rounded-full bg-[#f1f4f2] px-2 py-1 text-xs font-semibold text-[#2f6b4f] sm:gap-2 sm:px-3 sm:text-sm">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="text-sm leading-none sm:text-lg"
                                aria-label={`Reduce quantity of ${item.name}`}
                              >
                                −
                              </button>
                              <span>{quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="text-sm leading-none sm:text-lg"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="rounded-full bg-gradient-to-r from-[#3d8c66] via-[#2f6b4f] to-[#246048] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#8dc69b]/40 transition hover:scale-[1.02] sm:px-4 sm:py-2"
                            >
                              Add to order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredItems.length === 0 && (
                <p className="col-span-full rounded-3xl border border-dashed border-[#d6e4d8] bg-white/70 px-3 py-4 text-center text-xs text-[#4f5d63] sm:px-4 sm:py-6 sm:text-sm">
                  No dishes match your filters. Try switching categories or clearing the search.
                </p>
              )}
            </div>
          </section>
        </div>

        {isSummaryOpen && (
          <aside className="fixed bottom-0 left-0 right-0 z-20 space-y-3 rounded-t-3xl border border-white/60 bg-white/95 px-4 py-4 text-sm text-[#273036] shadow-lg shadow-[#c0d8cc]/30 backdrop-blur sm:sticky sm:top-6 sm:min-w-[260px] sm:max-w-[280px] sm:self-start sm:rounded-3xl sm:space-y-4 sm:px-4 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold sm:text-lg">Order summary</h2>
                <p className="text-xs text-[#4f5d63]">
                  Review before printing KOT or sending prep call to the kitchen.
                </p>
              </div>
              {/* background darl */}
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="shrink-0 rounded-full border border-transparent bg-[#f1f4f2] px-3 py-1 text-xs font-semibold text-[#2f6b4f] transition hover:bg-[#e0ece4]"
                aria-label="Close order summary"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {sortedSelectedEntries.length === 0 ? (
                <p className="rounded-2xl bg-[#f1f4f2] px-3 py-3 text-xs text-[#4f5d63] sm:py-4">
                  Nothing added yet. Tap "Add to order" to build the guest bill.
                </p>
              ) : (
                <ul className="max-h-32 space-y-2 overflow-y-auto pr-1 sm:max-h-50 sm:space-y-3">
                  {sortedSelectedEntries.map(([itemId, count]) => {
                    const menuItem = MENU_ITEMS.find((item) => item.id === itemId);
                    if (!menuItem) {
                      return null;
                    }

                    return (
                      <li key={itemId} className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate sm:text-sm">{menuItem.name}</p>
                          <p className="text-xs text-[#6a787f]">Qty {count}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#2f6b4f] sm:text-sm">
                          {formatCurrency(menuItem.price * count)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>


            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full rounded-2xl border border-[#d6e4d8] bg-white/70 px-3 py-2 text-xs font-semibold text-[#2f6b4f] shadow transition hover:scale-[1.01] sm:px-4 sm:py-3 sm:text-sm"
            >
              Save draft
            </button>
            {saveStatus === "saved" && (
              <p className="text-xs font-semibold text-[#2f6b4f]">Draft saved to cart</p>
            )}
            {saveStatus === "error" && (
              <p className="text-xs font-semibold text-[#aa4b2d]">Could not save draft</p>
            )}

            <button
              type="button"
              onClick={handleGoToCheckout}
              className="w-full rounded-2xl bg-gradient-to-r from-[#3d8c66] via-[#2f6b4f] to-[#246048] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#8dc69b]/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
              disabled={itemCount === 0}
            >
              Go to checkout
            </button>
          </aside>
        )}
      </main>

      {!isSummaryOpen && (
        <button
          type="button"
          onClick={() => setIsSummaryOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#2f6b4f] px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-[#8dc69b]/40 transition hover:scale-[1.05] sm:bottom-6 sm:right-6 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
          aria-label="Reopen order summary"
        >
          Open summary
          {itemCount > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs sm:px-2">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          )}
        </button>
      )}

      
    </div>
  );
}
