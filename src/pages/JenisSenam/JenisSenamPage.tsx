import React, { useState, useEffect, useCallback } from "react";
import { Activity, PlusCircle, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { JenisSenam, SessionUser, StatusRecord } from "../../types";
import { apiService } from "../../services/api";
import { DataTable, Column } from "../../components/DataTable/DataTable";
import { Modal } from "../../components/Modal/Modal";
import { ConfirmModal } from "../../components/Modal/ConfirmModal";
import { useToast } from "../../components/Toast/ToastContext";

interface JenisSenamPageProps {
  user: SessionUser | null;
}

export const JenisSenamPage: React.FC<JenisSenamPageProps> = ({ user }) => {
  const { showSuccess, showError } = useToast();
  const isAdmin = user?.ROLE === "Admin";

  const [list, setList] = useState<JenisSenam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisSenam | null>(null);
  const [namaJenis, setNamaJenis] = useState("");
  const [status, setStatus] = useState<StatusRecord>("Aktif");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getJenisSenam();
      if (res.success && res.data) {
        setList(res.data);
      } else {
        showError(res.message || "Gagal memuat data jenis senam");
      }
    } catch (err: any) {
      showError(err.message || "Gagal terhubung ke database");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaJenis("");
    setStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JenisSenam) => {
    setEditingItem(item);
    setNamaJenis(item.NAMA_JENIS);
    setStatus(item.STATUS);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaJenis.trim()) {
      showError("Nama jenis senam wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await apiService.updateJenisSenam({
          ID_JENIS: editingItem.ID_JENIS,
          NAMA_JENIS: namaJenis.trim(),
          STATUS: status
        });
        if (res.success) {
          showSuccess("Data jenis senam berhasil diperbarui");
          setIsModalOpen(false);
          fetchList();
        } else {
          showError(res.message || "Gagal memperbarui jenis senam");
        }
      } else {
        const res = await apiService.saveJenisSenam({
          NAMA_JENIS: namaJenis.trim(),
          STATUS: status
        });
        if (res.success) {
          showSuccess("Jenis senam baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchList();
        } else {
          showError(res.message || "Gagal menyimpan jenis senam");
        }
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await apiService.deleteJenisSenam(deletingId);
      if (res.success) {
        showSuccess("Jenis senam berhasil dihapus");
        setDeletingId(null);
        fetchList();
      } else {
        showError(res.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<JenisSenam>[] = [
    {
      key: "ID_JENIS",
      header: "ID Jenis",
      sortable: true,
      className: "w-28 font-mono text-xs font-semibold text-slate-700"
    },
    {
      key: "NAMA_JENIS",
      header: "Nama Kategori Senam",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Activity className="w-4 h-4" />
          </span>
          <span className="font-bold text-slate-800 text-sm">{item.NAMA_JENIS}</span>
        </div>
      )
    },
    {
      key: "STATUS",
      header: "Status",
      sortable: true,
      className: "w-28 text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            item.STATUS === "Aktif"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {item.STATUS === "Aktif" ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ) : (
            <XCircle className="w-3 h-3 text-slate-400" />
          )}
          {item.STATUS}
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
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            title="Edit Jenis Senam"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeletingId(item.ID_JENIS)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Hapus Jenis Senam"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Master Data Jenis Senam
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar jenis dan kategori aktivitas senam yang diselenggarakan KORMI Darmaraja
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-sm shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" /> Tambah Jenis Senam
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={list}
        columns={columns}
        keyExtractor={(item) => item.ID_JENIS}
        isLoading={isLoading}
        searchPlaceholder="Cari nama jenis senam..."
        searchKeys={["NAMA_JENIS", "ID_JENIS"]}
        itemsPerPage={10}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Jenis Senam" : "Tambah Jenis Senam Baru"}
        subtitle="Kategori kegiatan senam KORMI Darmaraja"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Jenis Senam
            </label>
            <input
              type="text"
              value={namaJenis}
              onChange={(e) => setNamaJenis(e.target.value)}
              placeholder="Contoh: Senam Lansia / Senam Aerobik"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status Keaktifan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Aktif", "Nonaktif"] as StatusRecord[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    status === st
                      ? st === "Aktif"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-700 text-white border-slate-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Jenis Senam"
        message="Apakah Anda yakin ingin menghapus data jenis senam ini?"
        confirmLabel="Hapus Data"
        isLoading={isDeleting}
      />
    </div>
  );
};
