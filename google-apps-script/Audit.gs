/**
 * =========================================================================
 * AUDIT.GS - Pencatatan Log Aktivitas Sistem
 * =========================================================================
 */

function recordAuditLog(entry) {
  try {
    var sheet = getSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
    var now = new Date();
    var timestampStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var idLog = 'LOG-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
    
    sheet.appendRow([
      idLog,
      timestampStr,
      entry.ID_USER || 'SYSTEM',
      entry.NAMA_USER || 'System',
      entry.ROLE || 'System',
      entry.ACTION || 'UNKNOWN',
      entry.TABLE_NAME || '-',
      entry.RECORD_ID || '-',
      entry.DESCRIPTION || ''
    ]);
  } catch (err) {
    Logger.log('Gagal mencatat audit log: ' + err.toString());
  }
}

function handleGetAuditLog(params) {
  var user = getAuthenticatedUser(params.authUserId);
  if (!user || user.ROLE !== 'Admin') {
    return jsonResponse({ success: false, message: 'Hanya Admin yang dapat melihat Audit Log' });
  }
  
  var sheet = getSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse({ success: true, data: [] });
  }
  
  var headers = values[0];
  var logs = [];
  
  // Baca dari baris terbaru (bawah ke atas) maksimal 200 record
  var startRow = values.length - 1;
  var endRow = Math.max(1, values.length - 200);
  
  for (var i = startRow; i >= endRow; i--) {
    var row = values[i];
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    logs.push(obj);
  }
  
  return jsonResponse({
    success: true,
    data: logs
  });
}
