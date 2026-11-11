/**
 * =========================================================================
 * AUTH.GS - Autentikasi, Password Verification, dan Role Validation
 * =========================================================================
 */

/**
 * Handle Login Request
 */
function handleLogin(data) {
  var username = (data.username || '').trim();
  var password = (data.password || '').trim();
  
  if (!username || !password) {
    return jsonResponse({ success: false, message: 'Username dan password wajib diisi' });
  }
  
  var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse({ success: false, message: 'Database user kosong. Jalankan setupDatabase() terlebih dahulu.' });
  }
  
  var headers = values[0];
  var uIdx = headers.indexOf('USERNAME');
  if (uIdx === -1) uIdx = 2;
  var pIdx = headers.indexOf('PASSWORD_HASH');
  if (pIdx === -1) pIdx = headers.indexOf('PASSWORD');
  if (pIdx === -1) pIdx = 3;
  var idIdx = headers.indexOf('ID_USER');
  if (idIdx === -1) idIdx = 0;
  var namaIdx = headers.indexOf('NAMA');
  if (namaIdx === -1) namaIdx = 1;
  var roleIdx = headers.indexOf('ROLE');
  if (roleIdx === -1) roleIdx = 4;
  var idDesaIdx = headers.indexOf('ID_DESA');
  if (idDesaIdx === -1) idDesaIdx = 5;
  var namaDesaIdx = headers.indexOf('NAMA_DESA');
  if (namaDesaIdx === -1) namaDesaIdx = 6;
  var statusIdx = headers.indexOf('STATUS');
  if (statusIdx === -1) statusIdx = 7;
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var dbUsername = String(row[uIdx] || '').trim();
    
    if (dbUsername.toLowerCase() === username.toLowerCase()) {
      var dbStatus = String(row[statusIdx] || 'Aktif');
      if (dbStatus.toLowerCase() === 'nonaktif') {
        return jsonResponse({ success: false, message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.' });
      }
      
      var dbHash = String(row[pIdx] || '');
      var passwordValid = verifyPassword(password, dbHash);
      
      if (!passwordValid) {
        return jsonResponse({ success: false, message: 'Password salah' });
      }
      
      var userPayload = {
        ID_USER: row[idIdx],
        NAMA: row[namaIdx],
        USERNAME: row[uIdx],
        ROLE: row[roleIdx],
        ID_DESA: row[idDesaIdx] || '',
        NAMA_DESA: row[namaDesaIdx] || ''
      };
      
      // Catat ke Audit Log
      recordAuditLog({
        ID_USER: userPayload.ID_USER,
        NAMA_USER: userPayload.NAMA,
        ROLE: userPayload.ROLE,
        ACTION: 'LOGIN',
        TABLE_NAME: 'USERS',
        RECORD_ID: userPayload.ID_USER,
        DESCRIPTION: 'User berhasil login'
      });
      
      return jsonResponse({
        success: true,
        message: 'Login berhasil',
        data: userPayload
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Username tidak ditemukan' });
}

/**
 * Validasi session user berdasarkan database aktual
 */
function getAuthenticatedUser(userId) {
  if (!userId) return null;
  var sheet = getSheet(CONFIG.SHEET_NAMES.USERS);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  
  var headers = values[0];
  var idIdx = headers.indexOf('ID_USER');
  if (idIdx === -1) idIdx = 0;
  var namaIdx = headers.indexOf('NAMA');
  if (namaIdx === -1) namaIdx = 1;
  var uIdx = headers.indexOf('USERNAME');
  if (uIdx === -1) uIdx = 2;
  var roleIdx = headers.indexOf('ROLE');
  if (roleIdx === -1) roleIdx = 4;
  var idDesaIdx = headers.indexOf('ID_DESA');
  if (idDesaIdx === -1) idDesaIdx = 5;
  var namaDesaIdx = headers.indexOf('NAMA_DESA');
  if (namaDesaIdx === -1) namaDesaIdx = 6;
  var statusIdx = headers.indexOf('STATUS');
  if (statusIdx === -1) statusIdx = 7;
  
  var target = String(userId).trim().toLowerCase();
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowId = String(row[idIdx] || '').trim().toLowerCase();
    var rowUser = String(row[uIdx] || '').trim().toLowerCase();
    if (rowId === target || rowUser === target) {
      if (String(row[statusIdx]).toLowerCase() === 'nonaktif') {
        return null;
      }
      return {
        ID_USER: row[idIdx],
        NAMA: row[namaIdx],
        USERNAME: row[uIdx],
        ROLE: row[roleIdx],
        ID_DESA: row[idDesaIdx] || '',
        NAMA_DESA: row[namaDesaIdx] || ''
      };
    }
  }
  return null;
}

/**
 * Password Hashing menggunakan SHA-256
 */
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hashStr = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // Support plain fallback if initial migration, else hash
  if (password === storedHash) return true;
  var computed = hashPassword(password);
  return computed === storedHash;
}
