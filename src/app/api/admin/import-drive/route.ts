import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, verifyAdminAccessCode } from "@/libs/adminAuth";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";

export const dynamic = "force-dynamic";

interface ImportTicketInput {
  qr_code: string;
  kategori?: string;
  event_name?: string;
  filename?: string;
  isScanned?: boolean;
  scanned_at?: string;
  name?: string;
  nik?: string;
  email?: string;
}

function cleanTicketCode(rawCode: string): string {
  if (!rawCode) return "";
  let code = rawCode.trim();
  code = code.replace(/\.pdf$/i, "");
  code = code.replace(/^e[-_]?ticket[-_]?/i, "");
  code = code.replace(/^e[-_]?coupon[-_]?/i, "");
  code = code.replace(/^e[-_]?kupon[-_]?/i, "");
  code = code.replace(/^ticket[-_]?/i, "");
  code = code.replace(/^coupon[-_]?/i, "");
  code = code.replace(/^kupon[-_]?/i, "");
  return code.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isSessionAuth = verifyAdminSessionToken(token);

    // Also support secret API key authentication from Google Apps Script
    const secret = body.secret || req.headers.get("x-api-key") || "";
    const isSecretAuth =
      Boolean(secret) &&
      (verifyAdminAccessCode(secret) ||
        secret === process.env.ADMIN_SESSION_SECRET ||
        secret === process.env.ADMIN_ACCESS_CODE);

    if (!isSessionAuth && !isSecretAuth) {
      // If running in development without strict secret, check if tickets array is valid
      const isDev = process.env.NODE_ENV !== "production";
      if (!isDev) {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Kredensial admin diperlukan." },
          { status: 401 }
        );
      }
    }

    const rawTickets: ImportTicketInput[] = Array.isArray(body.tickets)
      ? body.tickets
      : body.ticket
      ? [body.ticket]
      : [];

    if (rawTickets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data tiket yang dikirim." },
        { status: 400 }
      );
    }

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      return NextResponse.json(
        {
          success: false,
          message: "Firebase Admin tidak terkonfigurasi pada server.",
        },
        { status: 500 }
      );
    }

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // Process in batches of 400 (Firestore batch max is 500)
    const BATCH_SIZE = 400;
    for (let i = 0; i < rawTickets.length; i += BATCH_SIZE) {
      const chunk = rawTickets.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const item of chunk) {
        const cleanCode = cleanTicketCode(item.qr_code || item.filename || "");
        if (!cleanCode) {
          skippedCount++;
          continue;
        }

        const kategori = item.kategori || "Festival";
        const eventName = item.event_name || `Bhima Night Carnival 2026 (${kategori})`;

        // Check if ticket with this qr_code already exists
        const existingSnap = await db
          .collection("qr_detail")
          .where("qr_code", "==", cleanCode)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          const docSnap = existingSnap.docs[0];
          const existingData = docSnap.data() as QrCodeInterface;

          // Don't overwrite if it was already scanned
          if (!existingData.isScanned && item.isScanned) {
            batch.update(docSnap.ref, {
              isScanned: true,
              scanned_at: item.scanned_at || new Date().toLocaleString("id-ID"),
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Insert new ticket record
          const newDocRef = db.collection("qr_detail").doc();
          const newTicketData: Partial<QrCodeInterface> = {
            name: item.name || "Pemegang Kupon/Tiket Offline",
            email: item.email || "-",
            nik: item.nik || "-",
            qr_code: cleanCode,
            event_name: eventName,
            ticket: 1,
            isScanned: Boolean(item.isScanned),
            scanned_at: item.scanned_at || "-",
            action: "First Scan",
            scanned_by: "-",
            payment_type: "GOOGLE_DRIVE_OFFLINE",
            order_id: "OFFLINE-DRIVE",
            transaction_id: `DRIVE-${cleanCode}`,
            transaction_time: new Date().toLocaleString("id-ID"),
          };

          batch.set(newDocRef, newTicketData);
          insertedCount++;
        }
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Proses import selesai: ${insertedCount} baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} dilewati.`,
      total: rawTickets.length,
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("POST /api/admin/import-drive error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Terjadi kesalahan server saat import.",
      },
      { status: 500 }
    );
  }
}
