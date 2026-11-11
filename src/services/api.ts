import { getApiUrl } from "../config";
import { normalizeDate, formatDateTimeJakarta } from "../utils/dashboardHelper";
import {
  ApiResponse,
  AuditLog,
  DashboardStats,
  Desa,
  JenisSenam,
  LaporanSenam,
  SenamDesaTeraktifItem,
  SenamTerbanyakItem,
  SessionUser,
  User
} from "../types";

const STORAGE_KEYS = {
  SESSION: "kormi_session_user"
};

// Session persistence in browser for active user
export function getStoredSession(): SessionUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const loadSession = getStoredSession;

export function saveSession(user: SessionUser): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Sanitasi data dari backend agar seluruh tanggal dan timestamp
 * disesuaikan dengan zona waktu Asia/Jakarta (WIB = UTC+7)
 */
function sanitizeResponseData<T>(data: T): T {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item && typeof item === "object") {
        const cloned = { ...item };
        if ("TANGGAL" in cloned) {
          cloned.TANGGAL = normalizeDate(cloned.TANGGAL);
        }
        if ("CREATED_AT" in cloned) {
          cloned.CREATED_AT = formatDateTimeJakarta(cloned.CREATED_AT);
        }
        if ("UPDATED_AT" in cloned) {
          cloned.UPDATED_AT = formatDateTimeJakarta(cloned.UPDATED_AT);
        }
        if ("TIMESTAMP" in cloned) {
          cloned.TIMESTAMP = formatDateTimeJakarta(cloned.TIMESTAMP);
        }
        return cloned;
      }
      return item;
    }) as unknown as T;
  }

  if (typeof data === "object") {
    const obj = { ...(data as any) };
    if ("TANGGAL" in obj) {
      obj.TANGGAL = normalizeDate(obj.TANGGAL);
    }
    if ("CREATED_AT" in obj) {
      obj.CREATED_AT = formatDateTimeJakarta(obj.CREATED_AT);
    }
    if ("UPDATED_AT" in obj) {
      obj.UPDATED_AT = formatDateTimeJakarta(obj.UPDATED_AT);
    }
    if ("TIMESTAMP" in obj) {
      obj.TIMESTAMP = formatDateTimeJakarta(obj.TIMESTAMP);
    }
    if (obj.recentReports && Array.isArray(obj.recentReports)) {
      obj.recentReports = sanitizeResponseData(obj.recentReports);
    }
    return obj as T;
  }

  return data;
}

// Universal fetch wrapper sending requests directly to Google Apps Script Web App (Google Spreadsheet)
async function callApi<T>(action: string, method: "GET" | "POST", payload?: any): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const session = getStoredSession();

  if (!apiUrl || !apiUrl.startsWith("https://script.google.com")) {
    return {
      success: false,
      message: "URL Google Apps Script belum dikonfigurasi. Silakan periksa pengaturan di menu Konfigurasi GAS API."
    };
  }

  try {
    let response: Response;
    if (method === "GET") {
      const queryParams = new URLSearchParams();
      queryParams.set("action", action);
      if (session?.ID_USER) {
        queryParams.set("authUserId", session.ID_USER);
      }
      if (payload && typeof payload === "object") {
        Object.entries(payload).forEach(([key, val]) => {
          if (
            val !== undefined &&
            val !== null &&
            val !== "" &&
            val !== "undefined" &&
            val !== "null"
          ) {
            queryParams.set(key, String(val));
          }
        });
      }
      queryParams.set("_t", Date.now().toString());

      response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: "GET"
      });
    } else {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // GAS handles text/plain without triggering CORS preflight blocker
        },
        body: JSON.stringify({
          action,
          authUserId: session?.ID_USER || payload?.ID_USER || payload?.authUserId || "",
          ...payload
        })
      });
    }

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: Gagal memproses data ke Google Apps Script / Spreadsheet. Pastikan hak akses deployment adalah 'Anyone'.`
      };
    }

    const result: ApiResponse<T> = await response.json();
    if (result.success && result.data !== undefined) {
      result.data = sanitizeResponseData(result.data);
    }
    return result;
  } catch (err: any) {
    console.error("GAS REST API Error:", err);
    return {
      success: false,
      message: `Gagal terhubung ke Google Spreadsheet: ${err.message || "Network Error"}. Pastikan script sudah dideploy sebagai Web App dengan akses 'Anyone' (Siapa Saja).`
    };
  }
}

export const apiService = {
  // Authentication
  login: (username: string, password: string) => callApi<SessionUser>("login", "POST", { username, password }),
  
  // Dashboard
  getDashboard: (params?: { startDate?: string; endDate?: string; jenisSenam?: string; idDesa?: string }) =>
    callApi<{
      stats: DashboardStats;
      senamTerbanyak: SenamTerbanyakItem[];
      senamTeraktif: SenamDesaTeraktifItem[];
      recentReports: LaporanSenam[];
    }>("getDashboard", "GET", params),
  
  // Laporan
  getLaporan: (params?: { startDate?: string; endDate?: string; idDesa?: string; idKader?: string; jenisSenam?: string; statusAbsensi?: string; search?: string }) =>
    callApi<LaporanSenam[]>("getLaporan", "GET", params),
  saveLaporan: (data: Partial<LaporanSenam>) => callApi<LaporanSenam>("saveLaporan", "POST", data),
  updateLaporan: (data: Partial<LaporanSenam>) => callApi<LaporanSenam>("updateLaporan", "POST", data),
  deleteLaporan: (idLaporan: string, fotoUrl?: string, fotoFileId?: string) =>
    callApi<void>("deleteLaporan", "POST", { ID_LAPORAN: idLaporan, FOTO_URL: fotoUrl, FOTO_FILE_ID: fotoFileId }),

  // Desa
  getDesa: () => callApi<Desa[]>("getDesa", "GET"),
  saveDesa: (data: Partial<Desa>) => callApi<Desa>("saveDesa", "POST", data),
  updateDesa: (data: Partial<Desa>) => callApi<Desa>("updateDesa", "POST", data),
  deleteDesa: (idDesa: string) => callApi<void>("deleteDesa", "POST", { ID_DESA: idDesa }),

  // Jenis Senam
  getJenisSenam: () => callApi<JenisSenam[]>("getJenisSenam", "GET"),
  saveJenisSenam: (data: Partial<JenisSenam>) => callApi<JenisSenam>("saveJenisSenam", "POST", data),
  updateJenisSenam: (data: Partial<JenisSenam>) => callApi<JenisSenam>("updateJenisSenam", "POST", data),
  deleteJenisSenam: (idJenis: string) => callApi<void>("deleteJenisSenam", "POST", { ID_JENIS: idJenis }),

  // Users & Profile
  getUsers: () => callApi<User[]>("getUsers", "GET"),
  saveUser: (data: Partial<User> & { PASSWORD?: string }) => callApi<User>("saveUser", "POST", data),
  updateUser: (data: Partial<User> & { PASSWORD?: string }) => callApi<User>("updateUser", "POST", data),
  updateProfile: (data: Partial<User> & { PASSWORD?: string }) => callApi<User>("updateUser", "POST", data),
  changePassword: (newPassword: string, idUser?: string) => callApi<User>("updateUser", "POST", { PASSWORD: newPassword, ID_USER: idUser }),
  deleteUser: (idUser: string) => callApi<void>("deleteUser", "POST", { ID_USER: idUser }),

  // Audit Log
  getAuditLog: () => callApi<AuditLog[]>("getAuditLog", "GET"),

  // Drive Photo Upload
  uploadFoto: (base64Data: string, fileName: string, mimeType = "image/jpeg") =>
    callApi<{ fileId: string; fileUrl: string; fileName: string }>("uploadFoto", "POST", { base64Data, fileName, mimeType }),

  // Test GAS Endpoint
  testConnection: async (testUrl: string): Promise<{ success: boolean; message: string }> => {
    try {
      const trimmedUrl = testUrl.trim();
      if (!trimmedUrl.startsWith("https://script.google.com")) {
        return {
          success: false,
          message: "URL tidak valid. Format URL Apps Script harus diawali 'https://script.google.com/macros/s/.../exec'"
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const urlObj = new URL(trimmedUrl);
      urlObj.searchParams.set("action", "health");
      urlObj.searchParams.set("_t", Date.now().toString());

      const res = await fetch(urlObj.toString(), {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          message: `Server mengembalikan status HTTP ${res.status}. Pastikan deployment diset 'Anyone' / 'Siapa saja'.`
        };
      }

      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          message: "Koneksi ke Google Apps Script Web App berhasil terhubung & siap digunakan!"
        };
      }
      return {
        success: false,
        message: json.message || "Respon server tidak valid"
      };
    } catch (e: any) {
      if (e.name === "AbortError") {
        return {
          success: false,
          message: "Koneksi timeout (lebih dari 12 detik). Pastikan script telah dideploy sebagai Web App (Anyone)."
        };
      }
      return {
        success: false,
        message: `Gagal terhubung: ${e.message || "Network Error / CORS Blocked"}. Pastikan pada menu Deploy: 'Execute as: Me' dan 'Who has access: Anyone'.`
      };
    }
  }
};
