import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ArrowUpDown } from "lucide-react";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton } from "../Loading/LoadingSpinner";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  itemsPerPage?: number;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  actions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = "Cari data...",
  searchKeys,
  itemsPerPage = 10,
  mobileCardRender,
  actions,
  emptyTitle,
  emptyDescription
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => String(item[k] || "").toLowerCase().includes(term));
      }
      return Object.values(item).some((val) => String(val || "").toLowerCase().includes(term));
    });
  }, [data, searchTerm, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-white/10 bg-zinc-950 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#ccff00]/30 focus:border-[#ccff00] transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <Skeleton className="h-8 w-full bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
        </div>
      ) : paginatedData.length === 0 ? (
        <EmptyState
          title={emptyTitle || "Tidak ada data ditemukan"}
          description={emptyDescription || (searchTerm ? "Tidak ada rekaman data yang sesuai dengan pencarian Anda." : "Belum ada rekaman data pada modul ini.")}
        />
      ) : (
        <>
          {/* Mobile Card Layout (visible on small screens when mobileCardRender provided) */}
          {mobileCardRender ? (
            <div className="block md:hidden space-y-3">
              {paginatedData.map((item, idx) => (
                <div key={keyExtractor(item)}>
                  {mobileCardRender(item, (currentPage - 1) * itemsPerPage + idx)}
                </div>
              ))}
            </div>
          ) : null}

          {/* Desktop Table View */}
          <div className={`${mobileCardRender ? "hidden md:block" : "block"} overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md shadow-xl`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-200">
                <thead className="bg-zinc-950/90 text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] border-b border-white/10">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-3.5 ${col.className || ""}`}
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className="inline-flex items-center gap-1.5 hover:text-white transition font-black"
                          >
                            <span>{col.header}</span>
                            <ArrowUpDown className="w-3 h-3 text-[#ccff00]" />
                          </button>
                        ) : (
                          <span>{col.header}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedData.map((item, idx) => (
                    <tr
                      key={keyExtractor(item)}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3.5 text-xs font-semibold ${col.className || ""}`}>
                          {col.render
                            ? col.render(item, (currentPage - 1) * itemsPerPage + idx)
                            : String(item[col.key] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-zinc-400">
            <div>
              Menampilkan{" "}
              <span className="font-black text-white">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              sampai{" "}
              <span className="font-black text-white">
                {Math.min(currentPage * itemsPerPage, sortedData.length)}
              </span>{" "}
              dari <span className="font-black text-white">{sortedData.length}</span> data
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-950 transition"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-950 transition"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-black text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-950 transition"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-950 transition"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
