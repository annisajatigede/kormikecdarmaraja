/**
 * =========================================================================
 * DESA.GS - CRUD Master Data Desa
 * =========================================================================
 */

function handleGetDesa(params) {
  var sheet = getSheet(CONFIG.SHEET_NAMES.DESA);
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

function handleSaveDesa(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || (user.ROLE !== 'Admin' && user.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin untuk menambah desa' });
  }
  
  var namaDesa = (data.NAMA_DESA || '').trim();
  if (!namaDesa) {
    return jsonResponse({ success: false, message: 'Nama Desa wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.DESA);
    var values = sheet.getDataRange().getValues();
    
    // Check duplicate
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]).toLowerCase() === namaDesa.toLowerCase()) {
        return jsonResponse({ success: false, message: 'Desa ' + namaDesa + ' sudah terdaftar' });
      }
    }
    
    var count = values.length; // Row count including header
    var newId = 'DSA-' + ('000' + count).slice(-4);
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var status = data.STATUS || 'Aktif';
    
    sheet.appendRow([newId, namaDesa, status, nowStr, nowStr]);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'CREATE_DESA',
      TABLE_NAME: 'DESA',
      RECORD_ID: newId,
      DESCRIPTION: 'Menambah desa: ' + namaDesa
    });
    
    return jsonResponse({
      success: true,
      message: 'Desa berhasil ditambahkan',
      data: { ID_DESA: newId, NAMA_DESA: namaDesa, STATUS: status, CREATED_AT: nowStr, UPDATED_AT: nowStr }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateDesa(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || (user.ROLE !== 'Admin' && user.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin untuk mengedit desa' });
  }
  
  var idDesa = data.ID_DESA;
  var namaDesa = (data.NAMA_DESA || '').trim();
  var status = data.STATUS || 'Aktif';
  
  if (!idDesa || !namaDesa) {
    return jsonResponse({ success: false, message: 'ID Desa dan Nama Desa wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.DESA);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idDesa)) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data desa tidak ditemukan' });
    }
    
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(foundRow, 2).setValue(namaDesa);
    sheet.getRange(foundRow, 3).setValue(status);
    sheet.getRange(foundRow, 5).setValue(nowStr);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'UPDATE_DESA',
      TABLE_NAME: 'DESA',
      RECORD_ID: idDesa,
      DESCRIPTION: 'Mengubah data desa ' + namaDesa + ' (Status: ' + status + ')'
    });
    
    return jsonResponse({ success: true, message: 'Data desa berhasil diperbarui' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteDesa(data) {
  var user = getAuthenticatedUser(data.authUserId);
  if (!user || user.ROLE !== 'Admin') {
    return jsonResponse({ success: false, message: 'Hanya Admin yang dapat menghapus data desa' });
  }
  
  var idDesa = data.ID_DESA;
  if (!idDesa) {
    return jsonResponse({ success: false, message: 'ID Desa wajib disertakan' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.DESA);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    var namaDesa = '';
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idDesa)) {
        foundRow = i + 1;
        namaDesa = values[i][1];
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data desa tidak ditemukan' });
    }
    
    sheet.deleteRow(foundRow);
    
    recordAuditLog({
      ID_USER: user.ID_USER,
      NAMA_USER: user.NAMA,
      ROLE: user.ROLE,
      ACTION: 'DELETE_DESA',
      TABLE_NAME: 'DESA',
      RECORD_ID: idDesa,
      DESCRIPTION: 'Menghapus desa ' + namaDesa
    });
    
    return jsonResponse({ success: true, message: 'Data desa berhasil dihapus' });
  } finally {
    lock.releaseLock();
  }
}
