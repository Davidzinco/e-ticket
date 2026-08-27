import { db } from "@/libs/firebase/admin";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import { sendBuyerToGoogleSheets } from "@/libs/googleSheets";
import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(length = 20): string {
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[array[i] % ALPHABET.length];
  }
  return result;
}

export interface IssueTicketsParams {
  orderId: string;
  eventId: string;
  eventName: string;
  names: string[];
  niks: string[];
  email: string;
  totalTickets: number;
  transactionId: string;
  transactionTime: string;
  paymentType: string;
}

export async function issueTicketsForOrder(params: IssueTicketsParams): Promise<QrCodeInterface[]> {
  const {
    orderId,
    eventId,
    eventName,
    names,
    niks,
    email,
    totalTickets,
    transactionId,
    transactionTime,
    paymentType,
  } = params;

  // Check if tickets are already issued for this order (idempotent)
  const existingQrSnap = await db.collection("qr_detail").where("order_id", "==", orderId).get();
  
  if (!existingQrSnap.empty) {
    const existingQrs: QrCodeInterface[] = [];
    existingQrSnap.forEach((doc) => {
      existingQrs.push(doc.data() as QrCodeInterface);
    });
    return existingQrs;
  }

  const qrDetails: QrCodeInterface[] = [];

  // Generate unique QR codes for each ticket
  for (let i = 0; i < totalTickets; i++) {
    let qrcode: string = "";
    let exists = true;

    do {
      qrcode = generateCode();

      const existingCodeSnap = await db.collection("qr_detail").where("qr_code", "==", qrcode).get();

      exists = !existingCodeSnap.empty;
    } while (exists);

    const data: QrCodeInterface = {
      qr_code: qrcode,
      id_event: eventId,
      name: names[i] || "Guest",
      nik: niks[i] || "-",
      email: email,
      isScanned: false,
      transaction_id: transactionId,
      transaction_time: transactionTime,
      payment_type: paymentType,
      ticket: totalTickets,
      order_id: orderId,
      event_name: eventName,
      scanned_at: "-",
      action: "First Scan",
      scanned_by: "-",
    };

    qrDetails.push(data);
  }

  // Use a batch to write all documents
  const batch = db.batch();
  qrDetails.forEach((qrData) => {
    const qrRef = db.collection("qr_detail").doc();
    batch.set(qrRef, qrData);
  });
  
  await batch.commit();

  // Sync to Google Sheets
  if (qrDetails.length > 0) {
    try {
      await sendBuyerToGoogleSheets(qrDetails);
    } catch (err) {
      console.error("Google Sheets sync failed:", err);
    }
  }

  return qrDetails;
}
