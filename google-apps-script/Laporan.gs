/**
 * =========================================================================
 * LAPORAN.GS - CRUD Laporan Senam & Validasi Absensi/Foto
 * =========================================================================
 */

function handleGetLaporan(params) {
  var authUser = getAuthenticatedUser(params.authUserId);
  if (!authUser) {
    return jsonResponse({ success: false, code: 'SESSION_EXPIRED', message: 'Sesi Anda telah berakhir' });
  }
  
  var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse({ success: true, data: [] });
  }
  
  var headers = values[0];
  var list = [];
  var isKader = (authUser.ROLE === 'Kader');
  
  // Filter parameters
  var startDate = params.startDate || '';
  var endDate = params.endDate || '';
  var idDesa = params.idDesa || '';
  var jenisSenam = params.jenisSenam || '';
  var statusAbsensi = params.statusAbsensi || '';
  var search = (params.search || '').toLowerCase();
  
  // Loop from newest to oldest
  for (var i = values.length - 1; i >= 1; i--) {
    var row = values[i];
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    
    // Authorization check: Kader only sees own reports or own desa
    if (isKader && String(obj.ID_KADER) !== String(authUser.ID_USER)) {
      continue;
    }
    
    // Date filter
    var rowDate = String(obj.TANGGAL || '');
    if (startDate && rowDate < startDate) continue;
    if (endDate && rowDate > endDate) continue;
    
    // Desa filter
    if (idDesa && String(obj.ID_DESA) !== String(idDesa)) continue;
    
    // Jenis Senam filter
    if (jenisSenam && String(obj.JENIS_SENAM) !== String(jenisSenam)) continue;
    
    // Status Absensi filter
    if (statusAbsensi && String(obj.STATUS_ABSENSI) !== String(statusAbsensi)) continue;
    
    // Keyword search
    if (search) {
      var matchSearch = 
        String(obj.NAMA_DESA || '').toLowerCase().indexOf(search) > -1 ||
        String(obj.NAMA_KADER || '').toLowerCase().indexOf(search) > -1 ||
        String(obj.JENIS_SENAM || '').toLowerCase().indexOf(search) > -1 ||
        String(obj.CAPTION_FOTO || '').toLowerCase().indexOf(search) > -1;
      if (!matchSearch) continue;
    }
    
    list.push(obj);
  }
  
  return jsonResponse({ success: true, data: list });
}

function handleSaveLaporan(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser) {
    return jsonResponse({ success: false, code: 'SESSION_EXPIRED', message: 'Sesi Anda telah berakhir' });
  }
  
  var tanggal = (data.TANGGAL || '').trim();
  var jumlahPeserta = parseInt(data.JUMLAH_PESERTA, 10);
  var jenisSenam = (data.JENIS_SENAM || '').trim();
  var statusAbsensi = (data.STATUS_ABSENSI || 'Hadir').trim();
  var fotoUrl = (data.FOTO_URL || '').trim();
  var fotoFileId = (data.FOTO_FILE_ID || '').trim();
  var captionFoto = (data.CAPTION_FOTO || '').trim();
  
  // Validation
  if (!tanggal || isNaN(jumlahPeserta) || !jenisSenam || !statusAbsensi) {
    return jsonResponse({ success: false, message: 'Tanggal, Jumlah Peserta, Jenis Senam, dan Status Absensi wajib diisi' });
  }
  
  if (jumlahPeserta < 0) {
    return jsonResponse({ success: false, message: 'Jumlah peserta minimal 0' });
  }
  
  // SECURITY & BUSINESS RULE: Hadir requires mandatory photo
  if (statusAbsensi === 'Hadir' && !fotoUrl) {
    return jsonResponse({ success: false, message: 'Laporan dengan status Hadir WAJIB menyertakan foto dokumentasi kegiatan' });
  }
  
  // Enforce session data for Kader
  var idDesa = data.ID_DESA;
  var namaDesa = data.NAMA_DESA;
  var idKader = data.ID_KADER;
  var namaKader = data.NAMA_KADER;
  
  if (authUser.ROLE === 'Kader') {
    idDesa = authUser.ID_DESA;
    namaDesa = authUser.NAMA_DESA;
    idKader = authUser.ID_USER;
    namaKader = authUser.NAMA;
  } else {
    // Admin/Koordinator can pick, fallback to session if not provided
    idDesa = idDesa || authUser.ID_DESA || 'DSA-0001';
    namaDesa = namaDesa || authUser.NAMA_DESA || 'Darmaraja';
    idKader = idKader || authUser.ID_USER;
    namaKader = namaKader || authUser.NAMA;
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
    var values = sheet.getDataRange().getValues();
    
    var dateClean = tanggal.replace(/-/g, '');
    var count = values.length;
    var newId = 'LAP-' + dateClean + '-' + ('000' + count).slice(-4);
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      newId,
      idDesa,
      namaDesa,
      idKader,
      namaKader,
      tanggal,
      jumlahPeserta,
      jenisSenam,
      statusAbsensi,
      fotoUrl,
      fotoFileId,
      captionFoto,
      nowStr,
      nowStr
    ]);
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'CREATE_LAPORAN',
      TABLE_NAME: 'LAPORAN_SENAM',
      RECORD_ID: newId,
      DESCRIPTION: 'Input laporan: ' + jenisSenam + ' di ' + namaDesa + ' (' + tanggal + ')'
    });
    
    return jsonResponse({
      success: true,
      message: 'Laporan senam berhasil disimpan',
      data: {
        ID_LAPORAN: newId,
        ID_DESA: idDesa,
        NAMA_DESA: namaDesa,
        ID_KADER: idKader,
        NAMA_KADER: namaKader,
        TANGGAL: tanggal,
        JUMLAH_PESERTA: jumlahPeserta,
        JENIS_SENAM: jenisSenam,
        STATUS_ABSENSI: statusAbsensi,
        FOTO_URL: fotoUrl,
        FOTO_FILE_ID: fotoFileId,
        CAPTION_FOTO: captionFoto,
        CREATED_AT: nowStr,
        UPDATED_AT: nowStr
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateLaporan(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser) {
    return jsonResponse({ success: false, code: 'SESSION_EXPIRED', message: 'Sesi Anda telah berakhir' });
  }
  
  var idLaporan = data.ID_LAPORAN;
  if (!idLaporan) {
    return jsonResponse({ success: false, message: 'ID Laporan wajib disertakan' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    var currentRecord = null;
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idLaporan)) {
        foundRow = i + 1;
        currentRecord = values[i];
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data laporan tidak ditemukan' });
    }
    
    // Authorization: Kader can only update own report
    if (authUser.ROLE === 'Kader' && String(currentRecord[3]) !== String(authUser.ID_USER)) {
      return jsonResponse({ success: false, message: 'Anda hanya dapat mengedit laporan milik Anda sendiri' });
    }
    
    var tanggal = data.TANGGAL || currentRecord[5];
    var jumlahPeserta = (data.JUMLAH_PESERTA !== undefined && data.JUMLAH_PESERTA !== '') ? parseInt(data.JUMLAH_PESERTA, 10) : currentRecord[6];
    var jenisSenam = data.JENIS_SENAM || currentRecord[7];
    var statusAbsensi = data.STATUS_ABSENSI || currentRecord[8];
    var fotoUrl = data.FOTO_URL !== undefined ? data.FOTO_URL : currentRecord[9];
    var fotoFileId = data.FOTO_FILE_ID !== undefined ? data.FOTO_FILE_ID : currentRecord[10];
    var captionFoto = data.CAPTION_FOTO !== undefined ? data.CAPTION_FOTO : currentRecord[11];
    
    if (statusAbsensi === 'Hadir' && !fotoUrl) {
      return jsonResponse({ success: false, message: 'Status Hadir wajib menyertakan foto dokumentasi' });
    }
    
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(foundRow, 6).setValue(tanggal);
    sheet.getRange(foundRow, 7).setValue(jumlahPeserta);
    sheet.getRange(foundRow, 8).setValue(jenisSenam);
    sheet.getRange(foundRow, 9).setValue(statusAbsensi);
    sheet.getRange(foundRow, 10).setValue(fotoUrl);
    sheet.getRange(foundRow, 11).setValue(fotoFileId);
    sheet.getRange(foundRow, 12).setValue(captionFoto);
    sheet.getRange(foundRow, 14).setValue(nowStr);
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'UPDATE_LAPORAN',
      TABLE_NAME: 'LAPORAN_SENAM',
      RECORD_ID: idLaporan,
      DESCRIPTION: 'Memperbarui laporan ' + idLaporan
    });
    
    return jsonResponse({ success: true, message: 'Laporan berhasil diperbarui' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteLaporan(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser || authUser.ROLE !== 'Admin') {
    return jsonResponse({ success: false, message: 'Hanya Administrator yang memiliki izin menghapus laporan' });
  }
  
  var idLaporan = data.ID_LAPORAN;
  if (!idLaporan) {
    return jsonResponse({ success: false, message: 'ID Laporan wajib disertakan' });
  }
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(idLaporan)) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow === -1) {
      return jsonResponse({ success: false, message: 'Data laporan tidak ditemukan' });
    }
    
    // Hapus file foto terkait dari Google Drive jika ada
    var deletedRecord = values[foundRow - 1];
    var fotoUrl = String(data.FOTO_URL || deletedRecord[9] || '');
    var fotoFileId = String(data.FOTO_FILE_ID || deletedRecord[10] || '');
    
    // 1. Coba hapus via FOTO_FILE_ID
    if (fotoFileId && fotoFileId.trim() !== '') {
      try {
        var fileById = DriveApp.getFileById(fotoFileId.trim());
        if (fileById) {
          fileById.setTrashed(true);
        }
      } catch (errDriveId) {
        console.warn('Gagal menghapus file foto by ID di Google Drive: ' + errDriveId);
      }
    }
    
    // 2. Ekstrak Google Drive ID dari FOTO_URL jika FOTO_FILE_ID tidak valid atau belum terhapus
    if (fotoUrl && fotoUrl.indexOf('drive.google.com') > -1) {
      try {
        var matchDrive = fotoUrl.match(/[-\w]{25,}/);
        if (matchDrive && matchDrive[0]) {
          var fileByUrlId = DriveApp.getFileById(matchDrive[0]);
          if (fileByUrlId) {
            fileByUrlId.setTrashed(true);
          }
        }
      } catch (errDriveUrl) {
        console.warn('Gagal menghapus file foto by URL di Google Drive: ' + errDriveUrl);
      }
    }
    
    sheet.deleteRow(foundRow);
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'DELETE_LAPORAN',
      TABLE_NAME: 'LAPORAN_SENAM',
      RECORD_ID: idLaporan,
      DESCRIPTION: 'Menghapus laporan ' + idLaporan + ' beserta foto dokumentasi di Google Drive'
    });
    
    return jsonResponse({ success: true, message: 'Laporan dan foto di Google Drive berhasil dihapus' });
  } finally {
    lock.releaseLock();
  }
}
