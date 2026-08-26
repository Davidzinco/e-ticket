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

    const paymentSnap = await db.collection("payment_status").get();
    const orders = paymentSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar order." },
      { status: 500 }
    );
  }
}
