/**
 * =========================================================================
 * LAPORAN SENAM KORMI DARMARAJA V.2 - GOOGLE APPS SCRIPT REST API
 * =========================================================================
 * Router utama untuk menangani request GET dan POST dari Frontend Web App
 */

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || '';
    
    // Public routes (or with token)
    if (action === 'health') {
      return jsonResponse({ success: true, message: 'KORMI Darmaraja API Online', timestamp: new Date().toISOString() });
    }
    
    if (action === 'getDesa') {
      return handleGetDesa(params);
    }
    
    if (action === 'getJenisSenam') {
      return handleGetJenisSenam(params);
    }
    
    if (action === 'getDashboard' || action === 'getDashboardStats') {
      return handleGetDashboard(params);
    }
    
    if (action === 'getSenamTerbanyak') {
      return handleGetSenamTerbanyak(params);
    }
    
    if (action === 'getSenamTeraktif') {
      return handleGetSenamTeraktif(params);
    }
    
    if (action === 'getLaporan') {
      return handleGetLaporan(params);
    }
    
    if (action === 'getUsers') {
      return handleGetUsers(params);
    }
    
    if (action === 'getAuditLog') {
      return handleGetAuditLog(params);
    }
    
    return jsonResponse({ success: false, message: 'Action GET tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Terjadi kesalahan pada server: ' + err.toString() });
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }
    
    var action = postData.action || (e && e.parameter ? e.parameter.action : '');
    
    // 1. Authentication & Profile
    if (action === 'login') {
      return handleLogin(postData);
    }
    if (action === 'updateProfile' || action === 'changePassword' || action === 'updatePassword') {
      return handleUpdateUser(postData);
    }
    
    // 2. Laporan CRUD
    if (action === 'saveLaporan') {
      return handleSaveLaporan(postData);
    }
    if (action === 'updateLaporan') {
      return handleUpdateLaporan(postData);
    }
    if (action === 'deleteLaporan') {
      return handleDeleteLaporan(postData);
    }
    
    // 3. Desa CRUD
    if (action === 'saveDesa') {
      return handleSaveDesa(postData);
    }
    if (action === 'updateDesa') {
      return handleUpdateDesa(postData);
    }
    if (action === 'deleteDesa') {
      return handleDeleteDesa(postData);
    }
    
    // 4. Jenis Senam CRUD
    if (action === 'saveJenisSenam') {
      return handleSaveJenisSenam(postData);
    }
    if (action === 'updateJenisSenam') {
      return handleUpdateJenisSenam(postData);
    }
    if (action === 'deleteJenisSenam') {
      return handleDeleteJenisSenam(postData);
    }
    
    // 5. Users CRUD
    if (action === 'saveUser') {
      return handleSaveUser(postData);
    }
    if (action === 'updateUser') {
      return handleUpdateUser(postData);
    }
    if (action === 'deleteUser') {
      return handleDeleteUser(postData);
    }
    
    // 6. Foto Upload
    if (action === 'uploadFoto') {
      return handleUploadFoto(postData);
    }
    
    return jsonResponse({ success: false, message: 'Action POST tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Gagal memproses request: ' + err.toString() });
  }
}

/**
 * Helper untuk format response JSON standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
