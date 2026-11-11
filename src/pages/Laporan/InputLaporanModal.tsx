import React, { useState, useEffect } from "react";
import { Modal } from "../../components/Modal/Modal";
import { Desa, JenisSenam, LaporanSenam, SessionUser, StatusAbsensi, User } from "../../types";
import { ImageCaptureModal } from "../../components/ImageUpload/ImageCaptureModal";
import { apiService } from "../../services/api";
import { useToast } from "../../components/Toast/ToastContext";
import { getTodayJakarta, normalizeDate } from "../../utils/dashboardHelper";
import { Save, AlertCircle, Calendar, Users, Activity, CheckCircle2, MapPin, UserCheck, HelpCircle } from "lucide-react";

// Komponen Tooltip yang informatif, ringkas, dan mobile-friendly
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-slate-400 hover:text-emerald-600 p-0.5 rounded-full transition focus:outline-none"
        title="Klik untuk keterangan"
        aria-label="Info keterangan"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-1.5 w-52 sm:w-64 p-2.5 bg-slate-900 text-white text-[11px] font-normal leading-snug rounded-xl shadow-2xl border border-slate-700/80 z-50 pointer-events-none normal-case tracking-normal text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {text}
          <div className="absolute top-full right-2 sm:left-1/2 sm:-translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

interface InputLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: SessionUser | null;
  editData?: LaporanSenam | null;
  desaList: Desa[];
  jenisSenamList: JenisSenam[];
  usersList?: User[];
}

export const InputLaporanModal: React.FC<InputLaporanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  editData,
  desaList,
  jenisSenamList,
  usersList = []
}) => {
  const { showSuccess, showError } = useToast();
  const isKader = user?.ROLE === "Kader";
  const isEdit = Boolean(editData);

  const [idDesa, setIdDesa] = useState(user?.ID_DESA || "DSA-0001");
  const [namaDesa, setNamaDesa] = useState(user?.NAMA_DESA || "Darmaraja");
  const [idKader, setIdKader] = useState(user?.ID_USER || "");
  const [namaKader, setNamaKader] = useState(user?.NAMA || "");

  const [tanggal, setTanggal] = useState(getTodayJakarta());
  const [jumlahPeserta, setJumlahPeserta] = useState<number | string>("");
  const [jenisSenam, setJenisSenam] = useState("Senam Desa");
  const [statusAbsensi, setStatusAbsensi] = useState<StatusAbsensi>("Hadir");
  const [captionFoto, setCaptionFoto] = useState("");

  // Photo state
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoFileId, setFotoFileId] = useState("");
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState<{
    base64Data: string;
    fileName: string;
    sourceType: "CAMERA" | "GALLERY";
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setIdDesa(editData.ID_DESA);
        setNamaDesa(editData.NAMA_DESA);
        setIdKader(editData.ID_KADER);
        setNamaKader(editData.NAMA_KADER);
        setTanggal(normalizeDate(editData.TANGGAL) || getTodayJakarta());
        setJumlahPeserta(editData.JUMLAH_PESERTA !== undefined ? editData.JUMLAH_PESERTA : "");
        setJenisSenam(editData.JENIS_SENAM);
        setStatusAbsensi(editData.STATUS_ABSENSI);
        setCaptionFoto(editData.CAPTION_FOTO || "");
        setFotoUrl(editData.FOTO_URL || "");
        setFotoFileId(editData.FOTO_FILE_ID || "");
        setPendingPhotoBase64(null);
      } else {
        // New report
        const initialDesaId = user?.ID_DESA || desaList[0]?.ID_DESA || "DSA-0001";
        setIdDesa(initialDesaId);
        const foundD = desaList.find((d) => d.ID_DESA === initialDesaId);
        const initialNamaDesa = foundD?.NAMA_DESA || user?.NAMA_DESA || "Darmaraja";
        setNamaDesa(initialNamaDesa);

        if (isKader) {
          setIdKader(user?.ID_USER || "");
          setNamaKader(user?.NAMA || "");
        } else {
          // Otomatis cari kader yang bertugas di desa yang dipilih
          const matchedKader = usersList.find(
            (u) =>
              u.ROLE === "Kader" &&
              (u.ID_DESA === initialDesaId || (initialNamaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === initialNamaDesa.toLowerCase())) &&
              u.STATUS !== "Nonaktif"
          ) || usersList.find(
            (u) => u.ID_DESA === initialDesaId || (initialNamaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === initialNamaDesa.toLowerCase())
          );

          if (matchedKader) {
            setIdKader(matchedKader.ID_USER);
            setNamaKader(matchedKader.NAMA);
          } else {
            setIdKader(user?.ID_USER || "");
            setNamaKader(user?.NAMA || "");
          }
        }

        setTanggal(getTodayJakarta());
        setJumlahPeserta(""); // Dikosongkan sesuai permintaan
        setJenisSenam(jenisSenamList[0]?.NAMA_JENIS || "Senam Desa");
        setStatusAbsensi("Hadir");
        setCaptionFoto("");
        setFotoUrl("");
        setFotoFileId("");
        setPendingPhotoBase64(null);
      }
    }
  }, [isOpen, editData, user, desaList, jenisSenamList, usersList, isKader]);

  const handleDesaChange = (selectedId: string) => {
    setIdDesa(selectedId);
    const d = desaList.find((item) => item.ID_DESA === selectedId);
    const newNamaDesa = d ? d.NAMA_DESA : "";
    if (d) setNamaDesa(newNamaDesa);

    // Jika Admin atau Koordinator, otomatis pilih kader yang ada di desa tersebut
    if (!isKader && usersList.length > 0) {
      const matchedKader = usersList.find(
        (u) =>
          u.ROLE === "Kader" &&
          (u.ID_DESA === selectedId || (newNamaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === newNamaDesa.toLowerCase())) &&
          u.STATUS !== "Nonaktif"
      ) || usersList.find(
        (u) => u.ID_DESA === selectedId || (newNamaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === newNamaDesa.toLowerCase())
      );

      if (matchedKader) {
        setIdKader(matchedKader.ID_USER);
        setNamaKader(matchedKader.NAMA);
      }
    }
  };

  const handleKaderChange = (selectedUserId: string) => {
    setIdKader(selectedUserId);
    const u = usersList.find((item) => item.ID_USER === selectedUserId);
    if (u) {
      setNamaKader(u.NAMA);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jumlahPeserta === "" || jumlahPeserta === undefined || jumlahPeserta === null) {
      showError("Jumlah peserta wajib diisi (tidak boleh kosong)");
      return;
    }

    const pesertaNum = parseInt(String(jumlahPeserta), 10);
    if (isNaN(pesertaNum) || pesertaNum < 0) {
      showError("Jumlah peserta harus berupa angka positif (minimal 0)");
      return;
    }

    if (!tanggal) {
      showError("Tanggal kegiatan wajib diisi");
      return;
    }

    // MANDATORY PHOTO VALIDATION FOR HADIR
    if (statusAbsensi === "Hadir" && !fotoUrl && !pendingPhotoBase64) {
      showError(
        isKader
          ? "Status HADIR bagi Kader WAJIB menyertakan foto dokumentasi yang diambil langsung dari kamera!"
          : "Status HADIR WAJIB menyertakan foto dokumentasi (Kamera / Galeri)!",
        "Validasi Absensi"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let finalFotoUrl = fotoUrl;
      let finalFotoFileId = fotoFileId;

      // Upload photo if new photo was captured
      if (pendingPhotoBase64) {
        const uploadRes = await apiService.uploadFoto(
          pendingPhotoBase64.base64Data,
          pendingPhotoBase64.fileName
        );
        if (uploadRes.success && uploadRes.data) {
          finalFotoUrl = uploadRes.data.fileUrl;
          finalFotoFileId = uploadRes.data.fileId;
        } else {
          showError("Gagal mengunggah foto ke Google Drive, menggunakan data lokal");
        }
      }

      if (isEdit && editData) {
        const res = await apiService.updateLaporan({
          ID_LAPORAN: editData.ID_LAPORAN,
          ID_DESA: idDesa,
          NAMA_DESA: namaDesa,
          ID_KADER: idKader,
          NAMA_KADER: namaKader,
          TANGGAL: tanggal,
          JUMLAH_PESERTA: pesertaNum,
          JENIS_SENAM: jenisSenam,
          STATUS_ABSENSI: statusAbsensi,
          FOTO_URL: finalFotoUrl,
          FOTO_FILE_ID: finalFotoFileId,
          CAPTION_FOTO: captionFoto
        });

        if (res.success) {
          showSuccess("Laporan senam berhasil diperbarui");
          onSuccess();
          onClose();
        } else {
          showError(res.message || "Gagal memperbarui laporan");
        }
      } else {
        const res = await apiService.saveLaporan({
          ID_DESA: idDesa,
          NAMA_DESA: namaDesa,
          ID_KADER: idKader,
          NAMA_KADER: namaKader,
          TANGGAL: tanggal,
          JUMLAH_PESERTA: pesertaNum,
          JENIS_SENAM: jenisSenam,
          STATUS_ABSENSI: statusAbsensi,
          FOTO_URL: finalFotoUrl,
          FOTO_FILE_ID: finalFotoFileId,
          CAPTION_FOTO: captionFoto,
          SOURCE_TYPE: pendingPhotoBase64?.sourceType || (statusAbsensi === "Hadir" ? "CAMERA" : "GALLERY")
        });

        if (res.success) {
          showSuccess("Laporan senam berhasil disimpan");
          onSuccess();
          onClose();
        } else {
          showError(res.message || "Gagal menyimpan laporan");
        }
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Laporan Senam" : "Input Laporan Senam Baru"}
      subtitle="Pencatatan kehadiran senam KORMI Darmaraja"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs pb-1">
        {/* Identitas Desa & Kader Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          {/* Desa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Desa Kegiatan
              </span>
              <InfoTooltip text="Pilih desa tempat pelaksanaan senam. Kader pelapor akan otomatis menyesuaikan." />
            </label>
            {isKader ? (
              <input
                type="text"
                readOnly
                value={`Desa ${user?.NAMA_DESA || "Darmaraja"} (${user?.ID_DESA || "DSA-0001"})`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-600 font-semibold cursor-not-allowed text-xs"
              />
            ) : (
              <select
                value={idDesa}
                onChange={(e) => handleDesaChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                {desaList.map((d) => (
                  <option key={d.ID_DESA} value={d.ID_DESA}>
                    Desa {d.NAMA_DESA} ({d.ID_DESA})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Kader */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" /> Kader Pelapor
              </span>
              <InfoTooltip text="Kader otomatis disesuaikan dengan desa yang dipilih. Admin/Koordinator dapat memilih kader lain jika mewakili." />
            </label>
            {isKader ? (
              <input
                type="text"
                readOnly
                value={`${user?.NAMA || "Kader"} (${user?.ID_USER || "USR-0001"})`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-600 font-semibold cursor-not-allowed text-xs"
              />
            ) : (
              <select
                value={idKader}
                onChange={(e) => handleKaderChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                {!idKader && <option value="">-- Pilih Kader Pelapor --</option>}
                
                {/* Kader yang bertugas di desa yang dipilih */}
                {usersList.some((u) => u.ID_DESA === idDesa || (namaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === namaDesa.toLowerCase())) && (
                  <optgroup label={`Kader di Desa ${namaDesa}`}>
                    {usersList
                      .filter((u) => u.ID_DESA === idDesa || (namaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === namaDesa.toLowerCase()))
                      .map((u) => (
                        <option key={u.ID_USER} value={u.ID_USER}>
                          {u.NAMA} ({u.ROLE} - {u.NAMA_DESA})
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* Pengguna / Kader lainnya */}
                <optgroup label="Pengguna / Kader Lainnya">
                  {usersList
                    .filter((u) => !(u.ID_DESA === idDesa || (namaDesa && u.NAMA_DESA && u.NAMA_DESA.toLowerCase() === namaDesa.toLowerCase())))
                    .map((u) => (
                      <option key={u.ID_USER} value={u.ID_USER}>
                        {u.NAMA} ({u.ROLE} - {u.NAMA_DESA || "Umum"})
                      </option>
                    ))}
                </optgroup>
              </select>
            )}
          </div>
        </div>

        {/* Tanggal, Jumlah Peserta, Jenis Senam, Status Absensi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Tanggal Kegiatan
              </span>
              <InfoTooltip text="Waktu Indonesia Barat (WIB). Default hari ini (Asia/Jakarta)." />
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Jumlah Peserta
              </span>
              <InfoTooltip text="Total peserta yang hadir mengikuti kegiatan senam (angka minimal 0, wajib diisi)." />
            </label>
            <input
              type="number"
              min="0"
              value={jumlahPeserta}
              onChange={(e) => setJumlahPeserta(e.target.value === "" ? "" : e.target.value)}
              placeholder="Masukkan jumlah peserta..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" /> Jenis Senam
              </span>
              <InfoTooltip text="Pilih jenis senam yang dilaksanakan (contoh: Senam Desa, Senam Bugar, dll)." />
            </label>
            <select
              value={jenisSenam}
              onChange={(e) => setJenisSenam(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            >
              {jenisSenamList.map((j) => (
                <option key={j.ID_JENIS} value={j.NAMA_JENIS}>
                  {j.NAMA_JENIS}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Status Absensi
              </span>
              <InfoTooltip text="Hadir: wajib menyertakan foto dokumentasi. Izin / Alfa: foto bersifat opsional." />
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["Hadir", "Izin", "Alfa"] as StatusAbsensi[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusAbsensi(st)}
                  className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition ${
                    statusAbsensi === st
                      ? st === "Hadir"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : st === "Izin"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-rose-500 text-white border-rose-500 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Foto Dokumentasi Section */}
        <div className="pt-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              Foto Dokumentasi
            </span>
            <InfoTooltip text="Kader berstatus Hadir wajib melampirkan foto kamera langsung. Admin/Koordinator dapat memilih kamera atau galeri." />
          </label>
          <ImageCaptureModal
            statusAbsensi={statusAbsensi}
            userRole={user?.ROLE}
            idDesa={idDesa}
            idKader={idKader}
            tanggal={tanggal}
            existingPhotoUrl={fotoUrl}
            onPhotoSelected={(data) => {
              setPendingPhotoBase64({
                base64Data: data.base64Data,
                fileName: data.fileName,
                sourceType: data.sourceType
              });
              setFotoUrl(data.dataUrl);
            }}
            onRemovePhoto={() => {
              setFotoUrl("");
              setFotoFileId("");
              setPendingPhotoBase64(null);
            }}
          />
        </div>

        {/* Caption / Catatan Foto */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">Catatan Kegiatan (Opsional)</span>
            <InfoTooltip text="Keterangan tambahan seperti suasana senam, nama instruktur, lokasi spesifik, atau kendala lapangan." />
          </label>
          <textarea
            value={captionFoto}
            onChange={(e) => setCaptionFoto(e.target.value)}
            rows={2}
            placeholder="Tuliskan catatan kegiatan (opsional)..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Sticky Action Footer - Tampil utuh, tidak terpotong setengah, dan tidak terhalang */}
        <div className="sticky bottom-0 -mx-6 mt-4 px-6 py-3 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition active:scale-95 text-xs"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition disabled:opacity-50 text-xs"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Menyimpan data..." : isEdit ? "Simpan Perubahan" : "Simpan Laporan"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
