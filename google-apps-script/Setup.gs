/**
 * =========================================================================
 * SETUP.GS - Inisialisasi Database, Sheets, Folder Drive & Akun Admin Awal
 * =========================================================================
 */

/**
 * Jalankan fungsi ini sekali saat pertama kali menyiapkan Google Spreadsheet.
 * Menu: Run -> setupDatabase()
 */
function setupDatabase() {
  var ss = getSpreadsheet();
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  
  // 1. SHEET USERS
  var userSheet = getSheet(CONFIG.SHEET_NAMES.USERS);
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow([
      'ID_USER', 'NAMA', 'USERNAME', 'PASSWORD_HASH', 'ROLE', 
      'ID_DESA', 'NAMA_DESA', 'STATUS', 'CREATED_AT', 'UPDATED_AT'
    ]);
    userSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#E2E8F0');
    
    // Akun Default
    var adminPassHash = hashPassword('admin123');
    var koordPassHash = hashPassword('koordinator123');
    var kaderPassHash = hashPassword('kader123');
    
    userSheet.appendRow([
      'USR-0001', 'Administrator KORMI', 'admin', adminPassHash, 'Admin',
      'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr
    ]);
    userSheet.appendRow([
      'USR-0002', 'Hj. Siti Koordinator', 'koordinator', koordPassHash, 'Koordinator',
      'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr
    ]);
    userSheet.appendRow([
      'USR-0003', 'Kader Senam Darmaraja', 'kader_darmaraja', kaderPassHash, 'Kader',
      'DSA-0001', 'Darmaraja', 'Aktif', nowStr, nowStr
    ]);
  }
  
  // 2. SHEET DESA
  var desaSheet = getSheet(CONFIG.SHEET_NAMES.DESA);
  if (desaSheet.getLastRow() === 0) {
    desaSheet.appendRow(['ID_DESA', 'NAMA_DESA', 'STATUS', 'CREATED_AT', 'UPDATED_AT']);
    desaSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E2E8F0');
    
    var daftarDesa = [
      'Darmaraja', 'Cikeusi', 'Tarunajaya', 'Sukamenak', 
      'Neglasari', 'Cieunteung', 'Ranggon', 'Pakualam', 
      'Karangpakuan', 'Darmajaya', 'Cipeuteuy', 'Neglasari'
    ];
    
    for (var d = 0; d < daftarDesa.length; d++) {
      var dId = 'DSA-' + ('000' + (d + 1)).slice(-4);
      desaSheet.appendRow([dId, daftarDesa[d], 'Aktif', nowStr, nowStr]);
    }
  }
  
  // 3. SHEET JENIS_SENAM
  var jsSheet = getSheet(CONFIG.SHEET_NAMES.JENIS_SENAM);
  if (jsSheet.getLastRow() === 0) {
    jsSheet.appendRow(['ID_JENIS', 'NAMA_JENIS', 'STATUS', 'CREATED_AT', 'UPDATED_AT']);
    jsSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E2E8F0');
    
    var defaultJenis = [
      'Senam Kecamatan Minggu',
      'Senam Kecamatan Jumat',
      'Senam Desa'
    ];
    
    for (var j = 0; j < defaultJenis.length; j++) {
      var jId = 'JS-' + ('000' + (j + 1)).slice(-4);
      jsSheet.appendRow([jId, defaultJenis[j], 'Aktif', nowStr, nowStr]);
    }
  }
  
  // 4. SHEET LAPORAN_SENAM
  var lapSheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  if (lapSheet.getLastRow() === 0) {
    lapSheet.appendRow([
      'ID_LAPORAN', 'ID_DESA', 'NAMA_DESA', 'ID_KADER', 'NAMA_KADER', 
      'TANGGAL', 'JUMLAH_PESERTA', 'JENIS_SENAM', 'STATUS_ABSENSI', 
      'FOTO_URL', 'FOTO_FILE_ID', 'CAPTION_FOTO', 'CREATED_AT', 'UPDATED_AT'
    ]);
    lapSheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#E2E8F0');
  }
  
  // 5. SHEET AUDIT_LOG
  var auditSheet = getSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
  if (auditSheet.getLastRow() === 0) {
    auditSheet.appendRow([
      'ID_LOG', 'TIMESTAMP', 'ID_USER', 'NAMA_USER', 'ROLE', 
      'ACTION', 'TABLE_NAME', 'RECORD_ID', 'DESCRIPTION'
    ]);
    auditSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#E2E8F0');
  }
  
  // 6. FOLDER GOOGLE DRIVE
  getOrCreatePhotoFolder();
  
  Logger.log('Setup Database KORMI Darmaraja Selesai.');
  return 'Setup Database Selesai! Admin awal: admin / admin123';
}

/**
 * =========================================================================
 * PERINGATAN: Fungsi seedDemoData() HANYA digunakan saat testing & development!
 * JANGAN jalankan pada lingkungan produksi aktif jika data riil sudah ada.
 * =========================================================================
 */
function seedDemoData() {
  var lapSheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  if (lapSheet.getLastRow() > 1) {
    Logger.log('Sheet laporan sudah memiliki data. Seeding dibatalkan.');
    return 'Sheet sudah berisi data.';
  }
  
  var now = new Date();
  var sampleData = [
    { desa: 'DSA-0001', namaDesa: 'Darmaraja', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-02', pes: 45, js: 'Senam Kecamatan Minggu', abs: 'Hadir', cap: 'Senam bersama Minggu pagi di Lapang Darmaraja' },
    { desa: 'DSA-0002', namaDesa: 'Cikeusi', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-04', pes: 32, js: 'Senam Desa', abs: 'Hadir', cap: 'Kegiatan senam bugar lansia dan ibu-ibu desa Cikeusi' },
    { desa: 'DSA-0003', namaDesa: 'Tarunajaya', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-07', pes: 28, js: 'Senam Kecamatan Jumat', abs: 'Hadir', cap: 'Senam Jumat berkah sehat gembira' },
    { desa: 'DSA-0004', namaDesa: 'Sukamenak', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-11', pes: 38, js: 'Senam Desa', abs: 'Hadir', cap: 'Senam aerobik ceria warga Sukamenak' },
    { desa: 'DSA-0005', namaDesa: 'Neglasari', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-14', pes: 25, js: 'Senam Desa', abs: 'Hadir', cap: 'Senam rutin sehat desa Neglasari' },
    { desa: 'DSA-0001', namaDesa: 'Darmaraja', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-16', pes: 50, js: 'Senam Kecamatan Minggu', abs: 'Hadir', cap: 'Senam akbar kemerdekaan KORMI' },
    { desa: 'DSA-0006', namaDesa: 'Cieunteung', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-18', pes: 30, js: 'Senam Desa', abs: 'Hadir', cap: 'Senam kreasi lansia sehat' },
    { desa: 'DSA-0007', namaDesa: 'Ranggon', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-21', pes: 22, js: 'Senam Kecamatan Jumat', abs: 'Hadir', cap: 'Senam Jumat pagi penuh semangat' },
    { desa: 'DSA-0008', namaDesa: 'Pakualam', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-23', pes: 35, js: 'Senam Desa', abs: 'Hadir', cap: 'Senam sehat ceria pesisir Jatigede Pakualam' },
    { desa: 'DSA-0009', namaDesa: 'Karangpakuan', kader: 'USR-0003', namaKader: 'Kader Senam Darmaraja', tgl: '2026-08-25', pes: 29, js: 'Senam Desa', abs: 'Hadir', cap: 'Senam SKJ dan senam jantung sehat' }
  ];
  
  for (var i = 0; i < sampleData.length; i++) {
    var item = sampleData[i];
    var idLap = 'LAP-' + item.tgl.replace(/-/g, '') + '-' + ('000' + (i + 1)).slice(-4);
    var nowStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var dummyPhoto = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80';
    
    lapSheet.appendRow([
      idLap,
      item.desa,
      item.namaDesa,
      item.kader,
      item.namaKader,
      item.tgl,
      item.pes,
      item.js,
      item.abs,
      dummyPhoto,
      'demo-file-id-' + (i + 1),
      item.cap,
      nowStr,
      nowStr
    ]);
  }
  
  Logger.log('Demo data berhasil di-seed.');
  return 'Demo data berhasil di-seed!';
}
