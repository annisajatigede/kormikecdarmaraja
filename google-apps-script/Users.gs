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
  var authUserId = data.authUserId || data.ID_USER;
  var authUser = getAuthenticatedUser(authUserId);
  var idUser = data.ID_USER;
  
  if (!idUser) {
    return jsonResponse({ success: false, message: 'ID User wajib diisi' });
  }

  // Cek apakah user sedang mengedit akun miliknya sendiri (misal dari menu Profil / Ganti Password)
  var isSelf = (authUser && (
    String(authUser.ID_USER).trim().toLowerCase() === String(idUser).trim().toLowerCase() ||
    (data.USERNAME && String(authUser.USERNAME).trim().toLowerCase() === String(data.USERNAME).trim().toLowerCase())
  ));

  // Hanya Admin, Koordinator, atau user itu sendiri (self-update) yang diizinkan memperbarui data
  if (!authUser || (!isSelf && authUser.ROLE !== 'Admin' && authUser.ROLE !== 'Koordinator')) {
    return jsonResponse({ success: false, message: 'Anda tidak memiliki izin mengedit user ini' });
  }
  
  var newPassword = (data.PASSWORD !== undefined ? data.PASSWORD : (data.password !== undefined ? data.password : (data.newPassword !== undefined ? data.newPassword : ''))).toString().trim();
  if (newPassword && newPassword.length < 6) {
    return jsonResponse({ success: false, message: 'Password baru minimal 6 karakter' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return jsonResponse({ success: false, message: 'Database user kosong' });
    }

    var headers = values[0];
    var idCol = headers.indexOf('ID_USER') + 1;
    if (idCol === 0) idCol = 1;
    var namaCol = headers.indexOf('NAMA') + 1;
    if (namaCol === 0) namaCol = 2;
    var userCol = headers.indexOf('USERNAME') + 1;
    if (userCol === 0) userCol = 3;
    var passCol = headers.indexOf('PASSWORD_HASH') + 1;
    if (passCol === 0) passCol = headers.indexOf('PASSWORD') + 1;
    if (passCol === 0) passCol = 4;
    var roleCol = headers.indexOf('ROLE') + 1;
    if (roleCol === 0) roleCol = 5;
    var desaCol = headers.indexOf('ID_DESA') + 1;
    if (desaCol === 0) desaCol = 6;
    var namaDesaCol = headers.indexOf('NAMA_DESA') + 1;
    if (namaDesaCol === 0) namaDesaCol = 7;
    var statusCol = headers.indexOf('STATUS') + 1;
    if (statusCol === 0) statusCol = 8;
    var updatedCol = headers.indexOf('UPDATED_AT') + 1;
    if (updatedCol === 0) updatedCol = 10;

    var foundRow = -1;
    var existingRow = null;

    for (var i = 1; i < values.length; i++) {
      var rowId = String(values[i][idCol - 1] || '').trim().toLowerCase();
      var targetId = String(idUser).trim().toLowerCase();
      var rowUser = String(values[i][userCol - 1] || '').trim().toLowerCase();
      var targetUser = data.USERNAME ? String(data.USERNAME).trim().toLowerCase() : '';

      if (rowId === targetId || (targetUser && rowUser === targetUser)) {
        foundRow = i + 1;
        existingRow = values[i];
        break;
      }
    }

    if (foundRow === -1 || !existingRow) {
      return jsonResponse({ success: false, message: 'Data user tidak ditemukan' });
    }

    var currentRole = String(existingRow[roleCol - 1] || 'Kader');

    // Koordinator hanya dapat mengedit user dengan role Kader (kecuali sedang mengedit profil sendiri)
    if (!isSelf && authUser.ROLE === 'Koordinator' && currentRole !== 'Kader') {
      return jsonResponse({ success: false, message: 'Koordinator hanya dapat mengedit user dengan role Kader' });
    }

    var roleToSave = currentRole;
    if (authUser.ROLE === 'Admin' && data.ROLE) {
      roleToSave = data.ROLE;
    }

    // Nama lengkap
    var finalNama = (data.NAMA !== undefined && String(data.NAMA).trim() !== '')
      ? String(data.NAMA).trim()
      : String(existingRow[namaCol - 1] || '').trim();

    if (!finalNama) {
      return jsonResponse({ success: false, message: 'Nama user tidak boleh kosong' });
    }

    // Data Desa & Status: Pertahankan nilai lama jika self-update oleh non-Admin
    var idDesa = existingRow[desaCol - 1] || '';
    var namaDesa = existingRow[namaDesaCol - 1] || '';
    var status = existingRow[statusCol - 1] || 'Aktif';

    if (authUser.ROLE === 'Admin' || (authUser.ROLE === 'Koordinator' && !isSelf)) {
      if (data.ID_DESA !== undefined && data.ID_DESA !== '') idDesa = data.ID_DESA;
      if (data.NAMA_DESA !== undefined && data.NAMA_DESA !== '') namaDesa = data.NAMA_DESA;
      if (data.STATUS !== undefined && data.STATUS !== '') status = data.STATUS;
    }

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    // Simpan Nama ke sheet
    sheet.getRange(foundRow, namaCol).setValue(finalNama);
    
    // UPDATE PASSWORD KE DATASHEET (JIKA DIISI)
    if (newPassword) {
      var passwordHash = hashPassword(newPassword);
      sheet.getRange(foundRow, passCol).setValue(passwordHash);
    }
    
    // Simpan Role, Desa, Status, dan UpdatedAt
    sheet.getRange(foundRow, roleCol).setValue(roleToSave);
    if (desaCol > 0) sheet.getRange(foundRow, desaCol).setValue(idDesa);
    if (namaDesaCol > 0) sheet.getRange(foundRow, namaDesaCol).setValue(namaDesa);
    if (statusCol > 0) sheet.getRange(foundRow, statusCol).setValue(status);
    if (updatedCol > 0) sheet.getRange(foundRow, updatedCol).setValue(nowStr);

    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: newPassword ? 'UPDATE_PASSWORD' : 'UPDATE_USER',
      TABLE_NAME: 'USERS',
      RECORD_ID: idUser,
      DESCRIPTION: (isSelf ? 'User memperbarui profil sendiri' : 'Mengubah user ' + finalNama) + (newPassword ? ' (Password berhasil diperbarui)' : '')
    });

    return jsonResponse({
      success: true,
      message: newPassword ? 'Data user dan password berhasil diperbarui ke datasheet' : 'Data user berhasil diperbarui',
      data: {
        ID_USER: idUser,
        NAMA: finalNama,
        ROLE: roleToSave,
        ID_DESA: idDesa,
        NAMA_DESA: namaDesa,
        STATUS: status,
        UPDATED_AT: nowStr
      }
    });
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
