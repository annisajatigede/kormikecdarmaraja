import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export const PWANotificationBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Jika sudah terinstall, hilangkan notifikasi sepenuhnya!
  if (isInstalled) {
    return null;
  }

  // Jika sementara di-minimize oleh pengguna, tampilkan tombol floating kecil di sudut bawah
  if (isDismissed) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 animate-fade-in">
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all border border-emerald-400/30"
          title="Pasang Aplikasi Senam KORMI"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>Pasang Aplikasi</span>
        </button>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        // Otomatis hilang karena isInstalled akan berubah menjadi true
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Browser belum memunculkan prompt otomatis (misal Safari Mac atau Firefox)
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Banner Notifikasi Belum Install */}
      <aside aria-label="Notifikasi Pemasangan Aplikasi" className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-50 animate-in slide-in-from-top-4 duration-300">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/40 p-3.5 sm:p-4 shadow-2xl shadow-black/80 text-white">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="flex items-start gap-3">
            {/* Logo/Icon App */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-slate-900 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aplikasi Belum Terpasang
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  PWA Senam KORMI
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Instal Aplikasi di Perangkat Anda
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 sm:line-clamp-none leading-relaxed">
                Pasang di HP atau Laptop Anda untuk akses instan satu sentuhan, bekerja lebih cepat, dan tidak perlu mengetik alamat web lagi.
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>{isInstalling ? "Memasang..." : isIOS ? "Pasang di iPhone / iPad" : "Pasang Sekarang"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                >
                  Nanti Saja
                </button>
              </div>
            </div>

            {/* Close / Minimize Button */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Panduan Instalasi Khusus iOS Safari atau Browser Manual */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cara Pasang Aplikasi</h3>
                <p className="text-xs text-slate-400">Ikuti 2 langkah mudah berikut:</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-xs text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Tekan tombol Bagikan (Share)</p>
                  <p className="text-slate-400 mt-0.5">
                    Pada Safari, ketuk ikon <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> di bilah bawah layar ponsel Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Pilih "Tambah ke Layar Utama"</p>
                  <p className="text-slate-400 mt-0.5">
                    Gulir ke bawah dan ketuk opsi <span className="font-bold text-emerald-300">"Add to Home Screen"</span> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-300" />).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 mb-5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Setelah ditambahkan, aplikasi akan muncul di layar utama HP Anda layaknya aplikasi Play Store / App Store!</span>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition active:scale-95"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
