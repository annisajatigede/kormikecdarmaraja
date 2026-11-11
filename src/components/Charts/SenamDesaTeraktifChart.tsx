import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";
import { SenamDesaTeraktifItem } from "../../types";
import { Trophy, Users } from "lucide-react";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton } from "../Loading/LoadingSpinner";

interface SenamDesaTeraktifChartProps {
  data: SenamDesaTeraktifItem[];
  isLoading?: boolean;
  activePeriodLabel?: string;
}

const TERAKTIF_COLORS = [
  "#2563eb", // Blue
  "#3b82f6",
  "#60a5fa",
  "#0284c7",
  "#0ea5e9",
  "#06b6d4",
  "#0d9488",
  "#10b981",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316"
];

export const SenamDesaTeraktifChart: React.FC<SenamDesaTeraktifChartProps> = ({
  data,
  isLoading = false,
  activePeriodLabel
}) => {
  // Tampilkan seluruh desa di Darmaraja, diurutkan dari yang paling aktif (kegiatan terbanyak)
  const displayData = [...data].sort(
    (a, b) => (b.totalKegiatan || 0) - (a.totalKegiatan || 0) || (b.totalPeserta || 0) - (a.totalPeserta || 0)
  );

  const desaAdaKegiatan = displayData.filter((d) => (d.totalKegiatan || 0) > 0).length;
  const grandTotalKegiatan = displayData.reduce((acc, curr) => acc + (curr.totalKegiatan || 0), 0);
  const grandTotalPeserta = displayData.reduce((acc, curr) => acc + (curr.totalPeserta || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Trophy className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase font-display">
              Senam Desa Teraktif
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Frekuensi pelaksanaan kegiatan senam seluruh desa di Kecamatan Darmaraja
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activePeriodLabel && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase tracking-wider">
              {activePeriodLabel}
            </span>
          )}
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-black border border-blue-200 uppercase tracking-wider">
            {desaAdaKegiatan} Desa Aktif ({grandTotalKegiatan} Kegiatan)
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col justify-end gap-3 p-4">
          <Skeleton className="h-40 w-full bg-slate-100" />
          <Skeleton className="h-4 w-full bg-slate-100" />
        </div>
      ) : displayData.length === 0 ? (
        <EmptyState
          title="Belum Ada Data Desa"
          description="Belum ada data desa atau laporan kegiatan senam pada filter/periode ini."
        />
      ) : (
        <div className="space-y-4">
          {/* Quick Summary Pill Bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-medium">
              Total Partisipasi Semua Desa: <strong className="text-slate-900">{grandTotalKegiatan} Kegiatan</strong>
            </span>
            <span className="text-slate-600 font-medium">
              Akumulasi Warga Senam: <strong className="text-red-600">{grandTotalPeserta.toLocaleString("id-ID")} Peserta</strong>
            </span>
          </div>

          {/* Horizontal Bar Chart showing ALL villages */}
          <div className="h-96 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                layout="vertical"
                margin={{ top: 5, right: 35, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="namaDesa"
                  tick={{ fill: "#1e293b", fontSize: 11, fontWeight: 800 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  width={110}
                  tickFormatter={(val) => `Desa ${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as SenamDesaTeraktifItem;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <p className="font-black text-blue-600 text-sm border-b border-slate-100 pb-1 uppercase tracking-tight">
                            Desa {item.namaDesa}
                          </p>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Total Kegiatan:</span>
                            <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                              {item.totalKegiatan || 0} Kegiatan
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3.5 h-3.5 text-red-600" /> Total Peserta:
                            </span>
                            <span className="font-black text-red-600">
                              {(item.totalPeserta || 0).toLocaleString("id-ID")} Orang
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="totalKegiatan"
                  radius={[0, 8, 8, 0]}
                  maxBarSize={22}
                >
                  {displayData.map((_, index) => (
                    <Cell
                      key={`cell-teraktif-${index}`}
                      fill={TERAKTIF_COLORS[index % TERAKTIF_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
