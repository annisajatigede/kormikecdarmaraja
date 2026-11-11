import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  PlusCircle,
  Download,
  Filter,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Users,
  MapPin,
  Activity,
  Image as ImageIcon
} from "lucide-react";
import { Desa, JenisSenam, LaporanSenam, SessionUser, StatusAbsensi, User } from "../../types";
import { apiService } from "../../services/api";
import { DataTable, Column } from "../../components/DataTable/DataTable";
import { InputLaporanModal } from "./InputLaporanModal";
import { DetailLaporanModal } from "./DetailLaporanModal";
import { ConfirmModal } from "../../components/Modal/ConfirmModal";
import { useToast } from "../../components/Toast/ToastContext";
import { normalizeDate, getTodayJakarta, formatIndonesianDate } from "../../utils/dashboardHelper";

interface LaporanPageProps {
  user: SessionUser | null;
  autoOpenInput?: boolean;
}

export const LaporanPage: React.FC<LaporanPageProps> = ({ user, autoOpenInput = false }) => {
  const { showSuccess, showError } = useToast();

  const isKader = user?.ROLE === "Kader";
  const isAdmin = user?.ROLE === "Admin";
  const isKoordinator = user?.ROLE === "Koordinator";

  const [laporanList, setLaporanList] = useState<LaporanSenam[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [jenisSenamList, setJenisSenamList] = useState<JenisSenam[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDesa, setFilterDesa] = useState(isKader ? user?.ID_DESA || "" : "Semua Desa");
  const [filterJenisSenam, setFilterJenisSenam] = useState("Semua Jenis");
  const [filterStatus, setFilterStatus] = useState("Semua Status");

  // Modals state
  const [isInputModalOpen, setIsInputModalOpen] = useState(autoOpenInput);
  const [editingLaporan, setEditingLaporan] = useState<LaporanSenam | null>(null);
  const [detailLaporan, setDetailLaporan] = useState<LaporanSenam | null>(null);
  const [deletingLaporan, setDeletingLaporan] = useState<LaporanSenam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLaporan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getLaporan({
        startDate: filterStartDate,
        endDate: filterEndDate,
        idDesa: filterDesa === "Semua Desa" ? "" : filterDesa,
        jenisSenam: filterJenisSenam === "Semua Jenis" ? "" : filterJenisSenam,
        statusAbsensi: filterStatus === "Semua Status" ? "" : (filterStatus as StatusAbsensi),
        // If user is kader, filter by their id_kader or id_desa
        idKader: isKader ? user?.ID_USER : ""
      });

      if (res.success && res.data) {
        setLaporanList(res.data);
      } else {
        showError(res.message || "Gagal memuat daftar laporan");
      }
    } catch (err: any) {
      showError(err.message || "Gagal terhubung ke database");
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterDesa, filterJenisSenam, filterStatus, isKader, user, showError]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [dRes, jsRes, uRes] = await Promise.all([
          apiService.getDesa(),
          apiService.getJenisSenam(),
          isAdmin || isKoordinator ? apiService.getUsers() : Promise.resolve({ success: true, data: [] })
        ]);
        if (dRes.success && dRes.data) setDesaList(dRes.data);
        if (jsRes.success && jsRes.data) setJenisSenamList(jsRes.data);
        if (uRes.success && uRes.data) setUsersList(uRes.data);
      } catch (e) {
        console.error("Gagal memuat master:", e);
      }
    };
    loadMasters();
  }, [isAdmin, isKoordinator]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  const handleDeleteConfirm = async () => {
    if (!deletingLaporan) return;
    setIsDeleting(true);
    try {
      const res = await apiService.deleteLaporan(
        deletingLaporan.ID_LAPORAN,
        deletingLaporan.FOTO_URL,
        deletingLaporan.FOTO_FILE_ID
      );
      if (res.success) {
        showSuccess("Laporan senam dan foto di Google Drive berhasil dihapus");
        setDeletingLaporan(null);
        fetchLaporan();
      } else {
        showError(res.message || "Gagal menghapus laporan");
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (laporanList.length === 0) {
      showError("Tidak ada data laporan untuk diekspor");
      return;
    }

    const headers = [
      "ID Laporan",
      "ID Desa",
      "Nama Desa",
      "ID Kader",
      "Nama Kader",
      "Tanggal",
      "Jumlah Peserta",
      "Jenis Senam",
      "Status Absensi",
      "Foto URL",
      "Caption",
      "Created At"
    ];

    const rows = laporanList.map((item) => [
      `"${item.ID_LAPORAN}"`,
      `"${item.ID_DESA}"`,
      `"${item.NAMA_DESA}"`,
      `"${item.ID_KADER}"`,
      `"${item.NAMA_KADER}"`,
      `"${item.TANGGAL}"`,
      item.JUMLAH_PESERTA,
      `"${item.JENIS_SENAM}"`,
      `"${item.STATUS_ABSENSI}"`,
      `"${item.FOTO_URL || ""}"`,
      `"${(item.CAPTION_FOTO || "").replace(/"/g, '""')}"`,
      `"${item.CREATED_AT || ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Senam_KORMI_Darmaraja_${getTodayJakarta()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Data laporan berhasil diekspor ke format CSV / Excel!");
  };

  const columns: Column<LaporanSenam>[] = [
    {
      key: "FOTO_URL",
      header: "Foto",
      className: "w-16 text-center",
      render: (item) =>
        item.FOTO_URL ? (
          <img
            src={item.FOTO_URL}
            alt="Foto"
            className="w-10 h-10 rounded-lg object-cover mx-auto border border-slate-200 cursor-pointer hover:scale-110 transition shadow-2xs"
            onClick={() => setDetailLaporan(item)}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
            <ImageIcon className="w-4 h-4" />
          </div>
        )
    },
    {
      key: "TANGGAL",
      header: "Tanggal",
      sortable: true,
      className: "font-semibold text-slate-800",
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 block">
            {normalizeDate(item.TANGGAL)}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatIndonesianDate(item.TANGGAL)}
          </span>
        </div>
      )
    },
    {
      key: "NAMA_DESA",
      header: "Desa",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">Desa {item.NAMA_DESA}</p>
          <p className="text-[10px] text-slate-400 font-mono">{item.ID_DESA}</p>
        </div>
      )
    },
    {
      key: "NAMA_KADER",
      header: "Kader Pelapor",
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">{item.NAMA_KADER}</span>
      )
    },
    {
      key: "JENIS_SENAM",
      header: "Jenis Senam",
      sortable: true,
      render: (item) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {item.JENIS_SENAM}
        </span>
      )
    },
    {
      key: "JUMLAH_PESERTA",
      header: "Peserta",
      sortable: true,
      className: "text-right",
      render: (item) => (
        <span className="font-bold text-slate-800 text-xs">
          {Number(item.JUMLAH_PESERTA).toLocaleString("id-ID")} Orang
        </span>
      )
    },
    {
      key: "STATUS_ABSENSI",
      header: "Status",
      sortable: true,
      className: "text-center",
      render: (item) => (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            item.STATUS_ABSENSI === "Hadir"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : item.STATUS_ABSENSI === "Izin"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {item.STATUS_ABSENSI}
        </span>
      )
    },
    {
      key: "ACTIONS",
      header: "Aksi",
      className: "text-right w-24",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setDetailLaporan(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingLaporan(item);
              setIsInputModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            title="Edit Laporan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeletingLaporan(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Hapus Laporan & Foto GDrive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  // Mobile card view representation
  const renderMobileCard = (item: LaporanSenam) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          {item.FOTO_URL ? (
            <img
              src={item.FOTO_URL}
              alt="Foto"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              onClick={() => setDetailLaporan(item)}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800 text-xs">Desa {item.NAMA_DESA}</p>
            <p className="text-[11px] text-slate-500 font-mono">{item.TANGGAL}</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            item.STATUS_ABSENSI === "Hadir"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : item.STATUS_ABSENSI === "Izin"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {item.STATUS_ABSENSI}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">Jenis Senam</span>
          <span className="font-semibold text-slate-700">{item.JENIS_SENAM}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">Jumlah Peserta</span>
          <span className="font-bold text-emerald-700">{item.JUMLAH_PESERTA} Orang</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
          Oleh: {item.NAMA_KADER}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDetailLaporan(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingLaporan(item);
              setIsInputModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeletingLaporan(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
              title="Hapus Laporan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {isKader ? "Daftar Laporan Senam Saya" : "Data Laporan Senam KORMI"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar riwayat kegiatan dan dokumentasi senam di wilayah Kecamatan Darmaraja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingLaporan(null);
              setIsInputModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-sm shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" /> Input Laporan
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Laporan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mulai</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sampai</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desa</label>
            <select
              value={filterDesa}
              onChange={(e) => setFilterDesa(e.target.value)}
              disabled={isKader}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100"
            >
              {!isKader && <option value="Semua Desa">Semua Desa</option>}
              {desaList.map((d) => (
                <option key={d.ID_DESA} value={d.ID_DESA}>
                  Desa {d.NAMA_DESA}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Senam</label>
            <select
              value={filterJenisSenam}
              onChange={(e) => setFilterJenisSenam(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="Semua Jenis">Semua Jenis</option>
              {jenisSenamList.map((j) => (
                <option key={j.ID_JENIS} value={j.NAMA_JENIS}>
                  {j.NAMA_JENIS}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Absensi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Alfa">Alfa</option>
            </select>
          </div>
        </div>

        {(filterStartDate || filterEndDate || (filterDesa && filterDesa !== "Semua Desa" && !isKader) || filterJenisSenam !== "Semua Jenis" || filterStatus !== "Semua Status") && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setFilterStartDate("");
                setFilterEndDate("");
                if (!isKader) setFilterDesa("Semua Desa");
                setFilterJenisSenam("Semua Jenis");
                setFilterStatus("Semua Status");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Main DataTable */}
      <DataTable
        data={laporanList}
        columns={columns}
        keyExtractor={(item) => item.ID_LAPORAN}
        isLoading={isLoading}
        searchPlaceholder="Cari desa, nama kader, jenis senam, caption..."
        searchKeys={["NAMA_DESA", "NAMA_KADER", "JENIS_SENAM", "CAPTION_FOTO", "TANGGAL"]}
        itemsPerPage={10}
        mobileCardRender={renderMobileCard}
        emptyTitle="Belum Ada Laporan Senam"
        emptyDescription="Tidak ada laporan yang sesuai dengan filter atau pencarian Anda."
      />

      {/* Input / Edit Modal */}
      <InputLaporanModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditingLaporan(null);
        }}
        onSuccess={fetchLaporan}
        user={user}
        editData={editingLaporan}
        desaList={desaList}
        jenisSenamList={jenisSenamList}
        usersList={usersList}
      />

      {/* Detail Modal */}
      <DetailLaporanModal
        isOpen={Boolean(detailLaporan)}
        onClose={() => setDetailLaporan(null)}
        laporan={detailLaporan}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingLaporan)}
        onClose={() => setDeletingLaporan(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Laporan Senam & Foto"
        message={`Apakah Anda yakin ingin menghapus data laporan senam "${deletingLaporan?.JENIS_SENAM || 'Senam'} - Desa ${deletingLaporan?.NAMA_DESA || ''} (${deletingLaporan?.TANGGAL || ''})"? Foto dokumentasi terkait yang tersimpan di Google Drive juga akan dihapus secara otomatis.`}
        confirmLabel="Hapus Laporan & Foto"
        isLoading={isDeleting}
      />
    </div>
  );
};
