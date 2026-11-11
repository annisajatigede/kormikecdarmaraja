export type UserRole = 'Admin' | 'Koordinator' | 'Kader';
export type UserStatus = 'Aktif' | 'Nonaktif';
export type StatusRecord = UserStatus;
export type StatusAbsensi = 'Hadir' | 'Izin' | 'Alfa';
export type PhotoSourceType = 'CAMERA' | 'GALLERY';

export interface User {
  ID_USER: string;
  NAMA: string;
  USERNAME: string;
  PASSWORD_HASH?: string;
  ROLE: UserRole;
  ID_DESA: string;
  NAMA_DESA: string;
  STATUS: UserStatus;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface Desa {
  ID_DESA: string;
  NAMA_DESA: string;
  STATUS: UserStatus;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface JenisSenam {
  ID_JENIS: string;
  NAMA_JENIS: string;
  STATUS: UserStatus;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface LaporanSenam {
  ID_LAPORAN: string;
  ID_DESA: string;
  NAMA_DESA: string;
  ID_KADER: string;
  NAMA_KADER: string;
  TANGGAL: string; // YYYY-MM-DD
  JUMLAH_PESERTA: number;
  JENIS_SENAM: string;
  STATUS_ABSENSI: StatusAbsensi;
  FOTO_URL: string;
  FOTO_FILE_ID: string;
  CAPTION_FOTO: string;
  SOURCE_TYPE?: PhotoSourceType;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface AuditLog {
  ID_LOG: string;
  TIMESTAMP: string;
  ID_USER: string;
  NAMA_USER: string;
  ROLE: UserRole;
  ACTION: string;
  TABLE_NAME: string;
  RECORD_ID: string;
  DESCRIPTION: string;
}

export interface DashboardStats {
  totalKegiatan: number;
  totalPeserta: number;
  totalDesa: number;
  totalKader: number;
  kegiatanBulanIni: number;
  pesertaBulanIni: number;
}

export interface SenamTerbanyakItem {
  idDesa?: string;
  namaDesa: string;
  totalPeserta: number;
  totalKegiatan: number;
  jenisSenam?: string;
}

export interface SenamDesaTeraktifItem {
  idDesa: string;
  namaDesa: string;
  totalKegiatan: number;
  totalPeserta: number;
}

export interface SessionUser {
  ID_USER: string;
  NAMA: string;
  USERNAME: string;
  ROLE: UserRole;
  ID_DESA: string;
  NAMA_DESA: string;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface DashboardFilterState {
  startDate: string;
  endDate: string;
  jenisSenam: string;
  idDesa: string;
}
