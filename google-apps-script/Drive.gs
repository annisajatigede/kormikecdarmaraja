/**
 * =========================================================================
 * DRIVE.GS - Pengelolaan Folder & Upload Foto Dokumentasi Google Drive
 * =========================================================================
 */

function getOrCreatePhotoFolder() {
  var folderName = CONFIG.DRIVE_FOLDER_NAME;
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    // Atur sharing agar file foto dapat dilihat di Web App
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  return folder;
}

/**
 * Handle Upload Foto dari Base64
 */
function handleUploadFoto(data) {
  var authUser = getAuthenticatedUser(data.authUserId);
  if (!authUser) {
    return jsonResponse({ success: false, code: 'SESSION_EXPIRED', message: 'Sesi Anda telah berakhir' });
  }
  
  var base64Data = data.base64Data;
  var fileName = data.fileName;
  var mimeType = data.mimeType || 'image/jpeg';
  
  if (!base64Data) {
    return jsonResponse({ success: false, message: 'Data foto base64 wajib dikirim' });
  }
  
  try {
    var folder = getOrCreatePhotoFolder();
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName || 'foto_senam.jpg');
    var file = folder.createFile(blob);
    
    // Set file permission to Anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();
    
    // Gunakan direct Google Drive view/thumbnail URL yang kompatibel di web
    var fileUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    recordAuditLog({
      ID_USER: authUser.ID_USER,
      NAMA_USER: authUser.NAMA,
      ROLE: authUser.ROLE,
      ACTION: 'UPLOAD_FOTO',
      TABLE_NAME: 'GOOGLE_DRIVE',
      RECORD_ID: fileId,
      DESCRIPTION: 'Upload foto dokumentasi: ' + file.getName()
    });
    
    return jsonResponse({
      success: true,
      message: 'Foto berhasil diunggah ke Google Drive',
      data: {
        fileId: fileId,
        fileUrl: fileUrl,
        fileName: file.getName(),
        downloadUrl: file.getDownloadUrl()
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Gagal mengunggah foto ke Google Drive: ' + err.toString() });
  }
}
