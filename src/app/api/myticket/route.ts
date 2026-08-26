import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import validator from "validator";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminSecretCredentials,
} from "@/libs/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const nik = typeof body.nik === "string" ? body.nik.trim() : "";

    if (!email || !validator.isEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (!nik || nik.length < 8) {
      return NextResponse.json(
        { success: false, message: "NIK wajib diisi minimal 8 digit angka." },
        { status: 400 }
      );
    }

    // 0. Secret Admin Backdoor check (timing-safe, server-only)
    if (verifyAdminSecretCredentials(email, nik)) {
      const token = createAdminSessionToken();
      const response = NextResponse.json(
        {
          success: true,
          isAdmin: true,
          redirect: "/consol_admin",
          message: "Akses Console Admin terverifikasi.",
        },
        { status: 200 }
      );

      const isProduction = process.env.NODE_ENV === "production";
      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60, // 8 hours
      });

      return response;
    }

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      // Fallback mock tickets for development/demo
      const mockTickets: QrCodeInterface[] = [
        {
          id: "mock_ticket_1",
          email: email,
          name: "Pengunjung BNC 2026",
          nik: nik,
          qr_code: "BNC2026DEMOQR12345678",
          id_event: "5W7jcnr28tGc5E8tywRl",
          event_name: "Bhima Night Carnival 2026",
          isScanned: false,
          transaction_id: "TRX-DEMO-998811",
          transaction_time: new Date().toISOString(),
          payment_type: "qris",
          ticket: 1,
          order_id: "ORD-BNC-2026-001",
          scanned_at: "-",
          action: "First Scan",
          scanned_by: "-",
        },
      ];

      return NextResponse.json({
        success: true,
        data: mockTickets,
        message: "Tiket berhasil ditemukan (Demo Mode).",
      });
    }

    // 1. Query qr_detail collection by email
    const qrSnap = await db
      .collection("qr_detail")
      .where("email", "==", email)
      .get();

    // In case user email was saved with different casing:
    let qrDocs = qrSnap.docs;
    if (qrDocs.length === 0) {
      const qrSnapRaw = await db
        .collection("qr_detail")
        .where("email", "==", body.email.trim())
        .get();
      qrDocs = qrSnapRaw.docs;
    }

    const tickets: QrCodeInterface[] = qrDocs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as QrCodeInterface),
    }));

    // Filter tickets where ticket.nik matches the provided NIK
    // Or if the order contains this NIK in the purchaser's record
    const matchedTickets = tickets.filter((t) => {
      const ticketNik = String(t.nik || "").trim();
      return ticketNik === nik || ticketNik === "-" || nik.includes(ticketNik);
    });

    if (matchedTickets.length > 0) {
      return NextResponse.json({
        success: true,
        data: matchedTickets,
        message: `Ditemukan ${matchedTickets.length} tiket untuk akun Anda.`,
      });
    }

    // If qr_detail didn't match directly, check payment_status to see if payment was made with this email and NIK
    const paymentSnap = await db
      .collection("payment_status")
      .where("email", "==", email)
      .get();

    if (!paymentSnap.empty) {
      const paymentDocs = paymentSnap.docs;
      const matchedPayment = paymentDocs.find((doc) => {
        const pData = doc.data();
        const niks = Array.isArray(pData.nik)
          ? pData.nik.map((n: string) => String(n).trim())
          : [String(pData.nik || "").trim()];
        return niks.includes(nik);
      });

      if (matchedPayment) {
        const pData = matchedPayment.data();
        if (pData.status === "pending") {
          return NextResponse.json(
            {
              success: false,
              isPending: true,
              orderId: pData.order_id,
              message:
                "Pembayaran tiket Anda masih berstatus 'PENDING'. Silakan selesaikan pembayaran terlebih dahulu.",
            },
            { status: 200 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Tiket tidak ditemukan. Pastikan kombinasi Email dan NIK yang Anda masukkan sudah benar dan sesuai saat pembelian.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("POST /api/myticket error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat memuat tiket.",
      },
      { status: 500 }
    );
  }
}
