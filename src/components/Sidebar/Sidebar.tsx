import React from "react";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Activity,
  Map,
  Users,
  History,
  UserCheck,
  LogOut,
  X,
  Sparkles,
  BookOpen,
  Settings,
  Globe
} from "lucide-react";
import { SessionUser, UserRole } from "../../types";
import { APP_NAME, APP_TAGLINE } from "../../constants";
import { KORMI_LOGO_URL } from "../../config";

export type NavPage =
  | "dashboard"
  | "laporan"
  | "input_laporan"
  | "jenis_senam"
  | "desa"
  | "users"
  | "audit_log"
  | "profile"
  | "panduan"
  | "public_portal";

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  user: SessionUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenIntegration: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  user,
  isOpen,
  onClose,
  onLogout,
  onOpenIntegration
}) => {
  const role: UserRole = user?.ROLE || "Kader";

  const getMenuItems = () => {
    if (role === "Admin") {
      return [
        { id: "dashboard" as NavPage, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "laporan" as NavPage, label: "Laporan Senam", icon: <FileText className="w-4 h-4" /> },
        { id: "jenis_senam" as NavPage, label: "Jenis Senam", icon: <Activity className="w-4 h-4" /> },
        { id: "desa" as NavPage, label: "Data Desa", icon: <Map className="w-4 h-4" /> },
        { id: "users" as NavPage, label: "Users / Kader", icon: <Users className="w-4 h-4" /> },
        { id: "audit_log" as NavPage, label: "Audit Log", icon: <History className="w-4 h-4" /> },
        { id: "panduan" as NavPage, label: "Panduan & Integrasi", icon: <BookOpen className="w-4 h-4" /> },
        { id: "public_portal" as NavPage, label: "Portal Publik", icon: <Globe className="w-4 h-4" /> },
        { id: "profile" as NavPage, label: "Profil Saya", icon: <UserCheck className="w-4 h-4" /> }
      ];
    }

    if (role === "Koordinator") {
      return [
        { id: "dashboard" as NavPage, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "laporan" as NavPage, label: "Laporan Senam", icon: <FileText className="w-4 h-4" /> },
        { id: "jenis_senam" as NavPage, label: "Jenis Senam", icon: <Activity className="w-4 h-4" /> },
        { id: "desa" as NavPage, label: "Data Desa", icon: <Map className="w-4 h-4" /> },
        { id: "users" as NavPage, label: "Data Kader", icon: <Users className="w-4 h-4" /> },
        { id: "public_portal" as NavPage, label: "Portal Publik", icon: <Globe className="w-4 h-4" /> },
        { id: "profile" as NavPage, label: "Profil Saya", icon: <UserCheck className="w-4 h-4" /> }
      ];
    }

    // Kader
    return [
      { id: "dashboard" as NavPage, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "input_laporan" as NavPage, label: "Input Laporan", icon: <PlusCircle className="w-4 h-4" /> },
      { id: "laporan" as NavPage, label: "Laporan Saya", icon: <FileText className="w-4 h-4" /> },
      { id: "public_portal" as NavPage, label: "Portal Publik", icon: <Globe className="w-4 h-4" /> },
      { id: "profile" as NavPage, label: "Profil Saya", icon: <UserCheck className="w-4 h-4" /> }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl shadow-slate-900/20" : "-translate-x-full lg:shadow-none"
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 p-1 flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                <img
                  src={KORMI_LOGO_URL}
                  alt="KORMI"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-black tracking-tight text-slate-900 leading-tight uppercase font-display">
                  KORMI DARMARAJA
                </h2>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">
                  VERSI 2.0
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 p-3">
            {menuItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition active:scale-98 ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Tagline & Actions */}
        <div className="p-4 border-t border-slate-200 space-y-2.5 bg-slate-50/50">
          {role === "Admin" && (
            <button
              type="button"
              onClick={() => {
                onOpenIntegration();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-black uppercase tracking-wider text-blue-700 hover:bg-blue-100 transition active:scale-98 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              KONFIGURASI GAS API
            </button>
          )}

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" /> SEMANGAT KORMI
            </p>
            <p className="text-[11px] text-slate-600 font-medium italic mt-1 leading-relaxed">
              "{APP_TAGLINE}"
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition active:scale-98 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            KELUAR (LOGOUT)
          </button>
        </div>
      </aside>
    </>
  );
};
