import React, { useState, useEffect } from "react";
import { ToastProvider } from "./components/Toast/ToastContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { NavPage } from "./components/Sidebar/Sidebar";
import { LoginPage } from "./pages/Login/LoginPage";
import { PublicDashboardPage } from "./pages/Public/PublicDashboardPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { LaporanPage } from "./pages/Laporan/LaporanPage";
import { JenisSenamPage } from "./pages/JenisSenam/JenisSenamPage";
import { DesaPage } from "./pages/Desa/DesaPage";
import { UsersPage } from "./pages/Users/UsersPage";
import { AuditLogPage } from "./pages/AuditLog/AuditLogPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { PanduanGasPage } from "./pages/Panduan/PanduanGasPage";
import { loadSession, clearSession } from "./services/api";
import { SessionUser } from "./types";
import { LoadingSpinner } from "./components/Loading/LoadingSpinner";
import { PWANotificationBanner } from "./components/PWA/PWANotificationBanner";

function MainApp() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [unauthView, setUnauthView] = useState<"public" | "login">("public");
  const [currentPage, setCurrentPage] = useState<NavPage>("dashboard");
  const [isInitializing, setIsInitializing] = useState(true);

  // Load session from localStorage on startup
  useEffect(() => {
    try {
      const savedUser = loadSession();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (e) {
      console.warn("Gagal memuat sesi:", e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (user: SessionUser) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setUnauthView("public");
    setCurrentPage("dashboard");
  };

  const handleUserUpdated = (updated: SessionUser) => {
    setCurrentUser(updated);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner message="Memuat Laporan Senam KORMI Darmaraja..." />
      </div>
    );
  }

  // If user is not logged in, allow toggling between Public Portal and Login Page
  if (!currentUser) {
    if (unauthView === "login") {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onGoToPublicPortal={() => setUnauthView("public")}
        />
      );
    }
    return <PublicDashboardPage onGoToLogin={() => setUnauthView("login")} />;
  }

  // Render current page content based on user role and navigation
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardPage
            user={currentUser}
            onNavigateToInput={() => setCurrentPage("input_laporan")}
          />
        );

      case "public_portal":
        return <PublicDashboardPage onGoToLogin={() => setCurrentPage("dashboard")} />;

      case "laporan":
        return <LaporanPage user={currentUser} autoOpenInput={false} />;

      case "input_laporan":
        return <LaporanPage user={currentUser} autoOpenInput={true} />;

      case "jenis_senam":
        if (currentUser.ROLE === "Kader") {
          return <DashboardPage user={currentUser} />;
        }
        return <JenisSenamPage user={currentUser} />;

      case "desa":
        if (currentUser.ROLE === "Kader") {
          return <DashboardPage user={currentUser} />;
        }
        return <DesaPage user={currentUser} />;

      case "users":
        if (currentUser.ROLE === "Kader") {
          return <DashboardPage user={currentUser} />;
        }
        return <UsersPage user={currentUser} />;

      case "audit_log":
        if (currentUser.ROLE !== "Admin") {
          return <DashboardPage user={currentUser} />;
        }
        return <AuditLogPage />;

      case "panduan":
        if (currentUser.ROLE !== "Admin") {
          return (
            <DashboardPage
              user={currentUser}
              onNavigateToInput={() => setCurrentPage("input_laporan")}
            />
          );
        }
        return <PanduanGasPage user={currentUser} />;

      case "profile":
        return (
          <ProfilePage
            user={currentUser}
            onUserUpdated={handleUserUpdated}
            onLogout={handleLogout}
          />
        );

      default:
        return <DashboardPage user={currentUser} />;
    }
  };

  return (
    <AppLayout
      user={currentUser}
      currentPage={currentPage}
      onNavigate={(page) => setCurrentPage(page)}
      onLogout={handleLogout}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <PWANotificationBanner />
      <MainApp />
    </ToastProvider>
  );
}
