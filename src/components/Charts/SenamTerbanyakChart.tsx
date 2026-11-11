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
import { SenamTerbanyakItem } from "../../types";
import { Flame, Users } from "lucide-react";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton } from "../Loading/LoadingSpinner";

interface SenamTerbanyakChartProps {
  data: SenamTerbanyakItem[];
  isLoading?: boolean;
  activePeriodLabel?: string;
}

// KORMI Athletic Palette
const KORMI_BAR_COLORS = [
  "#dc2626", // 1st - KORMI Red
  "#2563eb", // 2nd - Royal Blue
  "#f59e0b", // 3rd - Amber/Gold
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
  "#64748b"  // Slate
];

export const SenamTerbanyakChart: React.FC<SenamTerbanyakChartProps> = ({
  data,
  isLoading = false,
  activePeriodLabel
}) => {
  // Urutkan seluruh desa dari jumlah peserta terbanyak ke terendah (semua desa ditampilkan)
  const displayData = [...data].sort(
    (a, b) => (b.totalPeserta || 0) - (a.totalPeserta || 0) || (b.totalKegiatan || 0) - (a.totalKegiatan || 0)
  );

  const grandTotalPeserta = displayData.reduce((acc, curr) => acc + (curr.totalPeserta || 0), 0);
  const grandTotalKegiatan = displayData.reduce((acc, curr) => acc + (curr.totalKegiatan || 0), 0);

  const getRankBadge = (index: number) => {
    if (index === 0) return "🥇 Juara 1";
    if (index === 1) return "🥈 Juara 2";
    if (index === 2) return "🥉 Juara 3";
    return `Peringkat #${index + 1}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase font-display">
              Senam Terbanyak
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Peringkat akumulasi jumlah peserta seluruh desa di Kecamatan Darmaraja
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activePeriodLabel && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase tracking-wider">
              {activePeriodLabel}
            </span>
          )}
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-black border border-red-200 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3 text-red-600" /> {grandTotalPeserta.toLocaleString("id-ID")} Peserta ({grandTotalKegiatan} Kegiatan)
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
          title="Tidak Ada Data Senam"
          description="Belum ada data desa atau peserta senam pada filter/periode ini."
        />
      ) : (
        <div className="space-y-4">
          {/* Top 3 Quick Podium Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {displayData.slice(0, 3).map((item, idx) => (
              <div
                key={`podium-${idx}`}
                className={`p-3 rounded-xl border flex items-center justify-between shadow-xs ${
                  idx === 0
                    ? "bg-red-50/90 border-red-200 text-red-950"
                    : idx === 1
                    ? "bg-blue-50/90 border-blue-200 text-blue-950"
                    : "bg-amber-50/90 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase truncate text-slate-900">
                      Desa {item.namaDesa}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold">{item.totalKegiatan || 0} Kegiatan</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900">
                    {(item.totalPeserta || 0).toLocaleString("id-ID")}
                  </span>
                  <p className="text-[9px] uppercase font-bold text-slate-500">Peserta</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart with All Village Names on X-Axis */}
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 10, right: 15, left: -10, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="namaDesa"
                  tick={{ fill: "#1e293b", fontSize: 10, fontWeight: 800 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  height={58}
                  tickFormatter={(val) => `Desa ${val}`}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as SenamTerbanyakItem;
                      const index = displayData.findIndex((d) => d.namaDesa === item.namaDesa);
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl text-xs space-y-1.5 min-w-[210px]">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                              Desa {item.namaDesa}
                            </p>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              {getRankBadge(index)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 pt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3.5 h-3.5 text-red-600" /> Total Peserta:
                            </span>
                            <span className="font-black text-red-600 text-sm">
                              {(item.totalPeserta || 0).toLocaleString("id-ID")} Orang
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="font-medium">Total Kegiatan:</span>
                            <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {item.totalKegiatan || 0} Kali
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalPeserta" radius={[8, 8, 0, 0]} maxBarSize={42}>
                  {displayData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={KORMI_BAR_COLORS[index % KORMI_BAR_COLORS.length]}
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
