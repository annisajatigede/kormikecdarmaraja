import React, { useState } from "react";
import { BookOpen, Database, FolderKanban, Globe, CheckCircle2, Copy, Check, Server, Terminal, ShieldCheck, Lock } from "lucide-react";
import { getApiUrl, setApiUrl, isLiveApiConfigured } from "../../config";
import { apiService } from "../../services/api";
import { useToast } from "../../components/Toast/ToastContext";
import { SessionUser } from "../../types";

interface PanduanGasPageProps {
  user?: SessionUser | null;
}

export const PanduanGasPage: React.FC<PanduanGasPageProps> = ({ user }) => {
  const { showSuccess, showError } = useToast();
  const [urlInput, setUrlInput] = useState(getApiUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = user?.ROLE === "Admin";

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess("Teks berhasil disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAndTest = async () => {
    if (!isAdmin) {
      showError("Hanya Administrator yang berwenang mengubah URL Apps Script");
      return;
    }
    if (!urlInput.trim()) {
      showError("Harap masukkan URL Web App Apps Script");
      return;
    }
    setIsTesting(true);
    try {
      const res = await apiService.testConnection(urlInput.trim());
      if (res.success) {
        setApiUrl(urlInput.trim());
        showSuccess(res.message, "Koneksi Berhasil!");
      } else {
        showError(res.message, "Koneksi Gagal");
      }
    } catch (err: any) {
      showError(err.message || "Gagal menghubungkan ke Apps Script");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 shadow-md shadow-[#ccff00]/5">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-display">
              Panduan Integrasi Google Sheets & REST API
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Dokumentasi langkah demi langkah deployment backend Google Apps Script & frontend
            </p>
          </div>
        </div>

        {/* Admin Restriction Banner */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-amber-300">Hak Akses Terkunci (Hanya Administrator)</p>
              <p className="mt-0.5 text-zinc-300">
                Pengaturan endpoint database hanya dapat diubah oleh akun Administrator untuk mencegah terputusnya sinkronisasi data kader.
              </p>
            </div>
          </div>
        )}

        {/* Live URL test box */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Google Apps Script Web App URL
            </label>
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                isLiveApiConfigured()
                  ? "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/30 shadow-[0_0_8px_#ccff00]/10"
                  : "bg-zinc-800 text-zinc-300 border-white/10"
              }`}
            >
              {isLiveApiConfigured() ? "Mode Live GAS Terhubung" : "Mode Engine Database Lokal"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={urlInput}
              disabled={!isAdmin}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-white/10 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#ccff00]/30 focus:border-[#ccff00] disabled:opacity-50 transition"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={isTesting}
                className="px-5 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#ccff00]/20 transition disabled:opacity-50"
              >
                {isTesting ? "Menguji..." : "Simpan & Uji"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step by Step Manual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 font-black text-white text-sm uppercase tracking-tight">
            <span className="w-7 h-7 rounded-xl bg-[#ccff00] text-black flex items-center justify-center text-xs font-black shadow-md shadow-[#ccff00]/10">
              1
            </span>
            <span>Buat Google Spreadsheet</span>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
            <li>Buka <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-[#ccff00] font-bold underline">Google Sheets</a> baru.</li>
            <li>Beri judul: <strong className="text-white">DATABASE KORMI DARMARAJA</strong>.</li>
            <li>Buka menu <strong className="text-white">Extensions &gt; Apps Script</strong> pada toolbar atas.</li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 font-black text-white text-sm uppercase tracking-tight">
            <span className="w-7 h-7 rounded-xl bg-sky-400 text-black flex items-center justify-center text-xs font-black shadow-md shadow-sky-400/10">
              2
            </span>
            <span>Salin Script & Inisialisasi</span>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
            <li>Salin seluruh file dari folder <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#ccff00]">/google-apps-script</code> ke editor Apps Script.</li>
            <li>Pilih fungsi <strong className="text-white">setupDatabase</strong> di dropdown toolbar atas.</li>
            <li>Klik tombol <strong className="text-white">Run / Jalankan</strong> &amp; berikan izin otorisasi.</li>
            <li>Seluruh sheet dan tabel otomatis terkonfigurasi!</li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 font-black text-white text-sm uppercase tracking-tight">
            <span className="w-7 h-7 rounded-xl bg-amber-400 text-black flex items-center justify-center text-xs font-black shadow-md shadow-amber-400/10">
              3
            </span>
            <span>Deploy Web App Apps Script</span>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
            <li>Klik tombol biru <strong className="text-white">Deploy &gt; New deployment</strong>.</li>
            <li>Pilih tipe: <strong className="text-white">Web app</strong>.</li>
            <li>Execute as: <strong className="text-white">Me</strong>, Who has access: <strong className="text-white">Anyone</strong>.</li>
            <li>Klik <strong className="text-white">Deploy</strong> dan salin URL Web App yang berakhiran <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#ccff00]">/exec</code>.</li>
          </ul>
        </div>

        {/* Step 4 */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 font-black text-white text-sm uppercase tracking-tight">
            <span className="w-7 h-7 rounded-xl bg-purple-400 text-black flex items-center justify-center text-xs font-black shadow-md shadow-purple-400/10">
              4
            </span>
            <span>Deploy ke Cloudflare Pages</span>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
            <li>Build command: <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-zinc-300">npm run build</code></li>
            <li>Build output directory: <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-zinc-300">dist</code></li>
            <li>Environment variable: tambahkan <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#ccff00]">VITE_API_URL</code> dengan URL Web App.</li>
          </ul>
        </div>
      </div>

      {/* Akun Default Box */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-lg space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ccff00]" /> Kredensial Akun Default Awal
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1.5">
            <p className="font-black text-purple-400 uppercase tracking-wider text-[11px]">Administrator</p>
            <p className="text-zinc-400">Username: <code className="font-black font-mono text-white">admin</code></p>
            <p className="text-zinc-400">Password: <code className="font-black font-mono text-white">admin123</code></p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1.5">
            <p className="font-black text-sky-400 uppercase tracking-wider text-[11px]">Koordinator</p>
            <p className="text-zinc-400">Username: <code className="font-black font-mono text-white">koordinator</code></p>
            <p className="text-zinc-400">Password: <code className="font-black font-mono text-white">koordinator123</code></p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1.5">
            <p className="font-black text-[#ccff00] uppercase tracking-wider text-[11px]">Kader Desa</p>
            <p className="text-zinc-400">Username: <code className="font-black font-mono text-white">kader_darmaraja</code></p>
            <p className="text-zinc-400">Password: <code className="font-black font-mono text-white">kader123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};
