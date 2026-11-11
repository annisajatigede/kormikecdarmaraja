import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 1. Periksa apakah sudah terinstall atau berjalan dalam mode standalone
    const checkStandalone = () => {
      const matchMediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const navigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isFromApp = document.referrer.includes("android-app://");
      const installedState = matchMediaStandalone || navigatorStandalone || isFromApp;

      setIsStandalone(installedState);
      setIsInstalled(installedState);
    };

    checkStandalone();

    // Listener display-mode perubahan
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    // 2. Deteksi perangkat iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    // 3. Tangkap event beforeinstallprompt (Chromium, Chrome Android, Edge, Samsung Internet, dll)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Tangkap event appinstalled ketika aplikasi sukses diinstall
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("pwa_installed_confirmed", "true");
      } catch {
        // ignore storage error
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        try {
          localStorage.setItem("pwa_installed_confirmed", "true");
        } catch {
          // ignore storage error
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Gagal menjalankan prompt instalasi PWA:", err);
      return false;
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled: isInstalled || isStandalone,
    isIOS,
    install,
    deferredPrompt,
  };
}
