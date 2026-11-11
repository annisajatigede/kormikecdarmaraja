import { API_CONFIG } from "../config";

/**
 * Generate standard file name format: YYYYMMDD_IDDESA_IDKADER_TIMESTAMP.jpg
 * Example: 20260830_DSA-0001_USR-0004_08301230.jpg
 */
export function generatePhotoFileName(idDesa: string, idKader: string, dateStr?: string): string {
  const now = new Date();
  let yyyymmdd = "";
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    yyyymmdd = dateStr.replace(/-/g, "");
  } else {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    yyyymmdd = `${y}${m}${d}`;
  }

  const cleanDesa = (idDesa || "DSA-0000").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanKader = (idKader || "USR-0000").replace(/[^a-zA-Z0-9_-]/g, "");
  
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStamp = `${m}${d}${hh}${mm}`;

  return `${yyyymmdd}_${cleanDesa}_${cleanKader}_${timeStamp}.jpg`;
}

/**
 * Resizes and compresses an image file to JPEG base64 string
 */
export function compressImageFile(
  file: File | Blob,
  maxDimension = API_CONFIG.maxImageDimension,
  quality = API_CONFIG.imageQuality
): Promise<{ base64: string; dataUrl: string; sizeBytes: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak didukung"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi Canvas"));
          return;
        }

        // Fill white background for potential transparent PNGs converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        const sizeBytes = Math.round((base64.length * 3) / 4);

        resolve({
          base64,
          dataUrl,
          sizeBytes,
          width,
          height
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
