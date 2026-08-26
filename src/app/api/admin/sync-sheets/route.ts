import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/libs/adminAuth";
import { sendBuyerToGoogleSheets } from "@/libs/googleSheets";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!verifyAdminSessionToken(token)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Sesi admin diperlukan." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync_all"; // "sync_all" or "test"

    if (action === "test") {
      const testItem: QrCodeInterface = {
        id_event: "5W7jcnr28tGc5E8tywRl",
        name: "Pengujian Sync Admin",
        email: "test-admin@smasa.sch.id",
        nik: "3519999999999999",
        qr_code: `TEST-SYNC-${Date.now()}`,
        event_name: "Bhima Night Carnival 2026 (Test)",
        order_id: `ORD-TEST-${Date.now().toString().slice(-6)}`,
        transaction_id: `TRX-TEST-${Date.now()}`,
        transaction_time: new Date().toLocaleString("id-ID"),
        isScanned: false,
        payment_type: "manual_test",
        ticket: 1,
        scanned_at: "-",
        action: "First Scan",
        scanned_by: "-",
      };

      const result = await sendBuyerToGoogleSheets([testItem]);
      return NextResponse.json(result);
    }

    // Sync all tickets from Firestore qr_detail
    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      return NextResponse.json({
        success: false,
        message: "Firebase Admin tidak terkonfigurasi.",
      });
    }

    const qrSnap = await db.collection("qr_detail").get();
    if (qrSnap.empty) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada tiket di database yang perlu disinkronkan.",
        count: 0,
      });
    }

    const tickets: QrCodeInterface[] = qrSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as QrCodeInterface),
    }));

    const result = await sendBuyerToGoogleSheets(tickets);
    return NextResponse.json({
      ...result,
      count: tickets.length,
    });
  } catch (error) {
    console.error("POST /api/admin/sync-sheets error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memproses sinkronisasi.",
      },
      { status: 500 }
    );
  }
}
