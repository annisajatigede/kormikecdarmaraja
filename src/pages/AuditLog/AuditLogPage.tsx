import React, { useState, useEffect, useCallback } from "react";
import { History, Download, ShieldCheck, Filter, Clock, UserCheck } from "lucide-react";
import { AuditLog } from "../../types";
import { apiService } from "../../services/api";
import { DataTable, Column } from "../../components/DataTable/DataTable";
import { useToast } from "../../components/Toast/ToastContext";

export const AuditLogPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getAuditLog();
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        showError(res.message || "Gagal memuat riwayat audit");
      }
    } catch (err: any) {
      showError(err.message || "Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter === "ALL") return true;
    return l.ACTION === actionFilter;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showError("Tidak ada riwayat untuk diekspor");
      return;
    }

    const headers = ["ID Log", "Timestamp", "User", "Role", "Action", "Table", "Record ID", "Description"];
    const rows = filteredLogs.map((item) => [
      `"${item.ID_LOG}"`,
      `"${item.TIMESTAMP}"`,
      `"${item.NAMA_USER}"`,
      `"${item.ROLE}"`,
      `"${item.ACTION}"`,
      `"${item.TABLE_NAME}"`,
      `"${item.RECORD_ID || ""}"`,
      `"${(item.DESCRIPTION || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Log_KORMI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Audit log berhasil diekspor!");
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATE":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "LOGIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "TIMESTAMP",
      header: "Waktu",
      sortable: true,
      className: "w-36 font-mono text-xs text-slate-500",
      render: (item) => (
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {item.TIMESTAMP}
        </span>
      )
    },
    {
      key: "NAMA_USER",
      header: "Pengguna & Peran",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{item.NAMA_USER}</p>
          <span className="text-[10px] text-slate-400 font-semibold">{item.ROLE}</span>
        </div>
      )
    },
    {
      key: "ACTION",
      header: "Aksi",
      sortable: true,
      className: "w-24 text-center",
      render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getActionBadge(item.ACTION)}`}>
          {item.ACTION}
        </span>
      )
    },
    {
      key: "TABLE_NAME",
      header: "Modul / Tabel",
      sortable: true,
      className: "w-32",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {item.TABLE_NAME}
        </span>
      )
    },
    {
      key: "DESCRIPTION",
      header: "Keterangan Aktivitas",
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {item.DESCRIPTION}
        </p>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Audit Log & Jejak Aktivitas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan rekam jejak otomatis setiap penambahan, perubahan, dan penghapusan data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Log
          </button>
        </div>
      </div>

      {/* Action Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "CREATE", "UPDATE", "DELETE", "LOGIN"].map((act) => (
          <button
            key={act}
            type="button"
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              actionFilter === act
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {act === "ALL" ? "Semua Aksi" : act}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        keyExtractor={(item) => item.ID_LOG}
        isLoading={isLoading}
        searchPlaceholder="Cari nama pengguna, tabel, atau deskripsi log..."
        searchKeys={["NAMA_USER", "TABLE_NAME", "DESCRIPTION", "ACTION"]}
        itemsPerPage={15}
      />
    </div>
  );
};
