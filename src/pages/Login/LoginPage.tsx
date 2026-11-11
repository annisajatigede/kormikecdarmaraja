import React, { useState } from "react";
import {
  User,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  ShieldCheck
} from "lucide-react";
import { apiService, saveSession } from "../../services/api";
import { SessionUser } from "../../types";
import { APP_NAME, APP_TAGLINE, APP_SUBTITLE, APP_REGION } from "../../constants";
import { KORMI_LOGO_URL } from "../../config";
import { useToast } from "../../components/Toast/ToastContext";

interface LoginPageProps {
  onLoginSuccess: (user: SessionUser) => void;
  onGoToPublicPortal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToPublicPortal }) => {
  const { showError, showSuccess } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Username dan password wajib diisi");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await apiService.login(username.trim(), password.trim());
      if (response.success && response.data) {
        saveSession(response.data);
        showSuccess(`Selamat datang, ${response.data.NAMA}`, "Login Berhasil");
        onLoginSuccess(response.data);
      } else {
        setErrorMsg(response.message || "Gagal melakukan login");
        showError(response.message || "Gagal melakukan login");
      }
    } catch (err: any) {
      const msg = err.message || "Terjadi kendala saat menghubungkan ke server";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-slate-900 px-4 py-8 relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* KORMI brand vibrant atmospheric shapes (Red, Royal Blue, Amber, Emerald) */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-72 h-72 bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar for Navigation to Public Portal */}
      {onGoToPublicPortal && (
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
          <button
            type="button"
            onClick={onGoToPublicPortal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Lihat Portal Publik (Tanpa Login)</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Branding Emblem */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-white shadow-xl border border-slate-200/80 mb-1">
            <img
              src={KORMI_LOGO_URL}
              alt="Logo KORMI"
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-display">
            {APP_NAME}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold">{APP_SUBTITLE}</p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>"{APP_TAGLINE}"</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase font-display">
                Masuk ke Akun Anda
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kredensial yang telah didaftarkan oleh Administrator KORMI.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider">Login Gagal</p>
                <p className="mt-0.5 text-rose-600">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition font-mono tracking-wide"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition rounded-lg"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black uppercase tracking-wider text-sm shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memverifikasi akun...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info with Public Portal link */}
        <div className="text-center mt-6 space-y-2">
          {onGoToPublicPortal && (
            <button
              type="button"
              onClick={onGoToPublicPortal}
              className="text-xs text-slate-600 hover:text-red-600 transition font-bold inline-flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Buka Halaman Portal Publik Tanpa Login &rarr;</span>
            </button>
          )}
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {APP_REGION} &bull; KORMI V.2
          </p>
        </div>
      </div>
    </div>
  );
};
