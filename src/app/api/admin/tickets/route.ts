import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/libs/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!verifyAdminSessionToken(token)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const filterStatus = req.nextUrl.searchParams.get("status") || "all"; // all, scanned, unscanned

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const qrSnap = await db.collection("qr_detail").get();
    let tickets = qrSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Apply search filter
    if (search) {
      const cleanSearch = search
        .replace(/\.pdf$/i, "")
        .replace(/^e[-_]?ticket[-_]?/i, "")
        .replace(/^e[-_]?coupon[-_]?/i, "")
        .replace(/^e[-_]?kupon[-_]?/i, "")
        .trim();

      tickets = tickets.filter((t: any) => {
        const name = String(t.name || "").toLowerCase();
        const email = String(t.email || "").toLowerCase();
        const nik = String(t.nik || "").toLowerCase();
        const orderId = String(t.order_id || "").toLowerCase();
        const qrCode = String(t.qr_code || "").toLowerCase();
        const transactionId = String(t.transaction_id || "").toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          nik.includes(search) ||
          orderId.includes(search) ||
          qrCode.includes(search) ||
          transactionId.includes(search) ||
          (cleanSearch && qrCode.includes(cleanSearch))
        );
      });
    }

    // Apply status filter
    if (filterStatus === "scanned") {
      tickets = tickets.filter((t: any) => t.isScanned === true);
    } else if (filterStatus === "unscanned") {
      tickets = tickets.filter((t: any) => !t.isScanned);
    }

    return NextResponse.json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    console.error("GET /api/admin/tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar tiket." },
      { status: 500 }
    );
  }
}
