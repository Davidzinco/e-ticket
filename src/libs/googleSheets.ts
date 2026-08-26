import { QrCodeInterface } from "@/app/components/interfaces/qrCode";

/**
 * Sends buyer and ticket data to the configured Google Apps Script Webhook.
 * Compatible with the "WEBSITE RESMI" sheet tab and Google Form header structure.
 */
export async function sendBuyerToGoogleSheets(
  items: QrCodeInterface[]
): Promise<{ success: boolean; message?: string; count?: number }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.trim() === "") {
    const msg = "GOOGLE_SHEETS_WEBHOOK_URL is not configured in .env. Skipping sync.";
    console.warn(msg);
    return { success: false, message: msg };
  }

  try {
    const payload = items.map((item) => ({
      transaction_time: item.transaction_time || new Date().toLocaleString("id-ID"),
      timestamp: item.transaction_time || new Date().toLocaleString("id-ID"),
      email: item.email || "-",
      email_address: item.email || "-",
      name: item.name || "-",
      nama_pembeli_pertama: item.name || "-",
      nama_lengkap: item.name || "-",
      nik: item.nik || "-",
      nik_utama: item.nik || "-",
      telepon: "-",
      phone: "-",
      event_name: item.event_name || "Bhima Night Carnival 2026",
      kategori_tiket: item.event_name || "Festival",
      kategori_detail: item.event_name || "Festival",
      ticket: item.ticket || 1,
      jumlah_tiket: item.ticket || 1,
      qr_code: item.qr_code || "-",
      kode_tiket: item.qr_code || "-",
      order_id: item.order_id || "-",
      transaction_id: item.transaction_id || "-",
      isScanned: Boolean(item.isScanned),
      kehadiran: Boolean(item.isScanned),
      waktu_scan: item.scanned_at || "-",
    }));

    console.log(
      `[Google Sheets Sync] Sending ${payload.length} ticket(s) to webhook: ${webhookUrl}`
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const responseText = await response.text();
    console.log(`[Google Sheets Sync] Webhook Response (HTTP ${response.status}):`, responseText);

    if (response.ok) {
      return {
        success: true,
        message: "Sinkronisasi ke Google Sheets berhasil!",
        count: items.length,
      };
    } else {
      return {
        success: false,
        message: `Gagal mengirim data ke Google Sheets (HTTP ${response.status})`,
      };
    }
  } catch (error) {
    console.error("[Google Sheets Sync] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan jaringan saat sync.",
    };
  }
}

/**
 * Updates a single ticket scan attendance status in Google Sheets in real-time.
 */
export async function updateTicketScanInGoogleSheets(
  qrCode: string,
  scannedAt: string,
  isScanned: boolean = true
): Promise<{ success: boolean; message?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.trim() === "") {
    return { success: false, message: "GOOGLE_SHEETS_WEBHOOK_URL is not configured." };
  }

  try {
    const payload = {
      action: "update_scan",
      qr_code: qrCode,
      kode_tiket: qrCode,
      scanned_at: scannedAt,
      waktu_scan: scannedAt,
      isScanned: isScanned,
      kehadiran: isScanned,
    };

    console.log(`[Google Sheets Real-Time Scan Update] Updating QR: ${qrCode} -> ${scannedAt}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const responseText = await response.text();
    console.log(`[Google Sheets Scan Update Response]:`, responseText);
    return { success: response.ok, message: responseText };
  } catch (error) {
    console.error("[Google Sheets Scan Update] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update scan on Google Sheets",
    };
  }
}
