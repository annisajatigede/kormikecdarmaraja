/**
 * =========================================================================
 * USERS.GS - CRUD Master Data Users / Kader & Role Enforcement
 * =========================================================================
 */

function handleGetUsers(params) {
  var user = getAuthenticatedUser(params.authUserId);
  if (!user || (user.ROLE !== 'Admin' && user.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin mengakses data user' });
  }
  
  var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
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
      if (headers[h] !== 'PASSWORD_HASH') {
        obj[headers[h]] = row[h];
      }
    }
    list.push(obj);
  }
  
  return jsonResponse({ success: true, data: list });
}

function handleSaveUser(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser || (authUser.ROLE !== 'Admin' && authUser.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin untuk menambah user' });
  }
  
  var nama = (data.NAMA || '').trim();
  var username = (data.USERNAME || '').trim();
  var password = (data.PASSWORD || '').trim();
  var idDesa = data.ID_DESA || '';
  var namaDesa = data.NAMA_DESA || '';
  var status = data.STATUS || 'Aktif';
  
  // Rule Enforcement: Koordinator can ONLY create role 'Kader'
  var targetRole = data.ROLE || 'Kader';
  if (authUser.ROLE === 'Koordinator') {
    targetRole = 'Kader';
  }
  
  if (!nama || !username || !password) {
    return jsonResponse({ success: false, message: 'Nama, Username, dan Password wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
    var values = sheet.getDataRange().getValues();
    
    // Check duplicate username
    var uIdx = values[0].indexOf('USERNAME');
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][uIdx]).toLowerCase() === username.toLowerCase()) {
        return jsonResponse({ success: false, message: 'Username ' + username + ' sudah digunakan' });
      }
    }
    
    var count = values.length;
    var newId = 'USR-' + ('000' + count).slice(-4);
    var passwordHash = hashPassword(password);
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      newId,
      nama,
      username,
      passwordHash,
      targetRole,
      idDesa,
      namaDesa,
      status,
      nowStr,
      nowStr
    ]);
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'CREATE_USER',
      TABLE_NAME: 'USERS',
      RECORD_ID: newId,
      DESCRIPTION: 'Menambah user ' + nama + ' (' + username + ') sebagai ' + targetRole
    });
    
    return jsonResponse({
      success: true,
      message: 'User berhasil ditambahkan',
      data: {
        ID_USER: newId,
        NAMA: nama,
        USERNAME: username,
        ROLE: targetRole,
        ID_DESA: idDesa,
        NAMA_DESA: namaDesa,
        STATUS: status,
        CREATED_AT: nowStr,
        UPDATED_AT: nowStr
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateUser(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser || (authUser.ROLE !== 'Admin' && authUser.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin mengedit user' });
  }
  
  var idUser = data.ID_USER;
  var nama = (data.NAMA || '').trim();
  var idDesa = data.ID_DESA || '';
  var namaDesa = data.NAMA_DESA || '';
  var status = data.STATUS || 'Aktif';
  var newPassword = (data.PASSWORD || '').trim();
  
  if (!idUser || !nama) {
    return jsonResponse({ success: false, message: 'ID User dan Nama wajib diisi' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    var currentRole = '';
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idUser)) {
        foundRow = i + 1;
        currentRole = values[i][4];
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data user tidak ditemukan' });
    }
    
    // Koordinator cannot edit Admin or Koordinator
    if (authUser.ROLE === 'Koordinator' && currentRole !== 'Kader') {
      return jsonResponse({ success: false, message: 'Koordinator hanya dapat mengedit user dengan role Kader' });
    }
    
    var roleToSave = currentRole;
    if (authUser.ROLE === 'Admin' && data.ROLE) {
      roleToSave = data.ROLE;
    }
    
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(foundRow, 2).setValue(nama); // NAMA
    if (newPassword) {
      sheet.getRange(foundRow, 4).setValue(hashPassword(newPassword)); // PASSWORD_HASH
    }
    sheet.getRange(foundRow, 5).setValue(roleToSave); // ROLE
    sheet.getRange(foundRow, 6).setValue(idDesa); // ID_DESA
    sheet.getRange(foundRow, 7).setValue(namaDesa); // NAMA_DESA
    sheet.getRange(foundRow, 8).setValue(status); // STATUS
    sheet.getRange(foundRow, 10).setValue(nowStr); // UPDATED_AT
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'UPDATE_USER',
      TABLE_NAME: 'USERS',
      RECORD_ID: idUser,
      DESCRIPTION: 'Mengubah user ' + nama + ' (Role: ' + roleToSave + ', Status: ' + status + ')'
    });
    
    return jsonResponse({ success: true, message: 'Data user berhasil diperbarui' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteUser(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser || authUser.ROLE !== 'Admin') {
    return jsonResponse({ success: false, message: 'Hanya Admin yang dapat menghapus user' });
  }
  
  var idUser = data.ID_USER;
  if (!idUser) {
    return jsonResponse({ success: false, message: 'ID User wajib disertakan' });
  }
  
  if (idUser === authUser.ID_USER) {
    return jsonResponse({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    var namaUser = '';
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idUser)) {
        foundRow = i + 1;
        namaUser = values[i][1];
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data user tidak ditemukan' });
    }
    
    sheet.deleteRow(foundRow);
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'DELETE_USER',
      TABLE_NAME: 'USERS',
      RECORD_ID: idUser,
      DESCRIPTION: 'Menghapus user ' + namaUser
    });
    
    return jsonResponse({ success: true, message: 'User berhasil dihapus' });
  } finally {
    lock.releaseLock();
  }
}
