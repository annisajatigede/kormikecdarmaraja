import React from "react";
import { Menu, LogOut, Settings, MapPin } from "lucide-react";
import { SessionUser } from "../../types";
import { isLiveApiConfigured, KORMI_LOGO_URL } from "../../config";

interface HeaderProps {
  user: SessionUser | null;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenIntegration: () => void;
  currentPageTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onToggleSidebar,
  onLogout,
  onOpenProfile,
  onOpenIntegration,
  currentPageTitle
}) => {
  const isLive = isLiveApiConfigured();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-50 text-red-700 border-red-200";
      case "Koordinator":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Kader":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3.5 sm:px-6 backdrop-blur-md">
      {/* MOBILE DISPLAY (< lg): ONLY LOGO + TULISAN "KORMI KORCAM DARMARAJA" + HAMBURGER */}
      <div className="flex items-center justify-between w-full lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
            <img
              src={KORMI_LOGO_URL}
              alt="Logo KORMI"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-sm font-black text-slate-900 tracking-tight uppercase font-display">
            KORMI KORCAM DARMARAJA
          </span>
        </div>

        {/* Hamburger Menu Button */}
        {user && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center justify-center p-2 rounded-xl text-slate-700 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition active:scale-95"
            aria-label="Buka Menu Navigasi"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        )}
      </div>

      {/* DESKTOP DISPLAY (>= lg): FULL HEADER WITH PAGE TITLE, STATUS, & PROFILE */}
      <div className="hidden lg:flex items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase font-display">
            <span>{currentPageTitle}</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-600" /> KORMI KECAMATAN DARMARAJA, SUMEDANG
          </p>
        </div>
      </div>

      {/* Desktop Right Side: Status, User Card, & Logout */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Live / Integrated DB indicator */}
        {user?.ROLE === "Admin" ? (
          <button
            type="button"
            onClick={onOpenIntegration}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition hover:opacity-90 active:scale-95 bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:border-red-400"
            title="Kelola Konfigurasi Backend Google Apps Script & Database (Khusus Admin)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-blue-500 shadow-[0_0_6px_#3b82f6]"
              }`}
            />
            <span className="tracking-wide text-[10px] font-black uppercase text-slate-800">
              {isLive ? "GAS LIVE" : "DB TERINTEGRASI"}
            </span>
            <Settings className="w-3 h-3 text-blue-600 ml-0.5" />
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-50 border-slate-200 text-slate-600 select-none shadow-sm"
            title="Status Database: Sistem Terhubung & Terintegrasi"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-blue-500 shadow-[0_0_6px_#3b82f6]"
              }`}
            />
            <span className="tracking-wide text-[10px] font-black uppercase text-slate-700">
              {isLive ? "SISTEM ONLINE" : "DB TERINTEGRASI"}
            </span>
          </div>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-left"
              title="Lihat Profil"
            >
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                {user.NAMA ? user.NAMA.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[130px] uppercase">
                  {user.NAMA}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border ${getRoleBadge(
                      user.ROLE
                    )}`}
                  >
                    {user.ROLE}
                  </span>
                  {user.NAMA_DESA && (
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[80px]">
                      &bull; {user.NAMA_DESA}
                    </span>
                  )}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
