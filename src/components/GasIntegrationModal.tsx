import React, { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, RefreshCw, Database, Server, FolderKanban, Globe, ShieldCheck, Lock } from "lucide-react";
import { Modal } from "./Modal/Modal";
import { getApiUrl, setApiUrl, isLiveApiConfigured } from "../config";
import { apiService } from "../services/api";
import { useToast } from "./Toast/ToastContext";
import { SessionUser } from "../types";

interface GasIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: SessionUser | null;
}

export const GasIntegrationModal: React.FC<GasIntegrationModalProps> = ({ isOpen, onClose, user }) => {
  const { showSuccess, showError } = useToast();
  const [urlInput, setUrlInput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "code" | "guide">("config");
  const [selectedFile, setSelectedFile] = useState<string>("Code.gs");
  const [copiedFile, setCopiedFile] = useState(false);

  const isAdmin = user?.ROLE === "Admin";

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getApiUrl());
    }
  }, [isOpen]);

  const handleSaveUrl = () => {
    if (!isAdmin) {
      showError("Hanya Administrator yang memiliki wewenang mengubah konfigurasi endpoint backend");
      return;
    }
    setApiUrl(urlInput);
    showSuccess("Konfigurasi Web App URL berhasil disimpan");
  };

  const handleTestConnection = async () => {
    if (!isAdmin) {
      showError("Hanya Administrator yang dapat menguji konfigurasi endpoint");
      return;
    }
    if (!urlInput.trim()) {
      showError("Harap masukkan URL Google Apps Script Web App terlebih dahulu");
      return;
    }
    setIsTesting(true);
    try {
      const res = await apiService.testConnection(urlInput.trim());
      if (res.success) {
        showSuccess(res.message, "Koneksi Berhasil");
        setApiUrl(urlInput.trim());
      } else {
        showError(res.message, "Koneksi Gagal");
      }
    } catch (e: any) {
      showError(e.message || "Gagal menghubungi server Apps Script");
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    showSuccess("Kode berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const filesMap: Record<string, string> = {
    "Code.gs": `function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || '';
    if (action === 'health') return jsonResponse({ success: true, message: 'KORMI Darmaraja API Online' });
    if (action === 'getDesa') return handleGetDesa(params);
    if (action === 'getJenisSenam') return handleGetJenisSenam(params);
    if (action === 'getDashboard' || action === 'getDashboardStats') return handleGetDashboard(params);
    if (action === 'getSenamTerbanyak') return handleGetSenamTerbanyak(params);
    if (action === 'getSenamTeraktif') return handleGetSenamTeraktif(params);
    if (action === 'getLaporan') return handleGetLaporan(params);
    if (action === 'getUsers') return handleGetUsers(params);
    if (action === 'getAuditLog') return handleGetAuditLog(params);
    return jsonResponse({ success: false, message: 'Action GET tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server error: ' + err.toString() });
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try { postData = JSON.parse(e.postData.contents); } catch (jsonErr) { postData = e.parameter || {}; }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }
    var action = postData.action || (e && e.parameter ? e.parameter.action : '');
    if (action === 'login') return handleLogin(postData);
    if (action === 'saveLaporan') return handleSaveLaporan(postData);
    if (action === 'updateLaporan') return handleUpdateLaporan(postData);
    if (action === 'deleteLaporan') return handleDeleteLaporan(postData);
    if (action === 'saveDesa') return handleSaveDesa(postData);
    if (action === 'updateDesa') return handleUpdateDesa(postData);
    if (action === 'deleteDesa') return handleDeleteDesa(postData);
    if (action === 'saveJenisSenam') return handleSaveJenisSenam(postData);
    if (action === 'updateJenisSenam') return handleUpdateJenisSenam(postData);
    if (action === 'deleteJenisSenam') return handleDeleteJenisSenam(postData);
    if (action === 'saveUser') return handleSaveUser(postData);
    if (action === 'updateUser' || action === 'updateProfile' || action === 'changePassword' || action === 'updatePassword') return handleUpdateUser(postData);
    if (action === 'deleteUser') return handleDeleteUser(postData);
    if (action === 'uploadFoto') return handleUploadFoto(postData);
    return jsonResponse({ success: false, message: 'Action POST tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Gagal memproses request: ' + err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`,
    "Config.gs": `var CONFIG = {
  // Masukkan ID Spreadsheet jika menggunakan Apps Script mandiri/standalone.
  // Kosongkan '' jika Apps Script dibuat langsung dari menu Extensions > Apps Script pada Spreadsheet.
  SPREADSHEET_ID: '', 
  SHEET_NAMES: {
    USERS: 'USERS',
    DESA: 'DESA',
    JENIS_SENAM: 'JENIS_SENAM',
    LAPORAN_SENAM: 'LAPORAN_SENAM',
    AUDIT_LOG: 'AUDIT_LOG'
  },
  DRIVE_FOLDER_NAME: 'Laporan Senam KORMI Darmaraja',
  LOCK_TIMEOUT_MS: 30000
};

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SPREADSHEET_ID');
    if (sheetId && sheetId.trim() !== '') {
      return SpreadsheetApp.openById(sheetId.trim());
    }
  } catch (e) {}
  try {
    var activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) return activeSS;
  } catch (e) {}
  throw new Error('Spreadsheet tidak ditemukan. Silakan isi CONFIG.SPREADSHEET_ID pada Config.gs.');
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}`,
    "Setup.gs": `function setupDatabase() {
  var ss = getSpreadsheet();
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  
  // 1. SHEET USERS
  var userSheet = getSheet(CONFIG.SHEET_NAMES.USERS);
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(['ID_USER', 'NAMA', 'USERNAME', 'PASSWORD_HASH', 'ROLE', 'ID_DESA', 'NAMA_DESA', 'STATUS', 'CREATED_AT', 'UPDATED_AT']);
    userSheet.appendRow(['USR-0001', 'Administrator KORMI', 'admin', hashPassword('admin123'), 'Admin', 'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr]);
    userSheet.appendRow(['USR-0002', 'Hj. Siti Koordinator', 'koordinator', hashPassword('koordinator123'), 'Koordinator', 'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr]);
    userSheet.appendRow(['USR-0003', 'Kader Senam Darmaraja', 'kader_darmaraja', hashPassword('kader123'), 'Kader', 'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr]);
  }
  
  // 2. SHEET DESA
  var desaSheet = getSheet(CONFIG.SHEET_NAMES.DESA);
  if (desaSheet.getLastRow() === 0) {
    desaSheet.appendRow(['ID_DESA', 'NAMA_DESA', 'STATUS', 'CREATED_AT', 'UPDATED_AT']);
    var daftarDesa = ['Darmaraja', 'Cikeusi', 'Tarunajaya', 'Sukamenak', 'Neglasari', 'Cieunteung', 'Ranggon', 'Pakualam', 'Karangpakuan', 'Cipaku', 'Jatimekar', 'Leuwihideung'];
    for (var d = 0; d < daftarDesa.length; d++) {
      desaSheet.appendRow(['DSA-' + ('000' + (d + 1)).slice(-4), daftarDesa[d], 'Aktif', nowStr, nowStr]);
    }
  }
  
  // 3. SHEET JENIS_SENAM
  var jsSheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
  if (jsSheet.getLastRow() === 0) {
    jsSheet.appendRow(['ID_JENIS', 'NAMA_JENIS', 'STATUS', 'CREATED_AT', 'UPDATED_AT']);
    var defaultJenis = ['Senam Kecamatan Minggu', 'Senam Kecamatan Jumat', 'Senam Desa'];
    for (var j = 0; j < defaultJenis.length; j++) {
      jsSheet.appendRow(['JS-' + ('000' + (j + 1)).slice(-4), defaultJenis[j], 'Aktif', nowStr, nowStr]);
    }
  }
  
  // 4. SHEET LAPORAN_SENAM
  var lapSheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  if (lapSheet.getLastRow() === 0) {
    lapSheet.appendRow(['ID_LAPORAN', 'ID_DESA', 'NAMA_DESA', 'ID_KADER', 'NAMA_KADER', 'TANGGAL', 'JUMLAH_PESERTA', 'JENIS_SENAM', 'STATUS_ABSENSI', 'FOTO_URL', 'FOTO_FILE_ID', 'CAPTION_FOTO', 'CREATED_AT', 'UPDATED_AT']);
  }
  
  // 5. SHEET AUDIT_LOG
  var auditSheet = getSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
  if (auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(['ID_LOG', 'TIMESTAMP', 'ID_USER', 'NAMA_USER', 'ROLE', 'ACTION', 'TABLE_NAME', 'RECORD_ID', 'DESCRIPTION']);
  }
  
  getOrCreatePhotoFolder();
  return 'Setup Database Selesai! Login awal: admin / admin123';
}`
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Integrasi Google Apps Script & Google Sheets"
      subtitle="Panduan & konfigurasi REST API Google Sheets KORMI Darmaraja"
      maxWidth="3xl"
    >
      <div className="space-y-4 text-slate-800">
        {/* Admin Restriction Banner for non-admins */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-amber-800">Hak Akses Terkunci (Hanya Administrator)</p>
              <p className="mt-0.5 text-slate-600">
                Akun Anda ({user?.ROLE || "Kader"}) hanya memiliki hak akses operasional. Konfigurasi endpoint backend, token URL, dan manajemen Google Apps Script dilindungi dan hanya dapat dimodifikasi oleh <strong>Administrator</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("config")}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "config"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Koneksi Web App
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "code"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Source Code .GS
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "guide"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Panduan Deployment
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === "config" && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm uppercase tracking-tight">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Endpoint REST API Google Apps Script</span>
              </div>
              <p className="text-slate-600">
                Aplikasi ini terhubung langsung ke Google Apps Script Web App endpoint. Anda dapat menguji status koneksi atau memperbarui URL deployment di bawah ini:
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Google Apps Script Web App URL (VITE_API_URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={urlInput}
                  disabled={!isAdmin}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:opacity-75 transition"
                />
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveUrl}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 shadow-sm"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                      {isTesting ? "Menguji..." : "Test Koneksi"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">Mode Operasi Saat Ini: </span>
                {isLiveApiConfigured() ? (
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">Terhubung Langsung ke Google Apps Script Live API</p>
                ) : (
                  <p className="font-bold text-sky-700 text-sm mt-0.5">Engine Database Terintegrasi (Siap Digunakan Langsung & Sinkronisasi)</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Code Viewer */}
        {activeTab === "code" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Object.keys(filesMap).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition shrink-0 border ${
                      selectedFile === fileName
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {fileName}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(filesMap[selectedFile] || "")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedFile ? "Tersalin!" : "Salin Kode"}
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 text-xs font-mono max-h-72 overflow-y-auto border border-slate-800">
              <pre>{filesMap[selectedFile] || "// Kode tersedia di folder /google-apps-script"}</pre>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">
              *Seluruh file lengkap (.gs) tersimpan dalam workspace di folder <span className="font-mono text-emerald-700 font-bold">/google-apps-script</span>.
            </p>
          </div>
        )}

        {/* Tab 3: Guide */}
        {activeTab === "guide" && (
          <div className="space-y-3 py-2 text-xs text-slate-700 max-h-80 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5 text-sm">
                <Database className="w-4 h-4 text-emerald-600" /> 1. Persiapan Google Spreadsheet
              </p>
              <p className="text-slate-600">1. Buka Google Spreadsheet di Google Drive Anda.</p>
              <p className="text-slate-600">2. Beri nama: <strong className="text-slate-900">DATABASE KORMI DARMARAJA</strong>.</p>
              <p className="text-slate-600">3. Buka menu <strong className="text-slate-900">Extensions &gt; Apps Script</strong>.</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5 text-sm">
                <FolderKanban className="w-4 h-4 text-sky-600" /> 2. Masukkan Script & Setup
              </p>
              <p className="text-slate-600">1. Salin kode dari tab <strong className="text-slate-900">Source Code .GS</strong> ke editor Apps Script.</p>
              <p className="text-slate-600">2. Pilih fungsi <strong className="text-slate-900">setupDatabase()</strong> lalu klik tombol <strong className="text-slate-900">Run / Jalankan</strong>.</p>
              <p className="text-slate-600">3. Berikan izin otorisasi saat Google meminta.</p>
              <p className="text-slate-600">4. Semua sheet (USERS, DESA, JENIS_SENAM, LAPORAN_SENAM, AUDIT_LOG) dan folder Drive dibuat otomatis!</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5 text-sm">
                <Globe className="w-4 h-4 text-amber-600" /> 3. Deploy Web App & Hubungkan
              </p>
              <p className="text-slate-600">1. Di Apps Script, klik tombol <strong className="text-slate-900">Deploy &gt; New deployment</strong>.</p>
              <p className="text-slate-600">2. Pilih tipe: <strong className="text-slate-900">Web app</strong>.</p>
              <p className="text-slate-600">3. Execute as: <strong className="text-slate-900">Me</strong>, Siapa yang memiliki akses: <strong className="text-slate-900">Anyone / Siapa Saja</strong>.</p>
              <p className="text-slate-600">4. Salin <strong className="text-slate-900">Web App URL</strong> yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-slate-800">/exec</code>.</p>
              <p className="text-slate-600">5. Tempel URL ke pengaturan aplikasi ini atau ke environment variable <strong className="text-slate-900">VITE_API_URL</strong>!</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
