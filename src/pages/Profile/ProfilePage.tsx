import React, { useState } from "react";
import { User, Shield, MapPin, KeyRound, Save, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { SessionUser } from "../../types";
import { apiService, saveSession } from "../../services/api";
import { useToast } from "../../components/Toast/ToastContext";

interface ProfilePageProps {
  user: SessionUser | null;
  onUserUpdated: (updatedUser: SessionUser) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdated, onLogout }) => {
  const { showSuccess, showError } = useToast();

  const [nama, setNama] = useState(user?.NAMA || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      showError("Nama lengkap wajib diisi");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showError("Konfirmasi password baru tidak cocok");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showError("Password baru minimal 6 karakter");
      return;
    }

    if (!user) return;

    setIsUpdating(true);
    try {
      const res = await apiService.updateUser({
        ID_USER: user.ID_USER,
        NAMA: nama.trim(),
        USERNAME: user.USERNAME,
        PASSWORD: newPassword.trim() || undefined,
        ROLE: user.ROLE,
        ID_DESA: user.ID_DESA,
        NAMA_DESA: user.NAMA_DESA,
        STATUS: "Aktif"
      });

      if (res.success) {
        const updated: SessionUser = {
          ...user,
          NAMA: nama.trim()
        };
        saveSession(updated);
        onUserUpdated(updated);
        showSuccess("Profil akun berhasil diperbarui");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError(res.message || "Gagal memperbarui profil");
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-slate-100 pb-6 mb-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-600/20">
            {user?.NAMA ? user.NAMA.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">{user?.NAMA}</h2>
            <p className="text-xs text-slate-400 font-mono">@{user?.USERNAME} &bull; ID: {user?.ID_USER}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3" /> {user?.ROLE}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <MapPin className="w-3 h-3 text-emerald-600" /> Desa {user?.NAMA_DESA || "Darmaraja"}
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Pengaturan Informasi Akun</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={user?.USERNAME || ""}
                readOnly
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Ubah Password (Opsional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                    title={showNewPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                    title={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition active:scale-95 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
