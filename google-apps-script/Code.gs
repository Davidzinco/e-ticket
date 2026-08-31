/**
 * ============================================================================
 * 🎟️ E-TICKET SMASA — GOOGLE APPS SCRIPT (DRIVE & SHEETS INTEGRATION)
 * ============================================================================
 *
 * CARA PEMASANGAN:
 * 1. Buka Google Spreadsheet target.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode default dan tempelkan seluruh kode ini.
 * 4. Sesuaikan konfigurasi WEB_APP_URL di bawah dengan domain web Anda.
 * 5. Simpan (Ctrl+S) dan klik "Terapkan" (Deploy) > "Kelola Penerapan" (Manage Deployments)
 *    atau "Penerapan Baru" (New Deployment) sebagai Web App (Akses: Anyone).
 * 6. Refresh spreadsheet Anda untuk melihat menu "🎟️ E-Ticket SMASA Tools".
 */

// ==========================================
// ⚙️ KONFIGURASI UTAMA
// ==========================================
const CONFIG = {
  // Nama tab di Google Sheets
  TAB_DATA_DRIVE: "DATA DRIVE",
  TAB_WEBSITE_RESMI: "WEBSITE RESMI",

  // URL API Web Next.js Anda (Ganti dengan URL production / Ngrok Anda)
  // Contoh: "https://tiket.smasa.sch.id/api/admin/import-drive"
  WEB_API_URL: "https://your-domain.com/api/admin/import-drive",

  // Secret API Key opsional untuk keamanan tambahan
  API_SECRET_KEY: "",

  // Konfigurasi Folder Google Drive dan Pemetaan Kategori
  DRIVE_FOLDERS: [
    {
      folderName: "E-TICKET BHIMA NIGHT CARNIVAL VIP",
      kategori: "VIP",
      eventName: "Bhima Night Carnival 2026 (VIP)",
    },
    {
      folderName: "E-COUPON BHIMA NIGHT CARNIVAL FESTIVAL",
      kategori: "Coupon Festival",
      eventName: "Bhima Night Carnival 2026 (Coupon Festival)",
    },
    {
      folderName: "E-TICKET BHIMA NIGHT CARNIVAL FESTIVAL",
      kategori: "Festival",
      eventName: "Bhima Night Carnival 2026 (Festival)",
    },
  ],
};

/**
 * Membuat Menu Kustom saat Spreadsheet dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🎟️ E-Ticket SMASA Tools")
    .addItem("1. 📂 Baca Google Drive & Isi Tab 'DATA DRIVE'", "menuScanDriveAndPopulate")
    .addItem("2. 🚀 Sinkronkan Tab 'DATA DRIVE' ke Firebase", "menuSyncDriveToFirebase")
    .addSeparator()
    .addItem("3. 🛠️ Buat / Reset Header Tab 'DATA DRIVE'", "setupDataDriveSheet")
    .addToUi();
}

/**
 * Helper: Membersihkan nama file PDF menjadi kode tiket bersih
 * Contoh: "E-Ticket-BNC-20260824-154557.pdf" -> "BNC-20260824-154557"
 * Contoh: "E-Coupon-BNC-20260824-154557.pdf" -> "BNC-20260824-154557"
 */
function cleanTicketCode(filename) {
  if (!filename) return "";
  let code = filename.trim();
  
  // Hapus ekstensi .pdf
  code = code.replace(/\.pdf$/i, "");
  
  // Hapus prefix E-Ticket-, E-Coupon-, Ticket-, Coupon- (case-insensitive)
  code = code.replace(/^e[-_]?ticket[-_]?/i, "");
  code = code.replace(/^e[-_]?coupon[-_]?/i, "");
  code = code.replace(/^e[-_]?kupon[-_]?/i, "");
  code = code.replace(/^ticket[-_]?/i, "");
  code = code.replace(/^coupon[-_]?/i, "");
  code = code.replace(/^kupon[-_]?/i, "");
  
  return code.trim();
}

/**
 * Menyiapkan format Sheet Tab "DATA DRIVE"
 */
function setupDataDriveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.TAB_DATA_DRIVE);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TAB_DATA_DRIVE);
  }

  const headers = [
    "Timestamp",
    "Kategori",
    "Kode Tiket",
    "Nama File Asli",
    "Kehadiran",
    "Waktu Scan",
    "Status Sync Firebase",
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
  sheet.setFrozenRows(1);

  return sheet;
}

/**
 * Menu 1: Memindai Folder Google Drive dan Mengisi Tab "DATA DRIVE"
 */
function menuScanDriveAndPopulate() {
  const ui = SpreadsheetApp.getUi();
  const sheet = setupDataDriveSheet();
  
  const lastRow = sheet.getLastRow();
  const existingCodes = new Set();

  if (lastRow > 1) {
    const existingData = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    existingData.forEach((row) => {
      if (row[0]) existingCodes.add(String(row[0]).trim());
    });
  }

  let totalFound = 0;
  let newAdded = 0;
  const newRows = [];
  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  CONFIG.DRIVE_FOLDERS.forEach((cfg) => {
    const folders = DriveApp.getFoldersByName(cfg.folderName);
    
    while (folders.hasNext()) {
      const folder = folders.next();
      const files = folder.getFiles();

      while (files.hasNext()) {
        const file = files.next();
        const filename = file.getName();

        // Hanya proses file PDF atau file tiket
        if (filename.toLowerCase().endsWith(".pdf") || filename.includes("BNC")) {
          totalFound++;
          const cleanCode = cleanTicketCode(filename);

          if (cleanCode && !existingCodes.has(cleanCode)) {
            existingCodes.add(cleanCode);
            newRows.push([
              nowStr,
              cfg.kategori,
              cleanCode,
              filename,
              false, // Kehadiran (Checkbox)
              "-",   // Waktu Scan
              "Belum Sync", // Status Sync
            ]);
            newAdded++;
          }
        }
      }
    }
  });

  if (newRows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
    
    // Set checkbox di kolom Kehadiran (Kolom 5 / E)
    sheet.getRange(startRow, 5, newRows.length, 1).insertCheckboxes();
  }

  ui.alert(
    "✅ Pembacaan Google Drive Selesai!",
    `Total file terdeteksi: ${totalFound}\nTiket baru ditambahkan: ${newAdded}\nTiket sebelumnya (skip): ${totalFound - newAdded}`,
    ui.ButtonSet.OK
  );
}

/**
 * Menu 2: Mengirim Data dari Tab "DATA DRIVE" ke Backend Firebase
 */
function menuSyncDriveToFirebase() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TAB_DATA_DRIVE);

  if (!sheet || sheet.getLastRow() <= 1) {
    ui.alert("Peringatan", "Tab 'DATA DRIVE' masih kosong. Jalankan Menu 1 terlebih dahulu.", ui.ButtonSet.OK);
    return;
  }

  let apiUrl = CONFIG.WEB_API_URL;
  if (!apiUrl || apiUrl.includes("your-domain.com")) {
    const input = ui.prompt(
      "Konfigurasi URL Website",
      "Masukkan URL website Anda (contoh: https://tiket.smasa.sch.id atau URL ngrok):",
      ui.ButtonSet.OK_CANCEL
    );
    if (input.getSelectedButton() !== ui.Button.OK || !input.getResponseText().trim()) {
      return;
    }
    apiUrl = input.getResponseText().trim().replace(/\/$/, "") + "/api/admin/import-drive";
  }

  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  const tickets = [];
  const rowIndices = [];

  data.forEach((row, idx) => {
    const kategori = row[1] || "Festival";
    const qrCode = String(row[2]).trim();
    const filename = row[3] || "";
    const isScanned = Boolean(row[4]);
    const scannedAt = row[5] || "-";

    if (qrCode) {
      tickets.push({
        qr_code: qrCode,
        kategori: kategori,
        event_name: `Bhima Night Carnival 2026 (${kategori})`,
        filename: filename,
        isScanned: isScanned,
        scanned_at: scannedAt,
      });
      rowIndices.push(idx + 2);
    }
  });

  if (tickets.length === 0) {
    ui.alert("Info", "Tidak ada kode tiket valid di tab 'DATA DRIVE'.", ui.ButtonSet.OK);
    return;
  }

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        tickets: tickets,
        secret: CONFIG.API_SECRET_KEY,
      }),
      muteHttpExceptions: true,
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      // Tandai status sync di spreadsheet
      const statusValues = Array(rowIndices.length).fill(["Tersinkron"]);
      sheet.getRange(2, 7, rowIndices.length, 1).setValues(statusValues);

      ui.alert(
        "🎉 Sukses Sinkronisasi Firebase!",
        `Berhasil mengirim ${tickets.length} tiket ke database Firebase.\nSemua QR code sekarang aktif dan siap di-scan!`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert("❌ Gagal Sinkronisasi", `Server merespon (HTTP ${responseCode}):\n${responseText}`, ui.ButtonSet.OK);
    }
  } catch (err) {
    ui.alert("❌ Terjadi Kesalahan Jaringan", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ============================================================================
 * 📡 WEBHOOK RECEIVER (doPost)
 * ============================================================================
 * Menangani:
 * 1. update_scan: Real-time scan dari Scanner Gate (/consol_admin/scan)
 *    Mencari di TAB 'WEBSITE RESMI' dan TAB 'DATA DRIVE'.
 * 2. Transaksi baru dari Website Resmi.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: "No post data received" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const rawData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ----------------------------------------------------
    // KASUS 1: Real-time Scan Attendance Update (action === "update_scan")
    // ----------------------------------------------------
    if (rawData.action === "update_scan") {
      const qrCode = String(rawData.qr_code || rawData.kode_tiket || "").trim();
      const scannedAt = rawData.scanned_at || rawData.waktu_scan || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
      const isScanned = rawData.isScanned !== undefined ? Boolean(rawData.isScanned) : true;

      let found = false;
      let matchedTab = "";

      // 1. Cek di Tab DATA DRIVE
      const driveSheet = ss.getSheetByName(CONFIG.TAB_DATA_DRIVE);
      if (driveSheet && driveSheet.getLastRow() > 1) {
        const driveCodes = driveSheet.getRange(2, 3, driveSheet.getLastRow() - 1, 1).getValues();
        for (let i = 0; i < driveCodes.length; i++) {
          if (String(driveCodes[i][0]).trim() === qrCode) {
            const rowIndex = i + 2;
            driveSheet.getRange(rowIndex, 5).setValue(isScanned); // Kolom Kehadiran
            driveSheet.getRange(rowIndex, 6).setValue(scannedAt); // Kolom Waktu Scan
            found = true;
            matchedTab = CONFIG.TAB_DATA_DRIVE;
            break;
          }
        }
      }

      // 2. Cek di Tab WEBSITE RESMI jika belum ketemu
      if (!found) {
        const officialSheet = ss.getSheetByName(CONFIG.TAB_WEBSITE_RESMI);
        if (officialSheet && officialSheet.getLastRow() > 1) {
          // Kolom 12 adalah Kode Tiket di WEBSITE RESMI
          const officialCodes = officialSheet.getRange(2, 12, officialSheet.getLastRow() - 1, 1).getValues();
          for (let j = 0; j < officialCodes.length; j++) {
            if (String(officialCodes[j][0]).trim() === qrCode) {
              const rowIndex = j + 2;
              officialSheet.getRange(rowIndex, 14).setValue(isScanned); // Kehadiran
              officialSheet.getRange(rowIndex, 15).setValue(scannedAt); // Waktu Scan
              found = true;
              matchedTab = CONFIG.TAB_WEBSITE_RESMI;
              break;
            }
          }
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: found ? `Scan updated in ${matchedTab}` : `Ticket ${qrCode} not found in sheets`,
          found: found,
          tab: matchedTab,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // KASUS 2: Tiket Pembeli Baru dari Website Resmi
    // ----------------------------------------------------
    const officialSheet = ss.getSheetByName(CONFIG.TAB_WEBSITE_RESMI) || ss.getSheets()[0];
    const items = Array.isArray(rawData) ? rawData : [rawData];

    items.forEach((item) => {
      officialSheet.appendRow([
        item.timestamp || item.transaction_time || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
        item.email_address || item.email || "-",
        "-", // Bukti Pembayaran
        item.nama_lengkap || item.name || "-",
        item.nik || item.nik_utama || "-",
        item.telepon || item.phone || "-",
        item.email || "-",
        item.kategori_tiket || item.event_name || "Festival",
        item.jumlah_tiket || item.ticket || 1,
        item.nama_pembeli_pertama || item.name || "-",
        item.kategori_detail || item.event_name || "Festival",
        item.kode_tiket || item.qr_code || "-",
        item.order_id || "-",
        Boolean(item.isScanned || item.kehadiran),
        item.waktu_scan || item.scanned_at || "-",
      ]);

      const lastRow = officialSheet.getLastRow();
      officialSheet.getRange(lastRow, 14).insertCheckboxes();
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: `Successfully appended ${items.length} ticket(s)` })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
