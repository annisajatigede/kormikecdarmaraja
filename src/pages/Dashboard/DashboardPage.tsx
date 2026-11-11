import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Users,
  MapPin,
  UserCheck,
  Calendar,
  Filter,
  RotateCcw,
  Sparkles,
  Eye,
  PlusCircle
} from "lucide-react";
import {
  DashboardStats,
  Desa,
  JenisSenam,
  LaporanSenam,
  SenamDesaTeraktifItem,
  SenamTerbanyakItem,
  SessionUser
} from "../../types";
import { apiService } from "../../services/api";
import { StatCard } from "../../components/StatCard/StatCard";
import { SenamTerbanyakChart } from "../../components/Charts/SenamTerbanyakChart";
import { SenamDesaTeraktifChart } from "../../components/Charts/SenamDesaTeraktifChart";
import { DetailLaporanModal } from "../Laporan/DetailLaporanModal";
import { useToast } from "../../components/Toast/ToastContext";
import { Skeleton } from "../../components/Loading/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { APP_TAGLINE, INITIAL_DESA_LIST } from "../../constants";
import { processDashboardData, FilterParams, normalizeDate, formatIndonesianDate } from "../../utils/dashboardHelper";

interface DashboardPageProps {
  user: SessionUser | null;
  onNavigateToInput?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onNavigateToInput }) => {
  const { showError } = useToast();

  // Filter input state (Default "Semua Waktu" agar seluruh data yang sudah diinput langsung tampil)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterJenisSenam, setFilterJenisSenam] = useState("Semua Jenis");
  const [filterDesa, setFilterDesa] = useState("Semua Desa");

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>({
    startDate: "",
    endDate: "",
    jenisSenam: "Semua Jenis",
    idDesa: "Semua Desa"
  });

  const [allReports, setAllReports] = useState<LaporanSenam[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [jenisSenamList, setJenisSenamList] = useState<JenisSenam[]>([]);
  const [totalKaderCount, setTotalKaderCount] = useState(12);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<LaporanSenam | null>(null);

  // Load masters for dropdown filter options & kader count
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [dRes, jsRes, uRes] = await Promise.all([
          apiService.getDesa(),
          apiService.getJenisSenam(),
          apiService.getUsers()
        ]);
        if (dRes.success && dRes.data && dRes.data.length > 0) {
          setDesaList(dRes.data);
        } else {
          setDesaList(INITIAL_DESA_LIST as Desa[]);
        }
        if (jsRes.success && jsRes.data) setJenisSenamList(jsRes.data);
        if (uRes.success && uRes.data) {
          const kCount = uRes.data.filter(
            (u) => u.ROLE === "Kader" && String(u.STATUS).toLowerCase() !== "nonaktif"
          ).length;
          setTotalKaderCount(kCount || 12);
        }
      } catch (err) {
        console.error("Gagal memuat master data:", err);
      }
    };
    loadMasters();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ambil seluruh data laporan senam (tanpa filter query sempit) agar statistik bulan berjalan & agregasi 12 desa selalu akurat
      const [dashRes, lapRes] = await Promise.all([
        apiService.getDashboard({}),
        apiService.getLaporan({})
      ]);

      let reports: LaporanSenam[] = [];
      if (lapRes.success && Array.isArray(lapRes.data)) {
        reports = lapRes.data;
      } else if (dashRes.success && dashRes.data?.recentReports) {
        reports = dashRes.data.recentReports;
      }

      setAllReports(reports);
    } catch (err: any) {
      showError(err.message || "Gagal menghubungi server database");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Kalkulasi reaktif dari dataset master berdasarkan filter yang sedang aktif
  const dashboardCalculated = useMemo(() => {
    return processDashboardData(
      allReports,
      desaList.length > 0 ? desaList : (INITIAL_DESA_LIST as Desa[]),
      totalKaderCount,
      appliedFilters
    );
  }, [allReports, desaList, totalKaderCount, appliedFilters]);

  const { stats, senamTerbanyak, senamTeraktif, filteredReports } = dashboardCalculated;

  // 10 Laporan Terakhir (dari data terbaru yang difilter / keseluruhan)
  const recentReports = useMemo(() => {
    const list = filteredReports.length > 0 ? filteredReports : allReports;
    return [...list]
      .sort((a, b) => normalizeDate(b.TANGGAL).localeCompare(normalizeDate(a.TANGGAL)))
      .slice(0, 10);
  }, [filteredReports, allReports]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      startDate: filterStartDate,
      endDate: filterEndDate,
      jenisSenam: filterJenisSenam,
      idDesa: filterDesa
    });
  };

  const handleResetFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterJenisSenam("Semua Jenis");
    setFilterDesa("Semua Desa");
    setAppliedFilters({
      startDate: "",
      endDate: "",
      jenisSenam: "Semua Jenis",
      idDesa: "Semua Desa"
    });
  };

  const getActivePeriodLabel = () => {
    if (!appliedFilters.startDate && !appliedFilters.endDate) return "Semua Waktu";
    return `${appliedFilters.startDate || "Awal"} s/d ${appliedFilters.endDate || "Sekarang"}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Greeting & Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-slate-900 shadow-sm border border-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>{APP_TAGLINE}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-display">
              Selamat Datang, {user?.NAMA || "Pengguna"}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Monitoring, dokumentasi kehadiran, dan agregasi data kegiatan senam KORMI Kecamatan Darmaraja.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user?.ROLE === "Kader" && onNavigateToInput && (
              <button
                type="button"
                onClick={onNavigateToInput}
                className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-md shadow-red-600/20 transition"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                Input Laporan Senam
              </button>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black block">
                Hak Akses Anda
              </span>
              <span className="text-sm font-black text-slate-900 uppercase">
                {user?.ROLE === "Admin" ? "Administrator Sistem" : user?.ROLE || "Kader"}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient shapes */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Stat Cards Grid (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          id="stat-total-kegiatan"
          title="Total Kegiatan"
          value={stats.totalKegiatan}
          subtitle={appliedFilters.startDate || appliedFilters.endDate || appliedFilters.jenisSenam !== "Semua Jenis" || appliedFilters.idDesa !== "Semua Desa" ? "Sesuai filter" : "Total kegiatan"}
          icon={<Activity className="w-5 h-5" />}
          variant="red"
          isLoading={isLoading}
        />
        <StatCard
          id="stat-total-peserta"
          title="Total Peserta"
          value={stats.totalPeserta}
          subtitle="Partisipasi warga"
          icon={<Users className="w-5 h-5" />}
          variant="blue"
          isLoading={isLoading}
        />
        <StatCard
          id="stat-total-desa"
          title="Total Desa"
          value={stats.totalDesa}
          subtitle="Desa di Darmaraja"
          icon={<MapPin className="w-5 h-5" />}
          variant="amber"
          isLoading={isLoading}
        />
        <StatCard
          id="stat-total-kader"
          title="Total Kader"
          value={stats.totalKader}
          subtitle="Kader senam aktif"
          icon={<UserCheck className="w-5 h-5" />}
          variant="indigo"
          isLoading={isLoading}
        />
        <StatCard
          id="stat-kegiatan-bulan-ini"
          title="Kegiatan Bln Ini"
          value={stats.kegiatanBulanIni}
          subtitle="Bulan berjalan"
          icon={<Calendar className="w-5 h-5" />}
          variant="teal"
          isLoading={isLoading}
        />
        <StatCard
          id="stat-peserta-bulan-ini"
          title="Peserta Bln Ini"
          value={stats.pesertaBulanIni}
          subtitle="Bulan berjalan"
          icon={<Users className="w-5 h-5" />}
          variant="orange"
          isLoading={isLoading}
        />
      </div>

      {/* 3. Filter Dashboard */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-3.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Filter Analisis Grafik & Statistik
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Periode Aktif: <strong className="text-red-600">{getActivePeriodLabel()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
              Jenis Senam
            </label>
            <select
              value={filterJenisSenam}
              onChange={(e) => setFilterJenisSenam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            >
              <option value="Semua Jenis">Semua Jenis Senam</option>
              {jenisSenamList.map((j) => (
                <option key={j.ID_JENIS} value={j.NAMA_JENIS}>
                  {j.NAMA_JENIS}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
              Desa
            </label>
            <select
              value={filterDesa}
              onChange={(e) => setFilterDesa(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            >
              <option value="Semua Desa">Semua Desa (12 Desa)</option>
              {desaList.map((d) => (
                <option key={d.ID_DESA} value={d.ID_DESA}>
                  Desa {d.NAMA_DESA}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetFilter}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-sm transition"
          >
            <Filter className="w-3.5 h-3.5" /> Terapkan Filter
          </button>
        </div>
      </div>

      {/* 4. Charts Grid: Senam Terbanyak (Desa) + Senam Desa Teraktif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SenamTerbanyakChart
          data={senamTerbanyak}
          isLoading={isLoading}
          activePeriodLabel={getActivePeriodLabel()}
        />
        <SenamDesaTeraktifChart
          data={senamTeraktif}
          isLoading={isLoading}
          activePeriodLabel={getActivePeriodLabel()}
        />
      </div>

      {/* 5. 10 Laporan Terakhir Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase font-display">
              10 Laporan Terakhir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktivitas senam terbaru yang dilaporkan oleh kader di seluruh desa
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-black uppercase tracking-wider border border-slate-200">
            Terbaru &rarr; Terlama
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-full bg-slate-100" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <EmptyState
            title="Belum Ada Laporan Senam"
            description="Laporan kegiatan senam yang diinput oleh kader akan tampil otomatis di sini."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {recentReports.map((item) => (
              <div
                key={item.ID_LAPORAN}
                onClick={() => setSelectedReportForDetail(item)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-red-300 hover:shadow-md transition duration-200 flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                  {item.FOTO_URL ? (
                    <img
                      src={item.FOTO_URL}
                      alt={item.JENIS_SENAM}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <span className="text-xs font-bold uppercase">Foto Dokumentasi</span>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white shadow-xs">
                      Desa {item.NAMA_DESA}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <Users className="w-3 h-3 text-red-400" /> {item.JUMLAH_PESERTA}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-red-600 transition">
                      {item.JENIS_SENAM}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {formatIndonesianDate(item.TANGGAL)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span className="truncate max-w-[90px]">Kdr: {item.NAMA_KADER}</span>
                    <span className="text-red-600 font-black group-hover:underline flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> Detail
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailLaporanModal
        isOpen={Boolean(selectedReportForDetail)}
        onClose={() => setSelectedReportForDetail(null)}
        laporan={selectedReportForDetail}
      />
    </div>
  );
};
