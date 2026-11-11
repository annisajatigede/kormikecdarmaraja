import React, { useState } from "react";
import { Modal } from "../../components/Modal/Modal";
import { LaporanSenam } from "../../types";
import { formatIndonesianDate, normalizeDate, formatDateTimeJakarta } from "../../utils/dashboardHelper";
import { MapPin, User, Calendar, Users, Activity, CheckCircle2, AlertCircle, Clock, ZoomIn, X } from "lucide-react";

interface DetailLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  laporan: LaporanSenam | null;
}

export const DetailLaporanModal: React.FC<DetailLaporanModalProps> = ({ isOpen, onClose, laporan }) => {
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  if (!laporan) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hadir":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Izin":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Alfa":
      default:
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detail Laporan Kegiatan Senam"
        subtitle={`ID: ${laporan.ID_LAPORAN}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Photo banner */}
          {laporan.FOTO_URL ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 group">
              <img
                src={laporan.FOTO_URL}
                alt="Dokumentasi Senam"
                className="w-full h-64 object-cover object-center group-hover:scale-101 transition duration-300 cursor-pointer"
                onClick={() => setIsPhotoZoomed(true)}
              />
              <div
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                onClick={() => setIsPhotoZoomed(true)}
              >
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-xs">
                  <ZoomIn className="w-3.5 h-3.5" /> Klik untuk perbesar
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-xs">
                  {laporan.FOTO_FILE_ID || "Foto Dokumentasi"}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
              Tidak ada lampiran foto untuk laporan ini
            </div>
          )}

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Lokasi Desa
              </span>
              <p className="text-sm font-bold text-slate-800">
                Desa {laporan.NAMA_DESA} <span className="text-slate-400 font-normal">({laporan.ID_DESA})</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-sky-600" /> Kader Pelapor
              </span>
              <p className="text-sm font-bold text-slate-800">
                {laporan.NAMA_KADER} <span className="text-slate-400 font-normal">({laporan.ID_KADER})</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" /> Tanggal Kegiatan (WIB)
              </span>
              <p className="text-sm font-bold text-slate-800">
                {formatIndonesianDate(laporan.TANGGAL)}{" "}
                <span className="text-xs text-slate-400 font-mono">({normalizeDate(laporan.TANGGAL)})</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600" /> Jumlah Peserta
              </span>
              <p className="text-sm font-bold text-slate-800">
                {Number(laporan.JUMLAH_PESERTA).toLocaleString("id-ID")} Orang
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-600" /> Kategori Senam
              </span>
              <p className="text-sm font-bold text-slate-800">{laporan.JENIS_SENAM}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-600" /> Status Absensi
              </span>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(laporan.STATUS_ABSENSI)}`}>
                  {laporan.STATUS_ABSENSI}
                </span>
              </div>
            </div>
          </div>

          {/* Caption */}
          {laporan.CAPTION_FOTO && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Catatan / Caption Kegiatan:
              </p>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{laporan.CAPTION_FOTO}"
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Dibuat: {formatDateTimeJakarta(laporan.CREATED_AT)}
            </span>
            <span>Terakhir Diperbarui: {formatDateTimeJakarta(laporan.UPDATED_AT)}</span>
          </div>
        </div>
      </Modal>

      {/* Full-screen zoomed photo modal */}
      {isPhotoZoomed && laporan.FOTO_URL && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsPhotoZoomed(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            aria-label="Tutup foto"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={laporan.FOTO_URL}
            alt="Dokumentasi Senam Full"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
