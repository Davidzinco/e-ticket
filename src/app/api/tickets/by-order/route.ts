import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";

function serializeDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    if ("toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if ("seconds" in val && typeof (val as { seconds: number }).seconds === "number") {
      return new Date((val as { seconds: number }).seconds * 1000).toISOString();
    }
  }
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const orderId = searchParams.get("order_id")?.trim();

    if (!orderId || orderId.length < 3) {
      return NextResponse.json(
        { success: false, message: "Parameter order_id tidak valid." },
        { status: 400 }
      );
    }

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      // Mock data for local testing / demo mode without Firebase Admin credentials
      const mockTickets: QrCodeInterface[] = [
        {
          id: `mock_ticket_${orderId}_1`,
          email: "pengguna@gmail.com",
          name: "Pembeli BNC 2026",
          nik: "3519012345670001",
          qr_code: `BNC2026-${orderId}-01`,
          id_event: "5W7jcnr28tGc5E8tywRl",
          event_name: "Bhima Night Carnival 2026",
          isScanned: false,
          transaction_id: `TRX-${orderId}`,
          transaction_time: new Date().toISOString(),
          payment_type: "qris",
          ticket: 1,
          order_id: orderId,
          scanned_at: "-",
          action: "First Scan",
          scanned_by: "-",
        },
      ];

      return NextResponse.json({
        success: true,
        status: "settlement",
        order: {
          order_id: orderId,
          status: "settlement",
          email: "pengguna@gmail.com",
          nik: "3519012345670001",
          transaction_id: `TRX-${orderId}`,
          transaction_time: new Date().toISOString(),
          payment_type: "qris",
        },
        tickets: mockTickets,
      });
    }

    // 1. Fetch tickets from qr_detail by order_id
    const qrSnap = await db
      .collection("qr_detail")
      .where("order_id", "==", orderId)
      .get();

    if (!qrSnap.empty) {
      const tickets: QrCodeInterface[] = qrSnap.docs.map((doc) => {
        const d = doc.data() as QrCodeInterface;
        return {
          id: doc.id,
          email: d.email || "",
          isScanned: d.isScanned ?? false,
          scanned_by: d.scanned_by || "-",
          name: d.name || "-",
          nik: d.nik || "-",
          qr_code: d.qr_code || "",
          id_event: d.id_event || "",
          transaction_id: d.transaction_id || "-",
          transaction_time: serializeDate(d.transaction_time),
          payment_type: d.payment_type || "-",
          ticket: d.ticket || qrSnap.docs.length,
          order_id: d.order_id || orderId,
          event_name: d.event_name || "Bhima Night Carnival 2026",
          scanned_at: d.scanned_at || "-",
          action: d.action || "First Scan",
        };
      });

      const primary = tickets[0];

      return NextResponse.json({
        success: true,
        status: "settlement",
        order: {
          order_id: orderId,
          status: "settlement",
          email: primary.email,
          nik: primary.nik,
          transaction_id: primary.transaction_id,
          transaction_time: primary.transaction_time,
          payment_type: primary.payment_type,
        },
        tickets,
      });
    }

    // 2. If qr_detail doesn't have documents yet, check payment_status collection
    const paymentDoc = await db.collection("payment_status").doc(orderId).get();

    if (paymentDoc.exists) {
      const pData = paymentDoc.data()!;
      const pStatus = (pData.status || "pending").toLowerCase();
      const pEmail = pData.email || "";
      const pNik = Array.isArray(pData.nik)
        ? pData.nik[0]
        : String(pData.nik || "-");

      if (pStatus === "settlement" || pStatus === "capture") {
        // Payment is settled, but webhook is still building qr_detail tickets
        return NextResponse.json({
          success: true,
          status: pStatus,
          isTicketsProcessing: true,
          message: "Pembayaran telah berhasil, tiket Anda sedang diproses oleh sistem.",
          order: {
            order_id: orderId,
            status: pStatus,
            email: pEmail,
            nik: pNik,
            transaction_id: pData.transaction_id || "-",
            transaction_time: serializeDate(pData.createdAt),
            payment_type: pData.payment_type || "-",
          },
          tickets: [],
        });
      }

      if (pStatus === "pending") {
        return NextResponse.json({
          success: false,
          status: "pending",
          message: "Pembayaran masih dalam status menunggu (pending).",
          order: {
            order_id: orderId,
            status: "pending",
            email: pEmail,
            nik: pNik,
            transaction_id: "-",
            transaction_time: serializeDate(pData.createdAt),
            payment_type: "-",
          },
          tickets: [],
        });
      }

      // Expire, cancel, deny, or failed
      return NextResponse.json({
        success: false,
        status: pStatus,
        message: `Transaksi pembayaran berstatus '${pStatus.toUpperCase()}'.`,
        order: {
          order_id: orderId,
          status: pStatus,
          email: pEmail,
          nik: pNik,
          transaction_id: "-",
          transaction_time: serializeDate(pData.createdAt),
          payment_type: "-",
        },
        tickets: [],
      });
    }

    // Also try querying payment_status by order_id field
    const paymentSnapQuery = await db
      .collection("payment_status")
      .where("order_id", "==", orderId)
      .limit(1)
      .get();

    if (!paymentSnapQuery.empty) {
      const pData = paymentSnapQuery.docs[0].data();
      const pStatus = (pData.status || "pending").toLowerCase();
      const pEmail = pData.email || "";
      const pNik = Array.isArray(pData.nik)
        ? pData.nik[0]
        : String(pData.nik || "-");

      if (pStatus === "settlement" || pStatus === "capture") {
        return NextResponse.json({
          success: true,
          status: pStatus,
          isTicketsProcessing: true,
          message: "Pembayaran telah berhasil, tiket Anda sedang diproses oleh sistem.",
          order: {
            order_id: orderId,
            status: pStatus,
            email: pEmail,
            nik: pNik,
            transaction_id: pData.transaction_id || "-",
            transaction_time: serializeDate(pData.createdAt),
            payment_type: pData.payment_type || "-",
          },
          tickets: [],
        });
      }

      return NextResponse.json({
        success: false,
        status: pStatus,
        message: `Transaksi pembayaran berstatus '${pStatus.toUpperCase()}'.`,
        order: {
          order_id: orderId,
          status: pStatus,
          email: pEmail,
          nik: pNik,
          transaction_id: "-",
          transaction_time: serializeDate(pData.createdAt),
          payment_type: "-",
        },
        tickets: [],
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Order ID tidak ditemukan.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("GET /api/tickets/by-order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server saat mengambil data tiket.",
      },
      { status: 500 }
    );
  }
}
