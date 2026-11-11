/**
 * =========================================================================
 * DASHBOARD.GS - Agregasi Statistik, Senam Terbanyak, Senam Teraktif & 10 Laporan
 * =========================================================================
 */

function normalizeRowDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  var str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  var d = new Date(str);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return str;
}

function handleGetDashboard(params) {
  var stats = getAggregatedStats(params);
  var terbanyak = getAggregatedSenamTerbanyak(params);
  var teraktif = getAggregatedSenamTeraktif(params);
  var recent = getRecent10Reports(params);
  
  return jsonResponse({
    success: true,
    data: {
      stats: stats,
      senamTerbanyak: terbanyak,
      senamTeraktif: teraktif,
      recentReports: recent
    }
  });
}

function handleGetSenamTerbanyak(params) {
  var data = getAggregatedSenamTerbanyak(params);
  return jsonResponse({ success: true, data: data });
}

function handleGetSenamTeraktif(params) {
  var data = getAggregatedSenamTeraktif(params);
  return jsonResponse({ success: true, data: data });
}

function getAggregatedStats(params) {
  var lapSheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  var lapValues = lapSheet.getDataRange().getValues();
  
  var desaSheet = getSheet(CONFIG.SHEET_NAMES.DESA);
  var desaValues = desaSheet.getDataRange().getValues();
  
  var userSheet = getSheet(CONFIG.SHEET_NAMES.USERS);
  var userValues = userSheet.getDataRange().getValues();
  
  var totalDesa = Math.max(0, desaValues.length - 1);
  var totalKader = 0;
  
  // Hitung total kader aktif
  if (userValues.length > 1) {
    var roleIdx = userValues[0].indexOf('ROLE');
    var statusIdx = userValues[0].indexOf('STATUS');
    for (var u = 1; u < userValues.length; u++) {
      if (userValues[u][roleIdx] === 'Kader' && String(userValues[u][statusIdx]).toLowerCase() !== 'nonaktif') {
        totalKader++;
      }
    }
  }
  
  var totalKegiatan = 0;
  var totalPeserta = 0;
  var kegiatanBulanIni = 0;
  var pesertaBulanIni = 0;
  
  var now = new Date();
  var currentYearMonth = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM');
  
  if (lapValues.length > 1) {
    var tglIdx = lapValues[0].indexOf('TANGGAL');
    var pesIdx = lapValues[0].indexOf('JUMLAH_PESERTA');
    var absIdx = lapValues[0].indexOf('STATUS_ABSENSI');
    
    for (var i = 1; i < lapValues.length; i++) {
      var row = lapValues[i];
      var statusAbsensi = String(row[absIdx] || 'Hadir');
      
      // Hitung kegiatan yang dilaksanakan (Hadir)
      if (statusAbsensi === 'Hadir') {
        totalKegiatan++;
        var peserta = parseInt(row[pesIdx], 10) || 0;
        totalPeserta += peserta;
        
        var rowTgl = normalizeRowDate(row[tglIdx]);
        if (rowTgl.indexOf(currentYearMonth) === 0) {
          kegiatanBulanIni++;
          pesertaBulanIni += peserta;
        }
      }
    }
  }
  
  return {
    totalKegiatan: totalKegiatan,
    totalPeserta: totalPeserta,
    totalDesa: totalDesa,
    totalKader: totalKader,
    kegiatanBulanIni: kegiatanBulanIni,
    pesertaBulanIni: pesertaBulanIni
  };
}

function getAggregatedSenamTerbanyak(params) {
  var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var tglIdx = headers.indexOf('TANGGAL');
  var desaIdIdx = headers.indexOf('ID_DESA');
  var desaNamaIdx = headers.indexOf('NAMA_DESA');
  var jsIdx = headers.indexOf('JENIS_SENAM');
  var pesIdx = headers.indexOf('JUMLAH_PESERTA');
  var absIdx = headers.indexOf('STATUS_ABSENSI');
  
  var startDate = (params.startDate && params.startDate !== 'undefined' && params.startDate !== 'null') ? params.startDate : '';
  var endDate = (params.endDate && params.endDate !== 'undefined' && params.endDate !== 'null') ? params.endDate : '';
  var filterJenis = (params.jenisSenam && params.jenisSenam !== 'undefined' && params.jenisSenam !== 'null') ? params.jenisSenam : '';
  var filterDesa = (params.idDesa && params.idDesa !== 'undefined' && params.idDesa !== 'null') ? params.idDesa : '';
  
  var desaMap = {};
  
  // Inisialisasi default dari Master Desa
  var desaSheet = getSheet(CONFIG.SHEET_NAMES.DESA);
  var dValues = desaSheet.getDataRange().getValues();
  if (dValues.length > 1) {
    for (var d = 1; d < dValues.length; d++) {
      var dId = String(dValues[d][0]);
      var dNama = String(dValues[d][1]);
      if (!filterDesa || filterDesa === 'Semua Desa' || filterDesa === dId) {
        desaMap[dNama] = {
          idDesa: dId,
          namaDesa: dNama,
          totalPeserta: 0,
          totalKegiatan: 0,
          jenisSenam: filterJenis && filterJenis !== 'Semua Jenis' ? filterJenis : 'Semua Senam'
        };
      }
    }
  }
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var abs = String(row[absIdx] || 'Hadir');
    if (abs !== 'Hadir') continue;

    var tgl = normalizeRowDate(row[tglIdx]);
    if (startDate && tgl < startDate) continue;
    if (endDate && tgl > endDate) continue;
    
    var js = String(row[jsIdx] || '');
    if (filterJenis && filterJenis !== 'Semua Jenis' && js !== filterJenis) continue;
    
    var dId = String(row[desaIdIdx] || '');
    var dNama = String(row[desaNamaIdx] || '');
    if (filterDesa && filterDesa !== 'Semua Desa' && dId !== filterDesa) continue;
    
    var peserta = parseInt(row[pesIdx], 10) || 0;
    
    if (!desaMap[dNama]) {
      desaMap[dNama] = {
        idDesa: dId,
        namaDesa: dNama,
        totalPeserta: 0,
        totalKegiatan: 0,
        jenisSenam: js
      };
    }
    desaMap[dNama].totalPeserta += peserta;
    desaMap[dNama].totalKegiatan += 1;
  }
  
  var result = [];
  for (var key in desaMap) {
    result.push({
      idDesa: desaMap[key].idDesa,
      namaDesa: desaMap[key].namaDesa,
      totalPeserta: desaMap[key].totalPeserta,
      totalKegiatan: desaMap[key].totalKegiatan,
      jenisSenam: desaMap[key].jenisSenam
    });
  }
  
  // Urutkan dari desa dengan jumlah akumulasi peserta TERBANYAK (Kompetisi Desa)
  result.sort(function(a, b) {
    if (b.totalPeserta !== a.totalPeserta) {
      return b.totalPeserta - a.totalPeserta;
    }
    return b.totalKegiatan - a.totalKegiatan;
  });
  
  return result;
}

function getAggregatedSenamTeraktif(params) {
  var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var tglIdx = headers.indexOf('TANGGAL');
  var desaIdIdx = headers.indexOf('ID_DESA');
  var desaNamaIdx = headers.indexOf('NAMA_DESA');
  var jsIdx = headers.indexOf('JENIS_SENAM');
  var pesIdx = headers.indexOf('JUMLAH_PESERTA');
  var absIdx = headers.indexOf('STATUS_ABSENSI');
  
  var startDate = (params.startDate && params.startDate !== 'undefined' && params.startDate !== 'null') ? params.startDate : '';
  var endDate = (params.endDate && params.endDate !== 'undefined' && params.endDate !== 'null') ? params.endDate : '';
  var filterDesa = (params.idDesa && params.idDesa !== 'undefined' && params.idDesa !== 'null') ? params.idDesa : '';
  var filterJenis = (params.jenisSenam && params.jenisSenam !== 'undefined' && params.jenisSenam !== 'null') ? params.jenisSenam : '';
  
  var desaMap = {};
  
  // Inisialisasi semua desa dari sheet DESA
  var desaSheet = getSheet(CONFIG.SHEET_NAMES.DESA);
  var dValues = desaSheet.getDataRange().getValues();
  if (dValues.length > 1) {
    for (var d = 1; d < dValues.length; d++) {
      var dId = String(dValues[d][0]);
      var dNama = String(dValues[d][1]);
      if (!filterDesa || filterDesa === 'Semua Desa' || filterDesa === dId) {
        desaMap[dNama] = {
          idDesa: dId,
          namaDesa: dNama,
          totalKegiatan: 0,
          totalPeserta: 0
        };
      }
    }
  }
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var abs = String(row[absIdx] || 'Hadir');
    if (abs !== 'Hadir') continue;
    
    var tgl = normalizeRowDate(row[tglIdx]);
    if (startDate && tgl < startDate) continue;
    if (endDate && tgl > endDate) continue;
    
    var js = String(row[jsIdx] || '');
    if (filterJenis && filterJenis !== 'Semua Jenis' && js !== filterJenis) continue;
    
    var dId = String(row[desaIdIdx] || '');
    var dNama = String(row[desaNamaIdx] || '');
    if (filterDesa && filterDesa !== 'Semua Desa' && dId !== filterDesa) continue;
    
    if (!desaMap[dNama]) {
      desaMap[dNama] = {
        idDesa: dId,
        namaDesa: dNama,
        totalKegiatan: 0,
        totalPeserta: 0
      };
    }
    
    desaMap[dNama].totalKegiatan += 1;
    desaMap[dNama].totalPeserta += (parseInt(row[pesIdx], 10) || 0);
  }
  
  var list = [];
  for (var key in desaMap) {
    list.push(desaMap[key]);
  }
  
  // Urutkan dari kegiatan terbanyak
  list.sort(function(a, b) {
    if (b.totalKegiatan !== a.totalKegiatan) {
      return b.totalKegiatan - a.totalKegiatan;
    }
    return b.totalPeserta - a.totalPeserta;
  });
  
  return list;
}

function getRecent10Reports(params) {
  var sheet = getSheet(CONFIG.SHEET_NAMES.LAPORAN_SENAM);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var list = [];
  
  // Baca dari baris paling bawah (terbaru) maksimal 10
  var count = 0;
  for (var i = values.length - 1; i >= 1 && count < 10; i--) {
    var row = values[i];
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    list.push(obj);
    count++;
  }
  
  return list;
}
