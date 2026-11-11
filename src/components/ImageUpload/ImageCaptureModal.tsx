import React, { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, RotateCcw, Check, AlertCircle, X, ShieldAlert } from "lucide-react";
import { StatusAbsensi, PhotoSourceType } from "../../types";
import { compressImageFile, generatePhotoFileName } from "../../utils/image";
import { useToast } from "../Toast/ToastContext";

interface ImageCaptureModalProps {
  statusAbsensi: StatusAbsensi;
  userRole?: string;
  idDesa: string;
  idKader: string;
  tanggal?: string;
  existingPhotoUrl?: string;
  onPhotoSelected: (data: {
    base64Data: string;
    dataUrl: string;
    fileName: string;
    sourceType: PhotoSourceType;
    sizeBytes: number;
  }) => void;
  onRemovePhoto?: () => void;
}

export const ImageCaptureModal: React.FC<ImageCaptureModalProps> = ({
  statusAbsensi,
  userRole = "Kader",
  idDesa,
  idKader,
  tanggal,
  existingPhotoUrl,
  onPhotoSelected,
  onRemovePhoto
}) => {
  const { showError, showSuccess } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>(existingPhotoUrl || "");
  const [photoInfo, setPhotoInfo] = useState<{ fileName: string; sizeKb: number; sourceType: PhotoSourceType } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const isHadir = statusAbsensi === "Hadir";
  const isKader = userRole === "Kader";
  // PERBAIKAN: Hanya Kader yang wajib kamera mutlak saat Hadir.
  // Admin & Koordinator tetap diizinkan pakai galeri jika diperlukan (misal: kendala internet kader).
  const isCameraOnly = isHadir && isKader;

  useEffect(() => {
    if (existingPhotoUrl) {
      setPreviewUrl(existingPhotoUrl);
    }
  }, [existingPhotoUrl]);

  // Clean up media stream when unmounting or stopping live camera
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      setIsLiveCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Live WebRTC Camera error, fallback to device capture input:", err);
      setCameraError("Kamera browser terkendala, menggunakan kamera perangkat");
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const captureLiveFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    const fileName = generatePhotoFileName(idDesa, idKader, tanggal);
    const sizeBytes = Math.round((base64.length * 3) / 4);

    stopLiveCamera();
    setPreviewUrl(dataUrl);
    setPhotoInfo({
      fileName,
      sizeKb: Math.round(sizeBytes / 1024),
      sourceType: "CAMERA"
    });

    onPhotoSelected({
      base64Data: base64,
      dataUrl,
      fileName,
      sourceType: "CAMERA",
      sizeBytes
    });
    showSuccess("Foto kegiatan berhasil diambil via Kamera");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, source: PhotoSourceType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: if isCameraOnly (Kader + Hadir), only direct Camera is permitted!
    if (isCameraOnly && source !== "CAMERA") {
      showError("Status Hadir untuk Kader WAJIB menggunakan Kamera langsung perangkat", "Validasi Foto");
      return;
    }

    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file);
      const fileName = generatePhotoFileName(idDesa, idKader, tanggal);

      setPreviewUrl(compressed.dataUrl);
      setPhotoInfo({
        fileName,
        sizeKb: Math.round(compressed.sizeBytes / 1024),
        sourceType: source
      });

      onPhotoSelected({
        base64Data: compressed.base64,
        dataUrl: compressed.dataUrl,
        fileName,
        sourceType: source,
        sizeBytes: compressed.sizeBytes
      });

      showSuccess(`Foto berhasil diproses (${Math.round(compressed.sizeBytes / 1024)} KB)`);
    } catch (err: any) {
      showError(err.message || "Gagal memproses file foto");
    } finally {
      setIsCompressing(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleClear = () => {
    setPreviewUrl("");
    setPhotoInfo(null);
    if (onRemovePhoto) onRemovePhoto();
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "CAMERA")}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "GALLERY")}
      />

      {/* Notice Banner based on Role & Status */}
      <div
        className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
          isCameraOnly
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : isHadir
            ? "bg-blue-50 border-blue-200 text-blue-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {isCameraOnly ? (
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : isHadir ? (
            <Check className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span className="font-bold text-xs">Foto Dokumentasi</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs">
          {isHadir ? (isCameraOnly ? "Kamera Wajib" : "Kamera / Galeri") : "Opsional"}
        </span>
      </div>

      {/* Live In-App Camera Viewfinder Stream */}
      {isLiveCameraOpen && (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-xl aspect-4/3 flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={stopLiveCamera}
              className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
              aria-label="Tutup kamera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={captureLiveFrame}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-full shadow-lg transition border-2 border-white/50 text-sm"
            >
              <Camera className="w-5 h-5" /> Ambil Foto Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview Card */}
      {previewUrl && !isLiveCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm">
          <img
            src={previewUrl}
            alt="Dokumentasi Senam"
            className="w-full h-56 object-cover object-center transition duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3.5">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs">
                <Check className="w-3.5 h-3.5" /> Foto Terlampir
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-xl bg-black/50 text-white/90 hover:text-white hover:bg-rose-600 transition shadow-xs"
                title="Hapus foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {photoInfo && (
              <div className="text-[11px] text-white/90 bg-black/40 backdrop-blur-xs p-2 rounded-lg border border-white/10 flex justify-between items-center">
                <span className="truncate max-w-[200px] font-mono">{photoInfo.fileName}</span>
                <span className="font-semibold text-emerald-300">{photoInfo.sizeKb} KB</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Buttons */}
      {!isLiveCameraOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Direct Camera Button (Always available) */}
          <button
            type="button"
            onClick={() => {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                startLiveCamera();
              } else if (cameraInputRef.current) {
                cameraInputRef.current.click();
              }
            }}
            disabled={isCompressing}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition active:scale-98 shadow-sm ${
              isCameraOnly
                ? "col-span-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            <Camera className="w-4 h-4" />
            {previewUrl ? "Ambil Ulang (Kamera)" : "Buka Kamera Perangkat"}
          </button>

          {/* Gallery Button (Available for Admin/Koordinator or when status is Izin/Alfa) */}
          {!isCameraOnly && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition active:scale-98 shadow-xs"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              Pilih dari Galeri
            </button>
          )}
        </div>
      )}

      {isCompressing && (
        <p className="text-xs text-center text-slate-500 animate-pulse font-medium">
          Mengompresi dan memproses foto dokumentasi...
        </p>
      )}
    </div>
  );
};
