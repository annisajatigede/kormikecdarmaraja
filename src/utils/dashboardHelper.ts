import { INITIAL_DESA_LIST } from "../constants";
import { DashboardStats, Desa, LaporanSenam, SenamDesaTeraktifItem, SenamTerbanyakItem } from "../types";

export interface FilterParams {
  startDate: string;
  endDate: string;
  jenisSenam: string;
  idDesa: string;
}

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD di zona waktu Asia/Jakarta (WIB = UTC+7)
 */
export function getTodayJakarta(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(new Date());
  } catch (e) {
    const d = new Date();
    // Fallback manual UTC+7
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    const y = wib.getFullYear();
    const m = String(wib.getMonth() + 1).padStart(2, "0");
    const day = String(wib.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}

/**
 * Mendapatkan YYYY-MM saat ini di zona waktu Asia/Jakarta (WIB)
 */
export function getCurrentYearMonthJakarta(): string {
  const today = getTodayJakarta();
  return today.substring(0, 7);
}

/**
 * Normalisasi format tanggal apapun (YYYY-MM-DD, DD/MM/YYYY, ISO UTC T...Z, Date obj)
 * menjadi YYYY-MM-DD di zona waktu Asia/Jakarta (WIB = UTC+7)
 */
export function normalizeDate(val: string | Date | number | undefined | null): string {
  if (!val && val !== 0) return "";
  
  // 1. Jika objek Date
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      return formatter.format(val);
    } catch {
      const utc = val.getTime() + val.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 7 * 3600000);
      const y = wib.getFullYear();
      const m = String(wib.getMonth() + 1).padStart(2, "0");
      const d = String(wib.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str) return "";

  // 2. Jika string ISO yang memuat waktu / timezone (e.g. "2026-08-31T17:00:00.000Z" atau ada 'T' / 'Z')
  if (str.includes("T") || str.endsWith("Z") || str.includes("+00:00") || str.includes("-")) {
    // Cek apakah murni YYYY-MM-DD tanpa jam
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
        return formatter.format(parsed);
      } catch {
        const utc = parsed.getTime() + parsed.getTimezoneOffset() * 60000;
        const wib = new Date(utc + 7 * 3600000);
        const y = wib.getFullYear();
        const m = String(wib.getMonth() + 1).padStart(2, "0");
        const d = String(wib.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 3. Match format DD-MM-YYYY atau DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }

  // 4. Match format YYYY-MM-DD atau YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
  }

  // 5. Coba parse sebagai tanggal umum
  const generalDate = new Date(str);
  if (!isNaN(generalDate.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      return formatter.format(generalDate);
    } catch {
      return str.substring(0, 10);
    }
  }

  return str.substring(0, 10);
}

/**
 * Format tanggal dalam bahasa Indonesia yang ramah (contoh: 1 September 2026)
 */
export function formatIndonesianDate(val: string | Date | undefined | null): string {
  const norm = normalizeDate(val);
  if (!norm) return "-";
  const parts = norm.split("-");
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = [
      "",
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ];
    return `${d} ${months[m] || parts[1]} ${y}`;
  }
  return norm;
}

/**
 * Format timestamp created_at / updated_at / audit log di zona waktu Asia/Jakarta
 */
export function formatDateTimeJakarta(val: string | Date | undefined | null): string {
  if (!val) return "-";
  const str = String(val).trim();
  if (!str) return "-";

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    try {
      const dFmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const tFmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      return `${dFmt.format(parsed)} ${tFmt.format(parsed)}`;
    } catch {
      return str;
    }
  }
  return str;
}

/**
 * Ekstraksi YYYY-MM untuk komparasi bulan berjalan
 */
export function extractYearMonth(val: string | Date | undefined): string {
  const norm = normalizeDate(val);
  if (norm && norm.length >= 7) {
    return norm.substring(0, 7);
  }
  return "";
}

/**
 * Kalkulasi Terpusat Dashboard & Grafik:
 * 1. Menampilkan seluruh 12 desa di grafik Senam Terbanyak & Senam Teraktif.
 * 2. Menghitung Kegiatan Bln Ini & Peserta Bulan Ini secara akurat & real-time di zona waktu Asia/Jakarta.
 * 3. Menerapkan filter (Tanggal Mulai, Tanggal Akhir, Jenis Senam, Desa) secara reaktif.
 */
export function processDashboardData(
  allReports: LaporanSenam[],
  desaList: Desa[],
  totalKaderCount: number,
  filters: FilterParams
): {
  stats: DashboardStats;
  senamTerbanyak: SenamTerbanyakItem[];
  senamTeraktif: SenamDesaTeraktifItem[];
  filteredReports: LaporanSenam[];
} {
  // Master 12 desa
  const baseVillages =
    desaList && desaList.length > 0
      ? desaList
      : (INITIAL_DESA_LIST as Desa[]);

  // 1. Filter laporan berdasarkan parameter aktif
  const filteredReports = allReports.filter((r) => {
    const normDate = normalizeDate(r.TANGGAL);
    
    // Filter tanggal mulai
    if (filters.startDate && filters.startDate.trim() !== "") {
      const normStart = normalizeDate(filters.startDate.trim());
      if (normDate < normStart) return false;
    }
    // Filter tanggal akhir
    if (filters.endDate && filters.endDate.trim() !== "") {
      const normEnd = normalizeDate(filters.endDate.trim());
      if (normDate > normEnd) return false;
    }
    // Filter jenis senam
    if (filters.jenisSenam && filters.jenisSenam !== "Semua Jenis") {
      if (r.JENIS_SENAM !== filters.jenisSenam) return false;
    }
    // Filter desa (bisa ID_DESA atau NAMA_DESA)
    if (filters.idDesa && filters.idDesa !== "Semua Desa") {
      const desaMatch =
        r.ID_DESA === filters.idDesa ||
        r.NAMA_DESA?.toLowerCase() === filters.idDesa.toLowerCase();
      if (!desaMatch) return false;
    }
    return true;
  });

  // 2. Hitung statistik bulan berjalan (Kegiatan Bln Ini & Peserta Bulan Ini) berdasarkan Asia/Jakarta
  const currentYM = getCurrentYearMonthJakarta();

  const allHadirReports = allReports.filter((r) => (r.STATUS_ABSENSI || "Hadir") === "Hadir");
  const currentMonthReports = allHadirReports.filter((r) => {
    const ym = extractYearMonth(r.TANGGAL);
    return ym === currentYM;
  });

  let kegiatanBulanIni = currentMonthReports.length;
  let pesertaBulanIni = currentMonthReports.reduce(
    (acc, curr) => acc + (Number(curr.JUMLAH_PESERTA) || 0),
    0
  );

  // Jika belum ada data di bulan kalender ini tapi ada data laporan, ambil bulan terbaru dari data
  if (kegiatanBulanIni === 0 && allHadirReports.length > 0) {
    const sorted = [...allHadirReports].sort((a, b) =>
      normalizeDate(b.TANGGAL).localeCompare(normalizeDate(a.TANGGAL))
    );
    const latestYM = extractYearMonth(sorted[0]?.TANGGAL);
    if (latestYM) {
      const latestMonthReports = allHadirReports.filter(
        (r) => extractYearMonth(r.TANGGAL) === latestYM
      );
      kegiatanBulanIni = latestMonthReports.length;
      pesertaBulanIni = latestMonthReports.reduce(
        (acc, curr) => acc + (Number(curr.JUMLAH_PESERTA) || 0),
        0
      );
    }
  }

  // 3. Hitung total kegiatan & peserta berdasarkan filter yang aktif
  const filteredHadirReports = filteredReports.filter(
    (r) => (r.STATUS_ABSENSI || "Hadir") === "Hadir"
  );
  const totalKegiatan = filteredHadirReports.length;
  const totalPeserta = filteredHadirReports.reduce(
    (acc, curr) => acc + (Number(curr.JUMLAH_PESERTA) || 0),
    0
  );

  // 4. Bangun dataset Senam Terbanyak (Seluruh 12 desa ditampilkan)
  const terbanyakMap: Record<
    string,
    { idDesa: string; namaDesa: string; totalPeserta: number; totalKegiatan: number; jenisSenam: string }
  > = {};

  baseVillages.forEach((d) => {
    if (
      !filters.idDesa ||
      filters.idDesa === "Semua Desa" ||
      filters.idDesa === d.ID_DESA ||
      filters.idDesa.toLowerCase() === d.NAMA_DESA.toLowerCase()
    ) {
      terbanyakMap[d.NAMA_DESA] = {
        idDesa: d.ID_DESA,
        namaDesa: d.NAMA_DESA,
        totalPeserta: 0,
        totalKegiatan: 0,
        jenisSenam: filters.jenisSenam !== "Semua Jenis" ? filters.jenisSenam : "Semua Senam"
      };
    }
  });

  filteredHadirReports.forEach((r) => {
    const dName = r.NAMA_DESA || "Darmaraja";
    const foundKey =
      Object.keys(terbanyakMap).find((k) => k.toLowerCase() === dName.toLowerCase()) || dName;

    if (!terbanyakMap[foundKey]) {
      terbanyakMap[foundKey] = {
        idDesa: r.ID_DESA || "",
        namaDesa: dName,
        totalPeserta: 0,
        totalKegiatan: 0,
        jenisSenam: r.JENIS_SENAM || "Senam Sehat"
      };
    }
    terbanyakMap[foundKey].totalPeserta += Number(r.JUMLAH_PESERTA) || 0;
    terbanyakMap[foundKey].totalKegiatan += 1;
  });

  const senamTerbanyak: SenamTerbanyakItem[] = Object.values(terbanyakMap).sort(
    (a, b) =>
      (b.totalPeserta || 0) - (a.totalPeserta || 0) ||
      (b.totalKegiatan || 0) - (a.totalKegiatan || 0)
  );

  // 5. Bangun dataset Senam Desa Teraktif (Seluruh 12 desa ditampilkan)
  const teraktifMap: Record<
    string,
    { idDesa: string; namaDesa: string; totalKegiatan: number; totalPeserta: number }
  > = {};

  baseVillages.forEach((d) => {
    if (
      !filters.idDesa ||
      filters.idDesa === "Semua Desa" ||
      filters.idDesa === d.ID_DESA ||
      filters.idDesa.toLowerCase() === d.NAMA_DESA.toLowerCase()
    ) {
      teraktifMap[d.NAMA_DESA] = {
        idDesa: d.ID_DESA,
        namaDesa: d.NAMA_DESA,
        totalKegiatan: 0,
        totalPeserta: 0
      };
    }
  });

  filteredHadirReports.forEach((r) => {
    const dName = r.NAMA_DESA || "Darmaraja";
    const foundKey =
      Object.keys(teraktifMap).find((k) => k.toLowerCase() === dName.toLowerCase()) || dName;

    if (!teraktifMap[foundKey]) {
      teraktifMap[foundKey] = {
        idDesa: r.ID_DESA || "",
        namaDesa: dName,
        totalKegiatan: 0,
        totalPeserta: 0
      };
    }
    teraktifMap[foundKey].totalKegiatan += 1;
    teraktifMap[foundKey].totalPeserta += Number(r.JUMLAH_PESERTA) || 0;
  });

  const senamTeraktif: SenamDesaTeraktifItem[] = Object.values(teraktifMap).sort(
    (a, b) =>
      (b.totalKegiatan || 0) - (a.totalKegiatan || 0) ||
      (b.totalPeserta || 0) - (a.totalPeserta || 0)
  );

  return {
    stats: {
      totalKegiatan,
      totalPeserta,
      totalDesa: baseVillages.length,
      totalKader: totalKaderCount || 12,
      kegiatanBulanIni,
      pesertaBulanIni
    },
    senamTerbanyak,
    senamTeraktif,
    filteredReports
  };
}
