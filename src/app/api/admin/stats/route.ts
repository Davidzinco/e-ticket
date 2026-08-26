import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/admin";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/libs/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!verifyAdminSessionToken(token)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Sesi admin tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      // Mock stats for dev/demo mode
      return NextResponse.json({
        success: true,
        data: {
          totalTickets: 24,
          vipTickets: 8,
          festivalTickets: 16,
          totalRevenue: 2016000,
          scannedCount: 10,
          unscannedCount: 14,
          recentTickets: [],
          isDemoMode: true,
        },
      });
    }

    // 1. Fetch qr_detail docs
    const qrSnap = await db.collection("qr_detail").get();
    const tickets = qrSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    let scannedCount = 0;
    let unscannedCount = 0;
    let vipCount = 0;
    let festivalCount = 0;
    let totalRevenue = 0;

    // 2. Fetch event data to know prices and stock
    const eventSnap = await db.collection("event").doc("5W7jcnr28tGc5E8tywRl").get();
    const eventData = eventSnap.exists ? eventSnap.data() : null;
    const festivalPrice = Number(eventData?.price_festival || eventData?.price || 56000);
    const vipPrice = Number(eventData?.price_vip || 140000);

    for (const t of tickets as any[]) {
      if (t.isScanned) {
        scannedCount += 1;
      } else {
        unscannedCount += 1;
      }

      const eventName = String(t.event_name || "").toLowerCase();
      if (eventName.includes("vip")) {
        vipCount += 1;
        totalRevenue += vipPrice;
      } else {
        festivalCount += 1;
        totalRevenue += festivalPrice;
      }
    }

    // 3. Fetch pending/recent orders
    const paymentSnap = await db
      .collection("payment_status")
      .limit(10)
      .get();
    const pendingOrdersCount = paymentSnap.docs.filter(
      (d) => d.data().status === "pending"
    ).length;

    // Recent 10 tickets
    const recentTickets = tickets.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalTickets: tickets.length,
        vipTickets: vipCount,
        festivalTickets: festivalCount,
        totalRevenue,
        scannedCount,
        unscannedCount,
        pendingOrdersCount,
        recentTickets,
        eventStock: eventData
          ? {
              totalStock: eventData.ticket ?? 1698,
              vipStock: eventData.ticket_vip ?? 100,
              festivalStock: eventData.ticket_festival ?? 500,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data statistik admin." },
      { status: 500 }
    );
  }
}
