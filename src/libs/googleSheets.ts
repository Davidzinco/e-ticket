import { QrCodeInterface } from "@/app/components/interfaces/qrCode";

/**
 * Sends buyer and ticket data to the configured Google Apps Script Webhook.
 * Runs asynchronously and fails gracefully without blocking primary workflows.
 */
export async function sendBuyerToGoogleSheets(items: QrCodeInterface[]): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.trim() === "") {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL is not configured. Skipping Google Sheets sync.");
    return false;
  }

  try {
    const payload = items.map((item) => ({
      transaction_time: item.transaction_time || new Date().toLocaleString("id-ID"),
      order_id: item.order_id || "-",
      transaction_id: item.transaction_id || "-",
      name: item.name || "-",
      nik: item.nik || "-",
      email: item.email || "-",
      event_name: item.event_name || "-",
      qr_code: item.qr_code || "-",
      isScanned: item.isScanned || false,
    }));

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to push data to Google Sheets: HTTP status ${response.status}`);
      return false;
    }

    console.log(`Successfully synced ${items.length} item(s) to Google Sheets.`);
    return true;
  } catch (error) {
    console.error("Error sending data to Google Sheets Webhook:", error);
    return false;
  }
}
