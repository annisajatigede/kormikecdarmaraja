// URL default Google Apps Script Web App yang langsung aktif di semua browser/perangkat
export const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycbxsgq7XQ3cKcsRW2bcir59MSx8IzMNMRzCkZ3KpVHHRMKxZ-v8pesrtMUZoHE4OFgY/exec";

export const KORMI_LOGO_URL = "https://iconlogovector.com/uploads/images/2026/02/lg-698670722ef4a-KORMI.webp";

const STORAGE_KEY_API_URL = "kormi_apps_script_api_url";

export const getApiUrl = (): string => {
  // 1. Cek dari localStorage (jika admin pernah override manual)
  const customUrl = localStorage.getItem(STORAGE_KEY_API_URL);
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  // 2. Cek dari environment variable Vite jika ada
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }
  // 3. Gunakan URL default script bawaan agar beda perangkat/HP langsung tersambung tanpa perlu input ulang
  return DEFAULT_GAS_API_URL;
};

export const setApiUrl = (url: string): void => {
  if (url && url.trim() && url.trim() !== DEFAULT_GAS_API_URL) {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  }
};

export const isLiveApiConfigured = (): boolean => {
  const url = getApiUrl();
  return Boolean(url && url.startsWith("https://script.google.com"));
};

export const API_CONFIG = {
  timeoutMs: 25000,
  maxImageDimension: 1280,
  imageQuality: 0.82
};
