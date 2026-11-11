/**
 * =========================================================================
 * JENIS_SENAM.GS - CRUD Master Data Jenis Senam
 * =========================================================================
 */

function handleGetJenisSenam(params) {
  var sheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse({ success: true, data: [] });
  }
  
  var headers = values[0];
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    list.push(obj);
  }
  
  return jsonResponse({ success: true, data: list });
}

function handleSaveJenisSenam(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || (user.ROLE !== 'Admin' && user.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin untuk menambah jenis senam' });
  }
  
  var namaJenis = (data.NAMA_JENIS || '').trim();
  if (!namaJenis) {
    return jsonResponse({ success: false, message: 'Nama Jenis Senam wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
    var values = sheet.getDataRange().getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]).toLowerCase() === namaJenis.toLowerCase()) {
        return jsonResponse({ success: false, message: 'Jenis Senam ' + namaJenis + ' sudah ada' });
      }
    }
    
    var count = values.length;
    var newId = 'JS-' + ('000' + count).slice(-4);
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var status = data.STATUS || 'Aktif';
    
    sheet.appendRow([newId, namaJenis, status, nowStr, nowStr]);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'CREATE_JENIS_SENAM',
      TABLE_NAME: 'JENIS_SENAM',
      RECORD_ID: newId,
      DESCRIPTION: 'Menambah jenis senam: ' + namaJenis
    });
    
    return jsonResponse({
      success: true,
      message: 'Jenis Senam berhasil ditambahkan',
      data: { ID_JENIS: newId, NAMA_JENIS: namaJenis, STATUS: status, CREATED_AT: nowStr, UPDATED_AT: nowStr }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateJenisSenam(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || (user.ROLE !== 'Admin' && user.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin untuk mengedit jenis senam' });
  }
  
  var idJenis = data.ID_JENIS;
  var namaJenis = (data.NAMA_JENIS || '').trim();
  var status = data.STATUS || 'Aktif';
  
  if (!idJenis || !namaJenis) {
    return jsonResponse({ success: false, message: 'ID dan Nama Jenis Senam wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idJenis)) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data jenis senam tidak ditemukan' });
    }
    
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(foundRow, 2).setValue(namaJenis);
    sheet.getRange(foundRow, 3).setValue(status);
    sheet.getRange(foundRow, 5).setValue(nowStr);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'UPDATE_JENIS_SENAM',
      TABLE_NAME: 'JENIS_SENAM',
      RECORD_ID: idJenis,
      DESCRIPTION: 'Mengubah jenis senam ' + namaJenis + ' (Status: ' + status + ')'
    });
    
    return jsonResponse({ success: true, message: 'Jenis senam berhasil diperbarui' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteJenisSenam(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || user.ROLE !== 'Admin') {
    return jsonResponse({ success: false, message: 'Hanya Admin yang dapat menghapus jenis senam' });
  }
  
  var idJenis = data.ID_JENIS;
  if (!idJenis) {
    return jsonResponse({ success: false, message: 'ID Jenis Senam wajib disertakan' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    var namaJenis = '';
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idJenis)) {
        foundRow = i + 1;
        namaJenis = values[i][1];
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data jenis senam tidak ditemukan' });
    }
    
    sheet.deleteRow(foundRow);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'DELETE_JENIS_SENAM',
      TABLE_NAME: 'JENIS_SENAM',
      RECORD_ID: idJenis,
      DESCRIPTION: 'Menghapus jenis senam ' + namaJenis
    });
    
    return jsonResponse({ success: true, message: 'Data jenis senam berhasil dihapus' });
  } finally {
    lock.releaseLock();
  }
}
