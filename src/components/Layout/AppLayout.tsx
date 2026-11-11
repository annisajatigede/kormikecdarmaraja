import React, { useState } from "react";
import { Header } from "../Header/Header";
import { Sidebar, NavPage } from "../Sidebar/Sidebar";
import { SessionUser } from "../../types";
import { GasIntegrationModal } from "../GasIntegrationModal";
import { LayoutDashboard, Plus, FileText, UserCheck, Menu } from "lucide-react";

interface AppLayoutProps {
  user: SessionUser | null;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  currentPage,
  onNavigate,
  onLogout,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  const getPageTitle = (page: NavPage): string => {
    switch (page) {
      case "dashboard":
        return "Dashboard Monitoring Senam";
      case "laporan":
        return user?.ROLE === "Kader" ? "Laporan Senam Saya" : "Data Laporan Senam";
      case "input_laporan":
        return "Form Input Laporan Senam";
      case "jenis_senam":
        return "Master Data Jenis Senam";
      case "desa":
        return "Master Data Desa";
      case "users":
        return user?.ROLE === "Admin" ? "Kelola Users & Kader" : "Data Kader Senam";
      case "audit_log":
        return "Audit Log Aktivitas Sistem";
      case "profile":
        return "Profil Akun Pengguna";
      case "panduan":
        return "Panduan Integrasi & REST API";
      default:
        return "Laporan Senam KORMI";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative selection:bg-red-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Sidebar Navigation Drawer */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onOpenIntegration={() => {
          if (user?.ROLE === "Admin") {
            setIsIntegrationModalOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 pb-20 lg:pb-0 relative z-10">
        <Header
          user={user}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onLogout={onLogout}
          onOpenProfile={() => onNavigate("profile")}
          onOpenIntegration={() => {
            if (user?.ROLE === "Admin") {
              setIsIntegrationModalOpen(true);
            }
          }}
          currentPageTitle={getPageTitle(currentPage)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* MOBILE BOTTOM STICKY NAVIGATION BAR (WHEN LOGGED IN) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-3 backdrop-blur-xl lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {/* 1. Dashboard Tab */}
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition active:scale-95 ${
            currentPage === "dashboard"
              ? "text-red-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-bold"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Dashboard</span>
        </button>

        {/* 2. Laporan Tab */}
        <button
          type="button"
          onClick={() => onNavigate("laporan")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition active:scale-95 ${
            currentPage === "laporan"
              ? "text-red-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-bold"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Laporan</span>
        </button>

        {/* 3. CENTER FLOATING ACTION BUTTON (+) FOR INPUT LAPORAN */}
        <div className="relative -top-3 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onNavigate("input_laporan")}
            className="flex items-center justify-center w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-lg shadow-red-600/35 border-4 border-slate-50 transition"
            title="Input Laporan Baru"
            aria-label="Input Laporan"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[9px] font-black uppercase tracking-wider text-red-600 mt-0.5">
            Input
          </span>
        </div>

        {/* 4. Hamburger / Menu Drawer Tab for other menus */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 font-bold transition active:scale-95"
          title="Buka Menu Lainnya"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Menu</span>
        </button>

        {/* 5. Profil Tab */}
        <button
          type="button"
          onClick={() => onNavigate("profile")}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition active:scale-95 ${
            currentPage === "profile"
              ? "text-red-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-bold"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Profil</span>
        </button>
      </div>

      {/* Interactive Google Apps Script Integration Modal (Restricted to Admin) */}
      <GasIntegrationModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        user={user}
      />
    </div>
  );
};
