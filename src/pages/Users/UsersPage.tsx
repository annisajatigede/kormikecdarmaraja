import React, { useState, useEffect, useCallback } from "react";
import { Users, PlusCircle, Edit2, Trash2, Shield, MapPin, CheckCircle2, XCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { Desa, SessionUser, StatusRecord, User, UserRole } from "../../types";
import { apiService } from "../../services/api";
import { DataTable, Column } from "../../components/DataTable/DataTable";
import { Modal } from "../../components/Modal/Modal";
import { ConfirmModal } from "../../components/Modal/ConfirmModal";
import { useToast } from "../../components/Toast/ToastContext";

interface UsersPageProps {
  user: SessionUser | null;
}

export const UsersPage: React.FC<UsersPageProps> = ({ user }) => {
  const { showSuccess, showError } = useToast();
  const isAdmin = user?.ROLE === "Admin";

  const [list, setList] = useState<User[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("Kader");
  const [idDesa, setIdDesa] = useState("");
  const [status, setStatus] = useState<StatusRecord>("Aktif");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([apiService.getUsers(), apiService.getDesa()]);
      if (uRes.success && uRes.data) setList(uRes.data);
      if (dRes.success && dRes.data) setDesaList(dRes.data);
    } catch (err: any) {
      showError(err.message || "Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNama("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setRole("Kader");
    setIdDesa(desaList[0]?.ID_DESA || "DSA-0001");
    setStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: User) => {
    setEditingItem(item);
    setNama(item.NAMA);
    setUsername(item.USERNAME);
    setPassword(""); // Leave blank if not changing
    setShowPassword(false);
    setRole(item.ROLE);
    setIdDesa(item.ID_DESA);
    setStatus(item.STATUS);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) {
      showError("Nama lengkap dan username wajib diisi");
      return;
    }

    if (!editingItem && !password.trim()) {
      showError("Password wajib diisi untuk pengguna baru");
      return;
    }

    const selectedDesa = desaList.find((d) => d.ID_DESA === idDesa);
    const namaDesa = selectedDesa?.NAMA_DESA || "Darmaraja";

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await apiService.updateUser({
          ID_USER: editingItem.ID_USER,
          NAMA: nama.trim(),
          USERNAME: username.trim(),
          PASSWORD: password.trim() || undefined,
          ROLE: role,
          ID_DESA: idDesa,
          NAMA_DESA: namaDesa,
          STATUS: status
        });
        if (res.success) {
          showSuccess("Data pengguna berhasil diperbarui");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showError(res.message || "Gagal memperbarui data pengguna");
        }
      } else {
        const res = await apiService.saveUser({
          NAMA: nama.trim(),
          USERNAME: username.trim(),
          PASSWORD: password.trim(),
          ROLE: role,
          ID_DESA: idDesa,
          NAMA_DESA: namaDesa,
          STATUS: status
        });
        if (res.success) {
          showSuccess("Pengguna baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showError(res.message || "Gagal menambahkan pengguna");
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
      const res = await apiService.deleteUser(deletingId);
      if (res.success) {
        showSuccess("Pengguna berhasil dinonaktifkan / dihapus");
        setDeletingId(null);
        fetchUsers();
      } else {
        showError(res.message || "Gagal menghapus pengguna");
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case "Admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Koordinator":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Kader":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const columns: Column<User>[] = [
    {
      key: "NAMA",
      header: "Nama & Username",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            {item.NAMA.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs sm:text-sm">{item.NAMA}</p>
            <p className="text-[11px] text-slate-400 font-mono">@{item.USERNAME}</p>
          </div>
        </div>
      )
    },
    {
      key: "ROLE",
      header: "Peran / Role",
      sortable: true,
      render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadge(item.ROLE)}`}>
          {item.ROLE}
        </span>
      )
    },
    {
      key: "NAMA_DESA",
      header: "Penugasan Desa",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Desa {item.NAMA_DESA}</span>
        </div>
      )
    },
    {
      key: "STATUS",
      header: "Status",
      sortable: true,
      className: "text-center w-28",
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
            title="Edit Pengguna"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && item.ID_USER !== user?.ID_USER && (
            <button
              type="button"
              onClick={() => setDeletingId(item.ID_USER)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Hapus / Nonaktifkan Pengguna"
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
            {isAdmin ? "Manajemen Akun & Kader" : "Data Kader Senam"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengurus, koordinator, dan kader senam KORMI di Kecamatan Darmaraja
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-sm shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" /> Tambah Kader / User
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={list}
        columns={columns}
        keyExtractor={(item) => item.ID_USER}
        isLoading={isLoading}
        searchPlaceholder="Cari nama, username, atau desa..."
        searchKeys={["NAMA", "USERNAME", "NAMA_DESA", "ROLE"]}
        itemsPerPage={10}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Pengguna / Kader" : "Tambah Pengguna / Kader Baru"}
        subtitle="Kelola hak akses dan penugasan desa"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Siti Fatimah, S.Pd"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kader_darmaraja"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                {editingItem ? "Password Baru (Opsional)" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingItem ? "Kosongkan jika tak diubah" : "Minimal 6 karakter"}
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                  required={!editingItem}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-600" /> Role / Peran
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition disabled:bg-slate-100"
              >
                <option value="Kader">Kader Senam</option>
                <option value="Koordinator">Koordinator</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" /> Penugasan Desa
              </label>
              <select
                value={idDesa}
                onChange={(e) => setIdDesa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                {desaList.map((d) => (
                  <option key={d.ID_DESA} value={d.ID_DESA}>
                    Desa {d.NAMA_DESA}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status Akun
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
        title="Hapus / Nonaktifkan Pengguna"
        message="Apakah Anda yakin ingin menonaktifkan akun pengguna ini?"
        confirmLabel="Nonaktifkan"
        isLoading={isDeleting}
      />
    </div>
  );
};
