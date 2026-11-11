/**
 * =========================================================================
 * CONFIG.GS - Konfigurasi Spreadsheet, Sheet Name, dan Google Drive
 * =========================================================================
 */

var CONFIG = {
  // ID Spreadsheet aktif KORMI Darmaraja
  SPREADSHEET_ID: '18-jaBL85gobmm7M6a9M89yL_BYqWpH0Dw6cFjWOX6dM', 
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

/**
 * Mendapatkan Spreadsheet aktif atau via ID
 */
function getSpreadsheet() {
  // 1. Cek dari CONFIG.SPREADSHEET_ID
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }

  // 2. Cek dari Script Properties
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SPREADSHEET_ID');
    if (sheetId && sheetId.trim() !== '') {
      return SpreadsheetApp.openById(sheetId.trim());
    }
  } catch (e) {}

  // 3. Ambil Spreadsheet aktif (jika container-bound)
  try {
    var activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) return activeSS;
  } catch (e) {}

  throw new Error('Spreadsheet tidak ditemukan. Silakan isi CONFIG.SPREADSHEET_ID pada Config.gs dengan ID Google Spreadsheet Anda.');
}

/**
 * Mendapatkan objek Sheet berdasarkan nama
 */
function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}
